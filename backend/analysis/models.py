import uuid
from django.db import models


class DetectedSection(models.Model):
    """
    Represents an explicitly written statutory section identified in a document's extracted text.
    Enforces Rule 3 (Zero Invention): only sections explicitly written in text are recorded.
    Cascade-deletes when parent Document is deleted.
    """
    class DetectionMethod(models.TextChoices):
        RULE = 'rule', 'Rule-based'
        MANUAL = 'manual', 'Manual'

    class ReviewStatus(models.TextChoices):
        AUTO = 'auto', 'Auto-detected'
        CONFIRMED = 'confirmed', 'Confirmed'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        'documents.Document',
        on_delete=models.CASCADE,
        related_name='detected_sections',
        help_text="Parent document"
    )
    page = models.ForeignKey(
        'documents.DocumentPage',
        on_delete=models.CASCADE,
        related_name='detected_sections',
        null=True,
        blank=True,
        help_text="Specific page where this section was found"
    )
    page_number = models.PositiveIntegerField(default=1, help_text="1-indexed page number")
    act_raw = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Text of Act name exactly as written in the document"
    )
    act_key = models.CharField(
        max_length=50,
        default="UNKNOWN",
        db_index=True,
        help_text="Normalised Act identifier (e.g. IPC, BNS, CRPC, BNSS, CPC, NI_ACT, UNKNOWN)"
    )
    section_number = models.CharField(
        max_length=50,
        help_text="Section number (e.g. 420, 498A, 138, 13(1))"
    )
    sub_clause = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Sub-clause if isolated (e.g. (1)(a))"
    )
    matched_text = models.TextField(
        help_text="Exact snippet from document text matching this detection"
    )
    start_char = models.PositiveIntegerField(
        help_text="Start offset within page's extracted text"
    )
    end_char = models.PositiveIntegerField(
        help_text="End offset within page's extracted text"
    )
    detection_method = models.CharField(
        max_length=20,
        choices=DetectionMethod.choices,
        default=DetectionMethod.RULE,
        help_text="Method used to detect this section"
    )
    review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.AUTO,
        db_index=True,
        help_text="User verification status: auto, confirmed, or rejected"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page_number', 'start_char']
        verbose_name = 'Detected Section'
        verbose_name_plural = 'Detected Sections'

    def __str__(self):
        return f"{self.act_key} Sec {self.section_number} (Pg {self.page_number}, {self.review_status})"


class LawMapping(models.Model):
    """
    Cross-reference table mapping old colonial acts (e.g., IPC, CrPC, IEA)
    to new criminal laws (e.g., BNS, BNSS, BSA).

    IMPORTANT SAFETY REQUIREMENT:
    This table and admin interface must remain EMPTY by default.
    DO NOT populate rows from AI memory or LLM hallucinations.
    Rows may ONLY be added after a human verifies them against official government sources
    (India Code / Official Gazette of India).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    old_act_key = models.CharField(max_length=50, db_index=True, help_text="e.g. IPC, CRPC, IEA")
    old_section = models.CharField(max_length=50, db_index=True, help_text="e.g. 420, 302, 144")
    new_act_key = models.CharField(max_length=50, db_index=True, help_text="e.g. BNS, BNSS, BSA")
    new_section = models.CharField(max_length=50, db_index=True, help_text="e.g. 318, 103")
    source_url = models.URLField(
        blank=True,
        default="",
        help_text="Link to official India Code gazette reference"
    )
    verified_on = models.DateField(
        null=True,
        blank=True,
        help_text="Date human verified this mapping against official gazette"
    )
    verified_by_human = models.BooleanField(
        default=False,
        help_text="Must be True only after human verification from India Code"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['old_act_key', 'old_section']
        unique_together = ('old_act_key', 'old_section', 'new_act_key', 'new_section')
        verbose_name = 'Law Mapping (Old to New)'
        verbose_name_plural = 'Law Mappings (Old to New)'

    def __str__(self):
        status = "Verified" if self.verified_by_human else "Unverified"
        return f"{self.old_act_key} Sec {self.old_section} -> {self.new_act_key} Sec {self.new_section} [{status}]"
