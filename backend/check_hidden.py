import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

t = DocumentTemplate.objects.filter(template_type__contains='Endorsement').last()
print(f"Rep: {repr(t.template_type)}")
print(f"Hex: {[hex(ord(c)) for c in t.template_type]}")
