import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole, CompanyUser, Company

print("Creating Company Supervisor Account...")
print("=" * 60)

# Get the first company
company = Company.objects.first()
print(f"\nCompany: {company.name}")

# Create a supervisor user
username = "supervisor1"
email = "supervisor@company.com"
password = "supervisor123"

# Check if user already exists
if User.objects.filter(username=username).exists():
    print(f"\n✗ User '{username}' already exists!")
    user = User.objects.get(username=username)
else:
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name="John",
        last_name="Supervisor"
    )
    print(f"\n✓ Created user: {username}")

# Create UserRole
if hasattr(user, 'user_role'):
    print(f"✓ User already has role: {user.user_role.role}")
else:
    user_role = UserRole.objects.create(
        user=user,
        role=UserRole.SUPERVISOR
    )
    print(f"✓ Assigned role: supervisor")

# Create CompanyUser
if hasattr(user, 'company_user_profile'):
    print(f"✓ User already linked to company: {user.company_user_profile.company.name}")
else:
    company_user = CompanyUser.objects.create(
        user=user,
        company=company,
        position="HR Manager",
        phone="09123456789"
    )
    print(f"✓ Linked to company: {company.name}")

print("\n" + "=" * 60)
print("SUPERVISOR ACCOUNT CREATED!")
print("=" * 60)
print(f"\nLogin Credentials:")
print(f"  Username: {username}")
print(f"  Password: {password}")
print(f"  Role: Supervisor")
print(f"  Company: {company.name}")
print(f"\nYou can now log in at: http://localhost:3000/login")
print("Select 'Supervisor' from the dropdown")
