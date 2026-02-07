"""
Force all admin users to set up 2FA immediately
This script creates TwoFactorAuth records for all admin users
with is_enabled=False, forcing them to complete setup
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole, TwoFactorAuth
from core.two_factor_utils import generate_secret_key

def enforce_2fa_for_admins():
    """Force all admin users to set up 2FA"""
    
    # Get all admin users
    admin_users = User.objects.filter(
        user_role__role='admin'
    ) | User.objects.filter(
        is_superuser=True
    ) | User.objects.filter(
        is_staff=True
    )
    
    admin_users = admin_users.distinct()
    
    print(f"Found {admin_users.count()} admin users")
    
    for user in admin_users:
        # Check if user already has 2FA
        try:
            two_factor = TwoFactorAuth.objects.get(user=user)
            if two_factor.is_enabled and two_factor.is_verified:
                print(f"✅ {user.username} - Already has 2FA enabled")
            else:
                print(f"⚠️  {user.username} - Has 2FA record but not verified")
        except TwoFactorAuth.DoesNotExist:
            # Create 2FA record with is_enabled=False to force setup
            secret = generate_secret_key()
            TwoFactorAuth.objects.create(
                user=user,
                secret_key=secret,
                is_enabled=False,
                is_verified=False
            )
            print(f"🔒 {user.username} - Will be forced to set up 2FA on next login")
    
    print("\n✅ Done! All admin users will be required to set up 2FA on their next login.")

if __name__ == '__main__':
    enforce_2fa_for_admins()
