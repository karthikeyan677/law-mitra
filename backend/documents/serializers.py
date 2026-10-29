import os
from rest_framework import serializers
from .models import Document, DocumentPage

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB
ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tiff', '.bmp', '.txt'}


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)

    class Meta:
        model = Document
        fields = ('id', 'title', 'file', 'status', 'created_at')
        read_only_fields = ('id', 'status', 'created_at')

    def validate_file(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        if value.size > MAX_FILE_SIZE:
            max_mb = MAX_FILE_SIZE // (1024 * 1024)
            raise serializers.ValidationError(f"File size exceeds maximum allowed limit of {max_mb}MB.")

        return value

    def create(self, validated_data):
        file_obj = validated_data['file']
        title = validated_data.get('title')
        if not title:
            # Fall back to file base name
            title = os.path.splitext(file_obj.name)[0].replace('_', ' ').title()

        content_type = getattr(file_obj, 'content_type', '')
        if not content_type:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext == '.pdf':
                content_type = 'application/pdf'
            elif ext in ('.jpg', '.jpeg'):
                content_type = 'image/jpeg'
            elif ext == '.png':
                content_type = 'image/png'
            else:
                content_type = 'application/octet-stream'

        document = Document.objects.create(
            title=title,
            file=file_obj,
            file_type=content_type,
            file_size=file_obj.size,
            status=Document.Status.PENDING,
        )
        return document


class DocumentPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentPage
        fields = (
            'id',
            'page_number',
            'extracted_text',
            'ocr_confidence',
            'word_count',
            'created_at',
        )


class DocumentDetailSerializer(serializers.ModelSerializer):
    pages = DocumentPageSerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = (
            'id',
            'title',
            'file_url',
            'file_type',
            'file_size',
            'page_count',
            'status',
            'error_message',
            'detected_language',
            'created_at',
            'updated_at',
            'pages',
        )

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class DocumentListSerializer(serializers.ModelSerializer):
    total_words = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = (
            'id',
            'title',
            'file_type',
            'file_size',
            'page_count',
            'status',
            'detected_language',
            'created_at',
            'updated_at',
            'total_words',
        )

    def get_total_words(self, obj):
        return sum(page.word_count for page in obj.pages.all())
