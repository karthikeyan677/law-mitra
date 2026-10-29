import uuid
import os
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_delete
from django.dispatch import receiver


class Document(models.Model):
    """
    Represents an uploaded legal document (PDF, notice, petition, order, image).
    Subject to AI Safety Contract Rule 6 (Data Sovereignty): permanent deletion.
    Belongs strictly to its owning User.
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='documents',
        help_text="User who owns this document"
    )
    title = models.CharField(max_length=255, help_text="User-provided or derived document title")
    file = models.FileField(upload_to='documents/%Y/%m/', help_text="Stored document file")
    file_type = models.CharField(max_length=50, blank=True, default='', help_text="e.g. application/pdf, image/png")
    file_size = models.BigIntegerField(default=0, help_text="File size in bytes")
    page_count = models.PositiveIntegerField(default=0, help_text="Total number of detected pages")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
        help_text="Current OCR / parsing status"
    )
    error_message = models.TextField(blank=True, default='', help_text="Error message if processing failed")
    detected_language = models.CharField(max_length=50, blank=True, default='en', help_text="Detected document language")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'

    def __str__(self):
        return f"{self.title} ({self.status}) - {self.id}"

    def delete(self, *args, **kwargs):
        """
        Enforce Rule 6 of Law Mithra AI Safety Contract (Data Sovereignty):
        Permanent one-click deletion removes both database record and physical disk media.
        """
        if self.file and os.path.isfile(self.file.path):
            try:
                os.remove(self.file.path)
            except OSError:
                pass
        super().delete(*args, **kwargs)


class DocumentPage(models.Model):
    """
    Represents an individual page within a legal document, with its extracted OCR text.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='pages',
        help_text="Parent document"
    )
    page_number = models.PositiveIntegerField(help_text="1-indexed page number")
    extracted_text = models.TextField(blank=True, default='', help_text="Raw extracted text from OCR/parser")
    ocr_confidence = models.FloatField(null=True, blank=True, help_text="OCR confidence percentage if applicable")
    word_count = models.PositiveIntegerField(default=0, help_text="Count of words on this page")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['page_number']
        unique_together = ('document', 'page_number')
        verbose_name = 'Document Page'
        verbose_name_plural = 'Document Pages'

    def __str__(self):
        return f"{self.document.title} - Page {self.page_number}"

    def save(self, *args, **kwargs):
        if self.extracted_text:
            self.word_count = len(self.extracted_text.split())
        else:
            self.word_count = 0
        super().save(*args, **kwargs)


@receiver(post_delete, sender=Document)
def cleanup_document_file_on_delete(sender, instance, **kwargs):
    """
    Ensure physical disk files are destroyed when documents are deleted
    directly or via cascade deletion when a user account is deleted (Rule 6).
    """
    if instance.file and os.path.isfile(instance.file.path):
        try:
            os.remove(instance.file.path)
        except OSError:
            pass
