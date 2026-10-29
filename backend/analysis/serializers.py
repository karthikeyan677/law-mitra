"""
Serializers for the Legal Section Detection feature.
Read and write serializers for DetectedSection model.
"""

from rest_framework import serializers
from analysis.models import DetectedSection


class DetectedSectionSerializer(serializers.ModelSerializer):
    """Read-only serializer for detected sections."""

    class Meta:
        model = DetectedSection
        fields = (
            'id',
            'page_number',
            'act_raw',
            'act_key',
            'section_number',
            'sub_clause',
            'matched_text',
            'start_char',
            'end_char',
            'detection_method',
            'review_status',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields


class DetectedSectionUpdateSerializer(serializers.Serializer):
    """
    Write serializer for PATCH: confirm/reject a section or edit act_key/section_number.
    At least one field must be provided.
    """
    review_status = serializers.ChoiceField(
        choices=[('confirmed', 'Confirmed'), ('rejected', 'Rejected')],
        required=False,
    )
    act_key = serializers.CharField(max_length=50, required=False)
    section_number = serializers.CharField(max_length=50, required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one field (review_status, act_key, or section_number) must be provided.")
        return attrs


class ManualSectionCreateSerializer(serializers.Serializer):
    """
    Write serializer for POST: manually add a section by specifying page offsets.
    The backend slices page_text[start_char:end_char] to store matched_text.
    """
    page_number = serializers.IntegerField(min_value=1)
    start_char = serializers.IntegerField(min_value=0)
    end_char = serializers.IntegerField(min_value=1)
    section_number = serializers.CharField(max_length=50)
    act_key = serializers.CharField(max_length=50, required=False, default='UNKNOWN')
    sub_clause = serializers.CharField(max_length=100, required=False, default='', allow_blank=True)

