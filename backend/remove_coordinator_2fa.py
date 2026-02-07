"""
Remove 2FA from coordinators - they should NOT have 2FA
Only admin role users should have 2FA
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole, TwoFactorAuth

# Get all coordinator users
coordinator_users = User.objects.filter(user_role__role='coordinator')

print(f"Found {coordinator_users.count()} coordinator users")
print("Removing 2FA from coordinators...\n")

for user in coordinator_users:
    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
        two_factor.delete()
        print(f"✅ Removed 2FA from {user.username}")
    except TwoFactorAuth.DoesNotExist:
        print(f"⚪ {user.username} - No 2FA to remove")

print("\n✅ Done! Coordinators no longer have 2FA requirement.")
print("\nOnly users with role='admin' will have 2FA.")
