import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate
from core.serializers import DocumentTemplateSerializer

print("Checking serialization...")
templates = DocumentTemplate.objects.filter(is_active=True).order_by('-created_at')
count = 0
none_uploader_count = 0
endorsement_count = 0
failures = 0

for t in templates:
    try:
        s = DocumentTemplateSerializer(t)
        data = s.data
        count += 1
        
        if t.template_type == 'Endorsement Letter':
            print(f"\n[TARGET] FOUND Endorsement Letter: ID={t.id}, Name='{t.name}', Active={t.is_active}, UploadedBy={t.uploaded_by}")
            endorsement_count += 1
            
        if t.uploaded_by is None:
            none_uploader_count += 1
            # print(f"  Warning: Template ID={t.id} has no uploader.")

    except Exception as e:
        print(f"FAILED on Template ID {t.id} ({t.name}) Type: {t.template_type}: {e}")
        failures += 1

print(f"\nSuccessfully serialized {count} out of {templates.count()}")
print(f"Endorsement Count: {endorsement_count}")
print(f"None Uploader Count: {none_uploader_count}")
print(f"Failures: {failures}")
