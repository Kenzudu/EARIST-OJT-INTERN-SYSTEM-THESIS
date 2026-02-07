# Generated migration for adding cover_letter and resume_url to Application model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_studentprofile_resume'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='cover_letter',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='application',
            name='resume_url',
            field=models.URLField(blank=True, help_text="URL to student's resume (e.g., Google Drive, Dropbox link)"),
        ),
    ]

