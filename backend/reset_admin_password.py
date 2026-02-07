#!/usr/bin/env python
"""
Script to reset Django admin password
Usage: python reset_admin_password.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def reset_admin_password():
    """Reset admin password to a new password"""
    
    # List all superusers
    superusers = User.objects.filter(is_superuser=True)
    
    if not superusers.exists():
        print("❌ No superuser accounts found!")
        print("Creating a new superuser account...")
        username = input("Enter username (default: admin): ").strip() or "admin"
        email = input("Enter email (default: admin@example.com): ").strip() or "admin@example.com"
        password = input("Enter password (default: admin123): ").strip() or "admin123"
        
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"✅ Superuser '{username}' created successfully!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        return
    
    print("\n📋 Found the following superuser accounts:")
    for i, user in enumerate(superusers, 1):
        print(f"{i}. Username: {user.username}, Email: {user.email}")
    
    # Select user to reset
    if superusers.count() == 1:
        selected_user = superusers.first()
        print(f"\n🔄 Resetting password for: {selected_user.username}")
    else:
        choice = input(f"\nSelect user number (1-{superusers.count()}): ").strip()
        try:
            selected_user = list(superusers)[int(choice) - 1]
        except (ValueError, IndexError):
            print("❌ Invalid selection!")
            return
    
    # Get new password
    new_password = input(f"\nEnter new password for '{selected_user.username}' (default: admin123): ").strip() or "admin123"
    
    # Reset password
    selected_user.set_password(new_password)
    selected_user.save()
    
    print(f"\n✅ Password reset successfully!")
    print(f"   Username: {selected_user.username}")
    print(f"   New Password: {new_password}")
    print(f"\nYou can now login to Django admin at: http://localhost:8000/admin/")

if __name__ == "__main__":
    print("=" * 60)
    print("🔐 Django Admin Password Reset Tool")
    print("=" * 60)
    reset_admin_password()
