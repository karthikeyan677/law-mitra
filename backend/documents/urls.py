from django.urls import path
from .views import (
    DocumentListCreateView,
    DocumentDetailView,
    DocumentReprocessView,
    DocumentDownloadView,
)

urlpatterns = [
    path('', DocumentListCreateView.as_view(), name='document-list-create'),
    path('upload/', DocumentListCreateView.as_view(), name='document-upload'),
    path('<uuid:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('<uuid:pk>/download/', DocumentDownloadView.as_view(), name='document-download'),
    path('<uuid:pk>/reprocess/', DocumentReprocessView.as_view(), name='document-reprocess'),
]
