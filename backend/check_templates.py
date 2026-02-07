import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

count = DocumentTemplate.objects.count()
print(f"Total Templates in DB: {count}")
all_temps = DocumentTemplate.objects.all()
for t in all_temps:
    print(f"ID: {t.id} | Name: {t.name} | Active: {t.is_active} | College: '{t.college}' | UploadedBy: {t.uploaded_by}")

if count > 0:
    first = all_temps.first()
    print(f"Sample College Raw: {repr(first.college)}")
    print(f"Sample IsActive Raw: {repr(first.is_active)}")
