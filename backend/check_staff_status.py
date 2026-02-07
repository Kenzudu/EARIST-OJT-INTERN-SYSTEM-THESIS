import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import User, UserRole

users_to_check = ['admin1', 'testadmin']

for username in users_to_check:
    try:
        user = User.objects.get(username=username)
        print(f"\nUser: {user.username}")
        print(f"  is_staff: {user.is_staff}")
        print(f"  is_superuser: {user.is_superuser}")
        if hasattr(user, 'user_role'):
            print(f"  role: {user.user_role.role}")
        else:
            print(f"  role: NO ROLE ASSIGNED")
    except User.DoesNotExist:
        print(f"\nUser {username} not found")
