import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import StudentProfile
from django.contrib.auth.models import User

student_id = "224-28642M"

print(f"Student ID: {student_id}")
print("=" * 60)

profile = StudentProfile.objects.get(student_id=student_id)
user = profile.user

print(f"Username: {user.username}")
print(f"Birth Date: {profile.birth_date}")
print(f"Email: {user.email}")
print(f"First Name: {user.first_name}")
print(f"Last Name: {user.last_name}")
print(f"Is Staff: {user.is_staff}")
print(f"\nHas usable password: {user.has_usable_password()}")

# Test common passwords
test_passwords = ["password", "password123", "123456", student_id, "224-28642M"]

print("\nTesting common passwords:")
for pwd in test_passwords:
    if user.check_password(pwd):
        print(f"✓ Password '{pwd}' is CORRECT")
        break
else:
    print("✗ None of the common passwords matched")
    print("\nThe password was likely set during user creation.")
    print("You may need to reset it or check the populate scripts.")
