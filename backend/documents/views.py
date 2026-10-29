import os
import logging
from django.http import FileResponse, Http404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Document
from .serializers import (
    DocumentUploadSerializer,
    DocumentDetailSerializer,
    DocumentListSerializer,
)
from .services.extractor import trigger_document_processing_async, process_document

logger = logging.getLogger(__name__)


class DocumentListCreateView(generics.ListCreateAPIView):
    """
    List uploaded documents for the authenticated user, or upload a new legal document.
    Enforces user ownership (Rule 7) and per-user upload throttling (Rule 8).
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'doc_upload'

    def get_queryset(self):
        # Strict user-level filtering: only documents owned by current authenticated user
        return Document.objects.filter(owner=self.request.user).prefetch_related('pages')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DocumentUploadSerializer
        return DocumentListSerializer

    @extend_schema(
        summary="List user's uploaded documents",
        description="Returns all documents in the authenticated user's private vault.",
        responses={200: DocumentListSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Upload legal document",
        description="Upload a PDF or image file (max 25MB) to authenticated user's vault. Extracts text asynchronously.",
        responses={
            201: DocumentDetailSerializer,
            400: OpenApiResponse(description="Invalid file format or file size exceeded"),
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        document = serializer.save()

        # Log event with only IDs (Privacy Rule 9)
        logger.info(f"event=document.uploaded doc_id={document.id} user_id={request.user.id}")

        # Trigger extraction
        sync = request.query_params.get('sync', 'false').lower() == 'true'
        if sync:
            process_document(str(document.id))
            document.refresh_from_db()
        else:
            trigger_document_processing_async(str(document.id))

        detail_serializer = DocumentDetailSerializer(document, context={'request': request})
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    """
    Retrieve document details and extracted pages, or permanently delete the document.
    Ownership checked via get_queryset(). Returns 404 if not found or owned by another user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentDetailSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        # Privacy Rule 7: Filter by owner=request.user. Non-owned documents raise 404 (not 403)
        return Document.objects.filter(owner=self.request.user).prefetch_related('pages')

    @extend_schema(
        summary="Get document details & pages",
        description="Returns document metadata, OCR status, and extracted text for every page.",
        responses={200: DocumentDetailSerializer, 404: OpenApiResponse(description="Document not found")},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Permanently delete document",
        description="Permanently deletes the document and all associated pages from both database and disk (Rule 6 & 10).",
        responses={204: OpenApiResponse(description="Document permanently deleted")},
    )
    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        doc_id = instance.id
        instance.delete()
        logger.info(f"event=document.deleted doc_id={doc_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentReprocessView(APIView):
    """
    Re-triggers parsing & OCR for a document. Enforces user ownership.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Reprocess document OCR",
        description="Re-runs OCR and page extraction on an existing document owned by the user.",
        responses={
            202: OpenApiResponse(description="Reprocessing started"),
            404: OpenApiResponse(description="Document not found"),
        },
    )
    def post(self, request, pk, *args, **kwargs):
        # Privacy Rule 7: Return 404 if document does not exist or belongs to another user
        try:
            document = Document.objects.get(pk=pk, owner=request.user)
        except Document.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"event=document.reprocess doc_id={document.id} user_id={request.user.id}")
        trigger_document_processing_async(str(document.id))
        return Response(
            {"message": "Document reprocessing started.", "status": "processing"},
            status=status.HTTP_202_ACCEPTED
        )


class DocumentDownloadView(APIView):
    """
    Authenticated file download endpoint (Rule 11).
    Files are never served publicly. Checks ownership and returns binary stream.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Download original document file",
        description="Securely downloads the original uploaded file. Verifies user ownership.",
        responses={
            200: OpenApiResponse(description="Binary file download"),
            404: OpenApiResponse(description="Document or file not found"),
        },
    )
    def get(self, request, pk, *args, **kwargs):
        # Privacy Rule 7 & 11: 404 if not found or belongs to another user
        try:
            document = Document.objects.get(pk=pk, owner=request.user)
        except Document.DoesNotExist:
            raise Http404("Document not found.")

        if not document.file or not os.path.isfile(document.file.path):
            raise Http404("Document file not found on disk.")

        logger.info(f"event=document.download doc_id={document.id} user_id={request.user.id}")

        response = FileResponse(
            open(document.file.path, 'rb'),
            as_attachment=True,
            filename=os.path.basename(document.file.name)
        )
        return response
