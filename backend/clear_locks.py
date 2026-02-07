import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import LoginAttempt
from django.contrib.auth.models import User

print(f"Found {LoginAttempt.objects.count()} login attempts.")
LoginAttempt.objects.all().delete()
print("Cleared all login attempts.")
