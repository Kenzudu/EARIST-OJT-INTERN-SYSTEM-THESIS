from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_application_resume_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='internship',
            name='position_type',
            field=models.CharField(
                max_length=50,
                default='Full-time',
                choices=[
                    ('Full-time', 'Full-time'),
                    ('Part-time', 'Part-time'),
                    ('Contract', 'Contract'),
                    ('Freelance', 'Freelance'),
                ],
                help_text="Type of internship position"
            ),
        ),
    ]
