"""
URL patterns for Legal Section Detection endpoints.
All mounted under /api/documents/<uuid:doc_id>/ via config/urls.py.
"""

from django.urls import path
from analysis.views import DetectSectionsView, SectionListCreateView, SectionDetailView

urlpatterns = [
    path('detect-sections/', DetectSectionsView.as_view(), name='detect-sections'),
    path('sections/', SectionListCreateView.as_view(), name='section-list-create'),
    path('sections/<uuid:section_id>/', SectionDetailView.as_view(), name='section-detail'),
]

