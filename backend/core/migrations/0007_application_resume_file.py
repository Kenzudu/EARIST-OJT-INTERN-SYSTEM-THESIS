from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_application_cover_letter_resume_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='resume_file',
            field=models.FileField(blank=True, null=True, upload_to='application_resumes/'),
        ),
    ]

