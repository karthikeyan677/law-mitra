from django.contrib import admin
from .models import Document, DocumentPage


class DocumentPageInline(admin.TabularInline):
    model = DocumentPage
    extra = 0
    readonly_fields = ('page_number', 'word_count', 'ocr_confidence', 'created_at')
    fields = ('page_number', 'word_count', 'ocr_confidence', 'extracted_text')


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'status', 'page_count', 'file_size', 'created_at')
    list_filter = ('status', 'detected_language', 'created_at')
    search_fields = ('title', 'id', 'owner__email', 'owner__username')
    readonly_fields = ('id', 'file_size', 'page_count', 'created_at', 'updated_at')
    inlines = [DocumentPageInline]


@admin.register(DocumentPage)
class DocumentPageAdmin(admin.ModelAdmin):
    list_display = ('document', 'page_number', 'word_count', 'ocr_confidence', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('document__title', 'extracted_text')
