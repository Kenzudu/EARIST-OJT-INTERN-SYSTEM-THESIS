import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

templates = DocumentTemplate.objects.all()

print(f"\n{'='*60}")
print(f"ALL TEMPLATES:")
print(f"{'='*60}\n")

for template in templates:
    print(f"ID: {template.id}")
    print(f"Name: {template.name}")
    print(f"Type: {template.template_type}")
    print(f"College: {template.college if template.college else 'NULL (Global - visible to ALL)'}")
    print(f"Uploaded by: {template.uploaded_by.username if template.uploaded_by else 'N/A'}")
    
    # Check uploader's college
    if template.uploaded_by and hasattr(template.uploaded_by, 'coordinator_profile'):
        coord_college = template.uploaded_by.coordinator_profile.college
        print(f"Uploader's college: {coord_college}")
        
        # Update template to match coordinator's college
        if not template.college and coord_college:
            template.college = coord_college
            template.save()
            print(f"✅ Updated template college to: {coord_college}")
    
    print(f"-" * 60)

print(f"\n{'='*60}")
print(f"✅ Templates updated with correct colleges!")
print(f"{'='*60}\n")
