"""
Core configuration views for Law Mithra API.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse


class HealthCheckView(APIView):
    """
    Health check endpoint returning system status and service name.
    Used for monitoring, orchestration readiness probes, and frontend status badge.
    """
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        summary="API Health Check",
        description="Returns current operational status of the Law Mithra backend service.",
        responses={
            200: OpenApiResponse(
                description="API is healthy and reachable.",
                examples=[
                    {
                        "status": "ok",
                        "service": "law-mithra-api"
                    }
                ]
            )
        },
        tags=["Health"]
    )
    def get(self, request, *args, **kwargs):
        return Response(
            {
                "status": "ok",
                "service": "law-mithra-api"
            },
            status=status.HTTP_200_OK
        )
