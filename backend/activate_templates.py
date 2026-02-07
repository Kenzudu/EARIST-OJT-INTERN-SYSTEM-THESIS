import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

count = DocumentTemplate.objects.count()
print(f"Enhancing {count} templates...")

# Activate all
updated = DocumentTemplate.objects.all().update(is_active=True)
print(f"Activated {updated} templates.")

# Verify
first = DocumentTemplate.objects.first()
if first:
    print(f"Sample Active Status: {first.is_active}")
