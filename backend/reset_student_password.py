import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import StudentProfile
from django.contrib.auth.models import User

student_id = "224-28642M"

profile = StudentProfile.objects.get(student_id=student_id)
user = profile.user

print(f"Resetting password for:")
print(f"  Student ID: {student_id}")
print(f"  Username: {user.username}")
print(f"  Name: {user.first_name} {user.last_name}")
print(f"  Birth Date: {profile.birth_date}")

# Set password to 'password'
new_password = "password"
user.set_password(new_password)
user.save()

print(f"\n✓ Password has been reset to: {new_password}")
print(f"\nLogin credentials:")
print(f"  Student ID: {student_id}")
print(f"  Birth Date: {profile.birth_date}")
print(f"  Password: {new_password}")
