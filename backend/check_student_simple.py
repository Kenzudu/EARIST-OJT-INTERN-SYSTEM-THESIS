import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import StudentProfile
from django.contrib.auth.models import User

student_id = "224-08642M"

print(f"Searching for Student ID: {student_id}")
print("=" * 60)

# Try case-insensitive search
profiles = StudentProfile.objects.filter(student_id__iexact=student_id)

if profiles.exists():
    profile = profiles.first()
    print(f"✓ Found student profile")
    print(f"  Stored Student ID: '{profile.student_id}'")
    print(f"  Username: {profile.user.username}")
    print(f"  Birth Date: {profile.birth_date}")
    print(f"  Email: {profile.user.email}")
    print(f"  First Name: {profile.user.first_name}")
    print(f"  Last Name: {profile.user.last_name}")
    print(f"  Is Staff: {profile.user.is_staff}")
    print(f"\n  User has usable password: {profile.user.has_usable_password()}")
else:
    print(f"✗ Student ID '{student_id}' not found")
    
    # Show all student IDs
    print("\nAll Student IDs in database:")
    all_profiles = StudentProfile.objects.all()
    if all_profiles.exists():
        for p in all_profiles[:10]:  # Show first 10
            print(f"  - '{p.student_id}' -> username: {p.user.username}, birth_date: {p.birth_date}")
    else:
        print("  No student profiles found in database")
