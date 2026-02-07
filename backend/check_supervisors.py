import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import User, UserRole, CompanyUser, Company

print("=" * 60)
print("CHECKING FOR SUPERVISOR ACCOUNTS")
print("=" * 60)

# Check for users with supervisor role
supervisors = UserRole.objects.filter(role='supervisor')
print(f"\n1. Users with 'supervisor' role: {supervisors.count()}")
for supervisor in supervisors:
    print(f"   - {supervisor.user.username} ({supervisor.user.email})")

# Check for CompanyUser records
company_users = CompanyUser.objects.all()
print(f"\n2. CompanyUser records: {company_users.count()}")
for cu in company_users:
    print(f"   - User: {cu.user.username}")
    print(f"     Company: {cu.company.name}")
    print(f"     Position: {cu.position}")
    if hasattr(cu.user, 'user_role'):
        print(f"     Role: {cu.user.user_role.role}")
    else:
        print(f"     Role: NO ROLE ASSIGNED")
    print()

# Check all companies
companies = Company.objects.all()
print(f"\n3. Total Companies: {companies.count()}")
for company in companies[:5]:  # Show first 5
    print(f"   - {company.name}")

print("\n" + "=" * 60)
print("RECOMMENDATION:")
print("=" * 60)
if supervisors.count() == 0:
    print("No supervisor accounts found!")
    print("\nTo create a supervisor account, you need to:")
    print("1. Create a User account")
    print("2. Create a CompanyUser record linking the user to a company")
    print("3. Assign the 'supervisor' role to the user")
    print("\nWould you like me to create a test supervisor account?")
