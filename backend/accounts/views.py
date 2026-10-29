import logging
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import UserProfile
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    AccountDeletionSerializer,
)

logger = logging.getLogger(__name__)

COOKIE_NAME = 'refresh_token'
COOKIE_PATH = '/api/auth/'
COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days


def set_refresh_cookie(response: Response, refresh_token: str):
    """Sets the refresh token in a secure, httpOnly, SameSite=Lax cookie."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=refresh_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite='Lax',
        secure=not settings.DEBUG,
        path=COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response):
    """Clears the refresh token cookie."""
    response.delete_cookie(key=COOKIE_NAME, path=COOKIE_PATH)


class RegisterView(APIView):
    """
    Public registration endpoint. Throttled per IP (5/minute).
    Creates User with email as username and auto-creates UserProfile.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_register'

    @extend_schema(
        summary="Register new user account",
        description="Creates a new account with email and password. Generates JWT tokens.",
        request=UserRegistrationSerializer,
        responses={201: OpenApiResponse(description="User registered successfully")},
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        logger.info(f"event=auth.register.success user_id={user.id}")

        refresh = RefreshToken.for_user(user)
        profile = UserProfile.objects.get(user=user)
        profile_serializer = UserProfileSerializer(profile)

        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': profile_serializer.data,
        }
        response = Response(response_data, status=status.HTTP_201_CREATED)
        set_refresh_cookie(response, str(refresh))
        return response


class LoginView(APIView):
    """
    Public login endpoint. Throttled per IP (5/minute).
    Authenticates by email and password, returns access token and sets refresh cookie.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

    @extend_schema(
        summary="User login",
        description="Authenticates user by email and password. Returns JWT access token.",
        request=UserLoginSerializer,
        responses={200: OpenApiResponse(description="Login successful")},
    )
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("event=auth.login.failed reason=invalid_credentials")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        logger.info(f"event=auth.login.success user_id={user.id}")

        refresh = RefreshToken.for_user(user)
        profile_serializer = UserProfileSerializer(user.profile)

        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': profile_serializer.data,
        }
        response = Response(response_data, status=status.HTTP_200_OK)
        set_refresh_cookie(response, str(refresh))
        return response


class RefreshTokenView(APIView):
    """
    Rotates refresh token and returns a new short-lived access token.
    Reads refresh token from cookie or request body.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Refresh access token",
        description="Issues a fresh access token and rotates the refresh token.",
        responses={200: OpenApiResponse(description="Token refreshed")},
    )
    def post(self, request):
        token_str = request.COOKIES.get(COOKIE_NAME) or request.data.get('refresh')
        if not token_str:
            return Response(
                {'detail': 'Refresh token not provided in cookie or payload.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            old_refresh = RefreshToken(token_str)
            # Create a new refresh token (rotation)
            user_id = old_refresh.payload.get('user_id')
            new_access_token = str(old_refresh.access_token)

            # Blacklist old refresh token
            try:
                old_refresh.blacklist()
            except AttributeError:
                pass

            # Create fresh rotating token for user
            from django.contrib.auth.models import User
            user = User.objects.get(id=user_id)
            new_refresh = RefreshToken.for_user(user)

            response = Response({
                'access': str(new_refresh.access_token),
                'refresh': str(new_refresh),
            }, status=status.HTTP_200_OK)
            set_refresh_cookie(response, str(new_refresh))
            return response

        except TokenError as e:
            logger.warning("event=auth.refresh.failed reason=token_error")
            response = Response({'detail': f'Token is invalid or expired: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)
            clear_refresh_cookie(response)
            return response
        except Exception as e:
            logger.warning("event=auth.refresh.failed reason=unknown_error")
            response = Response({'detail': 'Failed to refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
            clear_refresh_cookie(response)
            return response


class LogoutView(APIView):
    """
    Logs out the user, blacklists the refresh token, and clears the cookie.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="User logout",
        description="Blacklists current refresh token and clears session cookie.",
        responses={200: OpenApiResponse(description="Logged out successfully")},
    )
    def post(self, request):
        token_str = request.COOKIES.get(COOKIE_NAME) or request.data.get('refresh')
        user_id = getattr(request.user, 'id', None)
        logger.info(f"event=auth.logout user_id={user_id}")

        if token_str:
            try:
                token = RefreshToken(token_str)
                token.blacklist()
            except Exception:
                pass

        response = Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        clear_refresh_cookie(response)
        return response


class UserProfileView(APIView):
    """
    Retrieve or update user profile preferences (preferred_language, text_size).
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get user profile",
        description="Returns current authenticated user details and preferences.",
        responses={200: UserProfileSerializer},
    )
    def get(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update user profile",
        description="Update preferred language or text accessibility size.",
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
    )
    def patch(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info(f"event=auth.profile.updated user_id={request.user.id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Permanently delete account",
        description="Irreversibly deletes account, all documents, and all disk files. Requires password confirmation.",
        request=AccountDeletionSerializer,
        responses={204: OpenApiResponse(description="Account permanently deleted")},
    )
    def delete(self, request):
        serializer = AccountDeletionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user_id = user.id

        # Delete all documents individually so their delete() and signal hooks delete physical files
        for doc in user.documents.all():
            doc.delete()

        user.delete()
        logger.info(f"event=auth.account.deleted user_id={user_id}")

        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response



class ChangePasswordView(APIView):
    """
    Allows authenticated user to change their password.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Change account password",
        description="Validates current password and updates to new password.",
        request=ChangePasswordSerializer,
        responses={200: OpenApiResponse(description="Password changed successfully")},
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(current_password):
            return Response(
                {'current_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        logger.info(f"event=auth.password.changed user_id={user.id}")
        return Response({'detail': 'Password successfully changed.'}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    """
    Permanently deletes user account and triggers cascade hard-delete of
    all owned documents, pages, and physical files on disk. Requires password confirmation.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Permanently delete account",
        description="Irreversibly deletes account and all associated documents and files (Rule 6).",
        request=AccountDeletionSerializer,
        responses={204: OpenApiResponse(description="Account permanently deleted")},
    )
    def delete(self, request):
        serializer = AccountDeletionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user_id = user.id

        # Delete all documents individually so their delete() and signal hooks delete physical files
        for doc in user.documents.all():
            doc.delete()

        user.delete()
        logger.info(f"event=auth.account.deleted user_id={user_id}")

        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response
