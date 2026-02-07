import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import CoordinatorProfile, User

brenan = User.objects.filter(username__icontains='brenan').first()
if brenan:
    print(f"User: {brenan.username}")
    if hasattr(brenan, 'coordinator_profile'):
        print(f"Coordinator College: {brenan.coordinator_profile.college}")
    else:
        print("No coordinator profile")
else:
    print("User 'brenan' not found. Listing all coords:")
    for c in CoordinatorProfile.objects.all():
        print(f"{c.user.username}: {c.college}")
