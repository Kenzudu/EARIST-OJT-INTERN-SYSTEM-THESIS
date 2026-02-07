"""
Quick script to check users and their email addresses
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

print("\n" + "="*60)
print("USER EMAIL CHECK")
print("="*60 + "\n")

users = User.objects.all()
print(f"Total users: {users.count()}\n")

users_with_email = User.objects.exclude(email='').exclude(email__isnull=True)
users_without_email = User.objects.filter(email='') | User.objects.filter(email__isnull=True)

print(f"✅ Users with email: {users_with_email.count()}")
print(f"❌ Users without email: {users_without_email.count()}\n")

if users_with_email.exists():
    print("Sample users with email addresses:")
    print("-" * 60)
    for user in users_with_email[:5]:
        role = 'student'
        if hasattr(user, 'user_role'):
            role = user.user_role.role
        print(f"  Username: {user.username:20} Email: {user.email:30} Role: {role}")
    print()

if users_without_email.exists():
    print("⚠️  Users WITHOUT email addresses:")
    print("-" * 60)
    for user in users_without_email[:5]:
        role = 'student'
        if hasattr(user, 'user_role'):
            role = user.user_role.role
        print(f"  Username: {user.username:20} Role: {role}")
    if users_without_email.count() > 5:
        print(f"  ... and {users_without_email.count() - 5} more")
    print()

print("="*60)
print("💡 TIP: Users need valid email addresses for password reset!")
print("="*60 + "\n")
