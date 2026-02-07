import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internship_management.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import CoordinatorProfile

# Find all coordinators
coordinators = User.objects.filter(user_role__role='coordinator')

print(f"\n{'='*60}")
print(f"COORDINATOR PROFILES CHECK")
print(f"{'='*60}\n")

if not coordinators.exists():
    print("❌ No coordinators found in the system!")
else:
    print(f"Found {coordinators.count()} coordinator(s):\n")
    
    for user in coordinators:
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Name: {user.first_name} {user.last_name}")
        
        # Check if has coordinator profile
        if hasattr(user, 'coordinator_profile'):
            profile = user.coordinator_profile
            print(f"✅ Has Profile: YES")
            print(f"   College: {profile.college} ({profile.get_college_display()})")
            print(f"   Department: {profile.department}")
        else:
            print(f"❌ Has Profile: NO - THIS IS THE PROBLEM!")
            print(f"   Solution: Need to create CoordinatorProfile")
        
        print(f"{'-'*60}\n")

print(f"\n{'='*60}")
print(f"COLLEGE CODES IN DATABASE:")
print(f"{'='*60}")
from core.models import StudentProfile
for code, name in StudentProfile.COLLEGE_CHOICES:
    print(f"  {code} = {name}")
print(f"{'='*60}\n")
