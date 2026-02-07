import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

# Find and delete templates that have student names (these are generated documents, not templates)
templates = DocumentTemplate.objects.all()

print(f"\n{'='*60}")
print(f"CURRENT TEMPLATES IN DATABASE:")
print(f"{'='*60}\n")

for template in templates:
    print(f"ID: {template.id}")
    print(f"Name: {template.name}")
    print(f"Type: {template.template_type}")
    print(f"Uploaded by: {template.uploaded_by.username if template.uploaded_by else 'N/A'}")
    print(f"Description: {template.description}")
    print(f"-" * 60)

print(f"\n{'='*60}")
print(f"DELETING ALL TEMPLATES...")
print(f"{'='*60}\n")

# Delete all templates (so coordinator can upload fresh blank ones)
count = templates.count()
templates.delete()

print(f"✅ Deleted {count} template(s)")
print(f"\nNow coordinators can upload BLANK templates that all students can use.")
print(f"{'='*60}\n")
