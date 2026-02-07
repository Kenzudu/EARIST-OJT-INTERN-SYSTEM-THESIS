import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import CoordinatorSettings, User

print("Checking Settings:")
for s in CoordinatorSettings.objects.all():
    print(f"Coordinator: {s.coordinator.username}")
    print(f"Docs: {s.required_docs}")
