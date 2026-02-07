import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import StudentProfile
from django.contrib.auth.models import User

student_id = "224-08642M"

print(f"Searching for Student ID: {student_id}")
print("=" * 60)

# Try exact match
try:
    profile = StudentProfile.objects.get(student_id=student_id)
    print(f"✓ Found with exact match")
    print(f"  Student ID: {profile.student_id}")
    print(f"  Username: {profile.user.username}")
    print(f"  Birth Date: {profile.birth_date}")
    print(f"  User Email: {profile.user.email}")
    print(f"  User First Name: {profile.user.first_name}")
    print(f"  User Last Name: {profile.user.last_name}")
    print(f"  Is Staff: {profile.user.is_staff}")
    
    # Test password
    test_password = input("\nEnter password to test: ")
    if profile.user.check_password(test_password):
        print("✓ Password is CORRECT")
    else:
        print("✗ Password is INCORRECT")
        
except StudentProfile.DoesNotExist:
    print(f"✗ Not found with exact match")
    
    # Try case-insensitive
    try:
        profile = StudentProfile.objects.get(student_id__iexact=student_id)
        print(f"✓ Found with case-insensitive match")
        print(f"  Stored Student ID: '{profile.student_id}'")
        print(f"  Your Input: '{student_id}'")
    except StudentProfile.DoesNotExist:
        print(f"✗ Not found with case-insensitive match either")
        
        # Show all student IDs
        print("\nAll Student IDs in database:")
        for p in StudentProfile.objects.all():
            print(f"  - '{p.student_id}' (username: {p.user.username})")
