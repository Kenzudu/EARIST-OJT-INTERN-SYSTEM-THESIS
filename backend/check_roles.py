import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import UserRole, User

print("=" * 70)
print("CHECKING USER ROLES IN DATABASE")
print("=" * 70)

# Count roles
total_roles = UserRole.objects.count()
print(f"\nTotal UserRole records: {total_roles}")

# Count by role type
admins = UserRole.objects.filter(role='admin').count()
coordinators = UserRole.objects.filter(role='coordinator').count()
supervisors = UserRole.objects.filter(role='supervisor').count()
students = UserRole.objects.filter(role='student').count()

print(f"\nBreakdown:")
print(f"  Admins: {admins}")
print(f"  Coordinators: {coordinators}")
print(f"  Supervisors: {supervisors}")
print(f"  Students: {students}")

# List all non-student roles
print(f"\n" + "=" * 70)
print("NON-STUDENT USERS:")
print("=" * 70)

for role in UserRole.objects.exclude(role='student'):
    user = role.user
    print(f"\nUsername: {user.username}")
    print(f"  Role: {role.role} ({role.get_role_display()})")
    print(f"  Email: {user.email}")
    print(f"  is_staff: {user.is_staff}")
    print(f"  is_active: {user.is_active}")

# Check users without roles
users_without_role = User.objects.filter(user_role__isnull=True).count()
print(f"\n" + "=" * 70)
print(f"Users without UserRole: {users_without_role}")

if users_without_role > 0:
    print("\nUsers without roles:")
    for user in User.objects.filter(user_role__isnull=True)[:5]:
        print(f"  - {user.username} (is_staff: {user.is_staff})")
