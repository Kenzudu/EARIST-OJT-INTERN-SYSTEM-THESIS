import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

try:
    t = DocumentTemplate.objects.get(id=33)
    print(f"Touching {t.name} (ID: {t.id})...")
    
    # Toggle active status to force update
    t.is_active = False
    t.save()
    print("Set to Inactive.")
    
    t.is_active = True
    t.save()
    print("Set to Active.")
    
except DocumentTemplate.DoesNotExist:
    print("Template 33 not found.")
