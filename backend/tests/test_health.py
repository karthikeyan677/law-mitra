import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    """Provides a fresh Django REST Framework APIClient instance."""
    return APIClient()


def test_health_check_endpoint(api_client):
    """
    Test GET /api/health/ returns 200 OK and expected JSON payload:
    {"status": "ok", "service": "law-mithra-api"}
    """
    url = reverse('api-health')
    assert url == '/api/health/'

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "status": "ok",
        "service": "law-mithra-api"
    }
    assert response.headers['Content-Type'].startswith('application/json')


def test_openapi_schema_endpoint(api_client):
    """
    Test OpenAPI 3 schema at /api/schema/ is generated and returns 200 OK.
    """
    url = reverse('schema')
    assert url == '/api/schema/'

    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK


