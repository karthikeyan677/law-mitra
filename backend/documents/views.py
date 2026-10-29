from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Document
from .serializers import (
    DocumentUploadSerializer,
    DocumentDetailSerializer,
    DocumentListSerializer,
)
from .services.extractor import trigger_document_processing_async, process_document


class DocumentListCreateView(generics.ListCreateAPIView):
    """
    List uploaded documents or upload a new legal document (PDF / image).
    Uploading triggers the OCR & parsing pipeline.
    """
    queryset = Document.objects.all().prefetch_related('pages')
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DocumentUploadSerializer
        return DocumentListSerializer

    @extend_schema(
        summary="List uploaded documents",
        description="Returns all documents in the user's vault, ordered by creation date descending.",
        responses={200: DocumentListSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Upload legal document",
        description="Upload a PDF or image file (max 25MB). Asynchronously extracts text and pages.",
        responses={
            201: DocumentDetailSerializer,
            400: OpenApiResponse(description="Invalid file format or file size exceeded"),
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        document = serializer.save()

        # Trigger extraction
        # If running in tests or requested synchronously via query param `?sync=true`
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
    Deletion adheres to Rule 6 of the AI Safety Contract (Permanent Data Deletion).
    """
    queryset = Document.objects.all().prefetch_related('pages')
    serializer_class = DocumentDetailSerializer
    lookup_field = 'pk'

    @extend_schema(
        summary="Get document details & pages",
        description="Returns document metadata, OCR status, and extracted text for every page.",
        responses={200: DocumentDetailSerializer, 404: OpenApiResponse(description="Document not found")},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Permanently delete document",
        description="Permanently deletes the document and all associated pages from both database and disk.",
        responses={204: OpenApiResponse(description="Document permanently deleted")},
    )
    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentReprocessView(APIView):
    """
    Re-triggers parsing & OCR for a document.
    """
    @extend_schema(
        summary="Reprocess document OCR",
        description="Re-runs OCR and page extraction on an existing document.",
        responses={202: OpenApiResponse(description="Reprocessing started")},
    )
    def post(self, request, pk, *args, **kwargs):
        try:
            document = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        trigger_document_processing_async(str(document.id))
        return Response(
            {"message": "Document reprocessing started.", "status": "processing"},
            status=status.HTTP_202_ACCEPTED
        )
