"""
Views for Legal Section Detection endpoints.
All endpoints are ownership-filtered: other users get 404, unauthenticated gets 401.
"""

import logging
from collections import OrderedDict
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse

from documents.models import Document, DocumentPage
from analysis.models import DetectedSection
from analysis.serializers import (
    DetectedSectionSerializer,
    DetectedSectionUpdateSerializer,
    ManualSectionCreateSerializer,
)
from analysis.services.section_detector import detect_sections_for_document

logger = logging.getLogger(__name__)


def _get_owned_document(doc_id, user):
    """
    Get a document owned by the given user, or None.
    Returns None instead of raising to let views return 404 uniformly.
    """
    try:
        return Document.objects.get(id=doc_id, owner=user)
    except Document.DoesNotExist:
        return None


class DetectSectionsView(APIView):
    """
    POST /api/documents/<doc_id>/detect-sections/

    Re-runs deterministic rule-based section detection on all pages of a document.
    Replaces old auto-detected results while preserving confirmed and manual items.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Run section detection on document",
        description=(
            "Re-runs deterministic rule-based section detection on all pages. "
            "Replaces old auto-detected results while preserving confirmed and manually added items."
        ),
        responses={
            200: DetectedSectionSerializer(many=True),
            404: OpenApiResponse(description="Document not found or not owned by user"),
        },
    )
    def post(self, request, doc_id):
        document = _get_owned_document(doc_id, request.user)
        if not document:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"event=section_detection.manual_trigger doc_id={doc_id} user_id={request.user.id}")
        sections = detect_sections_for_document(str(document.id))
        serializer = DetectedSectionSerializer(sections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SectionListCreateView(APIView):
    """
    GET  /api/documents/<doc_id>/sections/  → list grouped by act_key with counts
    POST /api/documents/<doc_id>/sections/  → manually add a section
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List detected sections grouped by Act",
        description=(
            "Returns all detected sections for a document, grouped by act_key with per-group counts."
        ),
        responses={200: OpenApiResponse(description="Grouped section list with total_count and groups")},
    )
    def get(self, request, doc_id):
        document = _get_owned_document(doc_id, request.user)
        if not document:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        sections = DetectedSection.objects.filter(document=document).order_by('page_number', 'start_char')
        serializer = DetectedSectionSerializer(sections, many=True)

        # Group by act_key, preserving insertion order
        groups: OrderedDict = OrderedDict()
        for section_data in serializer.data:
            key = section_data['act_key']
            if key not in groups:
                groups[key] = {'act_key': key, 'count': 0, 'sections': []}
            groups[key]['count'] += 1
            groups[key]['sections'].append(section_data)

        return Response({
            'total_count': sections.count(),
            'groups': list(groups.values()),
        })

    @extend_schema(
        summary="Manually add a section",
        description=(
            "Add a section manually by specifying page_number, start_char, end_char. "
            "The exact text slice page_text[start_char:end_char] is stored as matched_text."
        ),
        request=ManualSectionCreateSerializer,
        responses={
            201: DetectedSectionSerializer,
            400: OpenApiResponse(description="Invalid offsets or page not found"),
            404: OpenApiResponse(description="Document not found"),
        },
    )
    def post(self, request, doc_id):
        document = _get_owned_document(doc_id, request.user)
        if not document:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ManualSectionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Find the page by page_number
        try:
            page = document.pages.get(page_number=data['page_number'])
        except DocumentPage.DoesNotExist:
            return Response(
                {"detail": f"Page {data['page_number']} not found in this document."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_char = data['start_char']
        end_char = data['end_char']

        # Validate offsets against page text length
        if start_char >= end_char or end_char > len(page.extracted_text):
            return Response(
                {"detail": "Invalid character offsets for this page's text."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Store the exact text slice (Rule 3: Zero Invention)
        matched_text = page.extracted_text[start_char:end_char]

        section = DetectedSection.objects.create(
            document=document,
            page=page,
            page_number=data['page_number'],
            act_raw='',
            act_key=data.get('act_key', 'UNKNOWN'),
            section_number=data['section_number'],
            sub_clause=data.get('sub_clause', ''),
            matched_text=matched_text,
            start_char=start_char,
            end_char=end_char,
            detection_method=DetectedSection.DetectionMethod.MANUAL,
            review_status=DetectedSection.ReviewStatus.AUTO,
        )

        logger.info(f"event=section.manual_add doc_id={doc_id} section_id={section.id} user_id={request.user.id}")
        return Response(DetectedSectionSerializer(section).data, status=status.HTTP_201_CREATED)


class SectionDetailView(APIView):
    """
    PATCH  /api/documents/<doc_id>/sections/<section_id>/  → confirm/reject or edit
    DELETE /api/documents/<doc_id>/sections/<section_id>/  → delete manual items only
    """
    permission_classes = [IsAuthenticated]

    def _get_section(self, doc_id, section_id, user):
        """Get (document, section) tuple. Returns (None, None) if document not owned."""
        document = _get_owned_document(doc_id, user)
        if not document:
            return None, None
        try:
            section = DetectedSection.objects.get(id=section_id, document=document)
            return document, section
        except DetectedSection.DoesNotExist:
            return document, None

    @extend_schema(
        summary="Update section (confirm/reject/edit)",
        description=(
            "Change review_status to confirmed or rejected, or edit act_key and section_number."
        ),
        request=DetectedSectionUpdateSerializer,
        responses={
            200: DetectedSectionSerializer,
            404: OpenApiResponse(description="Document or section not found"),
        },
    )
    def patch(self, request, doc_id, section_id):
        document, section = self._get_section(doc_id, section_id, request.user)
        if not document:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if not section:
            return Response({"detail": "Section not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DetectedSectionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        update_fields = ['updated_at']
        if 'review_status' in data:
            section.review_status = data['review_status']
            update_fields.append('review_status')
        if 'act_key' in data:
            section.act_key = data['act_key']
            update_fields.append('act_key')
        if 'section_number' in data:
            section.section_number = data['section_number']
            update_fields.append('section_number')

        section.save(update_fields=update_fields)
        logger.info(f"event=section.updated doc_id={doc_id} section_id={section_id} user_id={request.user.id}")
        return Response(DetectedSectionSerializer(section).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete a manually added section",
        description="Only sections with detection_method='manual' can be deleted via this endpoint.",
        responses={
            204: OpenApiResponse(description="Section deleted"),
            400: OpenApiResponse(description="Only manual sections can be deleted"),
            404: OpenApiResponse(description="Document or section not found"),
        },
    )
    def delete(self, request, doc_id, section_id):
        document, section = self._get_section(doc_id, section_id, request.user)
        if not document:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if not section:
            return Response({"detail": "Section not found."}, status=status.HTTP_404_NOT_FOUND)

        if section.detection_method != DetectedSection.DetectionMethod.MANUAL:
            return Response(
                {"detail": "Only manually added sections can be deleted. Use reject to dismiss auto-detected sections."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        section_id_str = str(section.id)
        section.delete()
        logger.info(f"event=section.deleted doc_id={doc_id} section_id={section_id_str} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)
