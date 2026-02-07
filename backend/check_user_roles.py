"""
Check which users have which roles
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole

# Get all users with roles
users_with_roles = User.objects.filter(user_role__isnull=False)

print("=" * 60)
print("USER ROLES BREAKDOWN")
print("=" * 60)

for user in users_with_roles:
    role = user.user_role.role if hasattr(user, 'user_role') else 'No role'
    is_staff = "✓" if user.is_staff else "✗"
    is_superuser = "✓" if user.is_superuser else "✗"
    print(f"{user.username:20} | Role: {role:12} | Staff: {is_staff} | Superuser: {is_superuser}")

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

admin_count = User.objects.filter(user_role__role='admin').count()
coordinator_count = User.objects.filter(user_role__role='coordinator').count()
supervisor_count = User.objects.filter(user_role__role='supervisor').count()
student_count = User.objects.filter(user_role__role='student').count()

print(f"Admins:       {admin_count}")
print(f"Coordinators: {coordinator_count}")
print(f"Supervisors:  {supervisor_count}")
print(f"Students:     {student_count}")
