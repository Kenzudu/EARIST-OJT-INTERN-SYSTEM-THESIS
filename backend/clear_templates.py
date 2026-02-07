import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

count = DocumentTemplate.objects.count()
print(f"Found {count} templates.")
DocumentTemplate.objects.all().delete()
print(f"Deleted all {count} templates. Database is clear.")
