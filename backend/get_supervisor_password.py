import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole, CompanyUser

# Search for supervisor_css
username = "supervisor_css"

try:
    user = User.objects.get(username=username)
    print("=" * 60)
    print(f"ACCOUNT INFORMATION FOR: {username}")
    print("=" * 60)
    print(f"\nUsername: {user.username}")
    print(f"Email: {user.email}")
    print(f"First Name: {user.first_name}")
    print(f"Last Name: {user.last_name}")
    print(f"Is Active: {user.is_active}")
    print(f"Is Staff: {user.is_staff}")
    
    # Check role
    try:
        role = UserRole.objects.get(user=user)
        print(f"Role: {role.role}")
    except UserRole.DoesNotExist:
        print("Role: NO ROLE ASSIGNED")
    
    # Check company
    try:
        company_user = CompanyUser.objects.get(user=user)
        print(f"Company: {company_user.company.name}")
        print(f"Position: {company_user.position}")
    except CompanyUser.DoesNotExist:
        print("Company: NOT LINKED TO ANY COMPANY")
    
    print("\n" + "=" * 60)
    print("PASSWORD INFORMATION")
    print("=" * 60)
    print("\nNOTE: Passwords are hashed in the database for security.")
    print("The original password cannot be retrieved directly.")
    print("\nBased on the creation scripts, the password is likely:")
    print("  → password123")
    print("\nIf this doesn't work, the account may have been created")
    print("with a different password. Common passwords used:")
    print("  - password123")
    print("  - admin123")
    print("  - supervisor123")
    
except User.DoesNotExist:
    print(f"\n❌ User '{username}' not found in the database.")
    print("\nSearching for similar usernames...")
    
    similar_users = User.objects.filter(username__icontains="supervisor")
    if similar_users.exists():
        print(f"\nFound {similar_users.count()} supervisor accounts:")
        for u in similar_users:
            print(f"  - {u.username} ({u.email})")
    else:
        print("No supervisor accounts found.")
