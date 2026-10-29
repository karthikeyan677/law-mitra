from django.contrib import admin
from .models import DetectedSection, LawMapping


@admin.register(DetectedSection)
class DetectedSectionAdmin(admin.ModelAdmin):
    list_display = (
        'section_number',
        'act_key',
        'document',
        'page_number',
        'review_status',
        'detection_method',
        'created_at'
    )
    list_filter = ('act_key', 'review_status', 'detection_method', 'created_at')
    search_fields = ('section_number', 'act_raw', 'matched_text', 'document__title')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(LawMapping)
class LawMappingAdmin(admin.ModelAdmin):
    """
    Law Mapping Admin: Remains EMPTY by default.
    Only human operators may add entries after verifying against India Code / official gazette.
    """
    list_display = (
        'old_act_key',
        'old_section',
        'new_act_key',
        'new_section',
        'verified_by_human',
        'verified_on'
    )
    list_filter = ('old_act_key', 'new_act_key', 'verified_by_human')
    search_fields = ('old_section', 'new_section', 'source_url')
    readonly_fields = ('id', 'created_at', 'updated_at')
