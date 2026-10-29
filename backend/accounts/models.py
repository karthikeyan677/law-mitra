from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """
    User profile storing preferences (language, text accessibility size).
    Automatically created whenever a User record is created.
    """
    class Language(models.TextChoices):
        ENGLISH = 'en', 'English'
        KANNADA = 'kn', 'Kannada'
        HINDI = 'hi', 'Hindi'
        TELUGU = 'te', 'Telugu'
        TAMIL = 'ta', 'Tamil'
        MALAYALAM = 'ml', 'Malayalam'
        MARATHI = 'mr', 'Marathi'
        BENGALI = 'bn', 'Bengali'

    class TextSize(models.TextChoices):
        NORMAL = 'normal', 'Normal'
        LARGE = 'large', 'Large'
        XLARGE = 'xlarge', 'Extra Large'

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    preferred_language = models.CharField(
        max_length=5,
        choices=Language.choices,
        default=Language.ENGLISH,
        help_text="Preferred language code (en, kn, hi, te, ta, ml, mr, bn)"
    )
    text_size = models.CharField(
        max_length=10,
        choices=TextSize.choices,
        default=TextSize.NORMAL,
        help_text="Application-wide text size preference"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"Profile of {self.user.username} ({self.preferred_language}, {self.text_size})"


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """Ensure UserProfile is automatically created when a User is created."""
    if created:
        UserProfile.objects.get_or_create(user=instance)
