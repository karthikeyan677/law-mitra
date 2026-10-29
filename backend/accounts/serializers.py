from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'email', 'preferred_language', 'text_size', 'created_at', 'updated_at')
        read_only_fields = ('id', 'email', 'created_at', 'updated_at')


class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    preferred_language = serializers.ChoiceField(
        choices=UserProfile.Language.choices,
        default=UserProfile.Language.ENGLISH,
        required=False
    )
    text_size = serializers.ChoiceField(
        choices=UserProfile.TextSize.choices,
        default=UserProfile.TextSize.NORMAL,
        required=False
    )

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized_email

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        preferred_language = validated_data.get('preferred_language', UserProfile.Language.ENGLISH)
        text_size = validated_data.get('text_size', UserProfile.TextSize.NORMAL)

        # Use email address as the username (case-insensitive, stored lowercase)
        user = User(
            username=email,
            email=email,
            is_active=True
        )
        user.set_password(password)
        user.save()

        # Update profile preferences
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.preferred_language = preferred_language
        profile.text_size = text_size
        profile.save()

        user.refresh_from_db()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        validate_password(value, self.context.get('request').user)
        return value


class AccountDeletionSerializer(serializers.Serializer):
    password = serializers.CharField(required=True, write_only=True)

    def validate_password(self, value):
        user = self.context.get('request').user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect password. Account deletion requires valid password confirmation.")
        return value
