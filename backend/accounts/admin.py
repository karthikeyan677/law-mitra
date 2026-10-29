from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'get_language', 'get_text_size', 'is_staff', 'date_joined')

    def get_language(self, instance):
        return getattr(instance.profile, 'preferred_language', 'en')
    get_language.short_description = 'Language'

    def get_text_size(self, instance):
        return getattr(instance.profile, 'text_size', 'normal')
    get_text_size.short_description = 'Text Size'


admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_language', 'text_size', 'created_at')
    list_filter = ('preferred_language', 'text_size')
    search_fields = ('user__username', 'user__email')
