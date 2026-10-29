"""
URL configuration for Law Mithra project.

Endpoints:
- /admin/ : Django Administration
- /api/health/ : Health Check endpoint
- /api/schema/ : OpenAPI 3 JSON/YAML Schema
- /api/docs/ : Swagger UI documentation (drf-spectacular)
- /api/redoc/ : ReDoc documentation (drf-spectacular)
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from django.conf import settings
from django.conf.urls.static import static
from config.views import HealthCheckView

urlpatterns = [
    # Administration
    path('admin/', admin.site.urls),

    # Health Check Endpoint
    path('api/health/', HealthCheckView.as_view(), name='api-health'),

    # Authentication & Profile
    path('api/auth/', include('accounts.urls')),

    # Phase 1: Documents Vault & Extraction
    path('api/documents/', include('documents.urls')),

    # Phase 2: Section Detection (nested under documents for ownership-filtered endpoints)
    path('api/documents/<uuid:doc_id>/', include('analysis.urls')),

    # OpenAPI 3 Schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]


