"""
Check for actual admin role users
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole, TwoFactorAuth

# Get all admin role users
admin_users = User.objects.filter(user_role__role='admin')

print("=" * 60)
print("ADMIN ROLE USERS")
print("=" * 60)

for user in admin_users:
    has_2fa = "✓" if TwoFactorAuth.objects.filter(user=user).exists() else "✗"
    email = user.email if user.email else "No email"
    print(f"{user.username:20} | Email: {email:30} | 2FA: {has_2fa}")

print(f"\nTotal admin users: {admin_users.count()}")
