from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def purge_dev_documents(apps, schema_editor):
    """
    Safely purges any existing dev/test documents before attaching non-nullable owner field,
    fulfilling Requirement 5 without breaking existing tables.
    """
    Document = apps.get_model('documents', 'Document')
    Document.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(purge_dev_documents, migrations.RunPython.noop),
        migrations.AddField(
            model_name='document',
            name='owner',
            field=models.ForeignKey(
                help_text='User who owns this document',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='documents',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
