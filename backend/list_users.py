import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
print("Listing all users...")
for u in User.objects.all():
    role = "No Role"
    if hasattr(u, 'user_role'):
        role = u.user_role.role
    elif u.is_superuser:
        role = "Superuser"
    elif u.is_staff:
        role = "Staff"
        
    print(f"ID: {u.id} | Username: '{u.username}' | Full Name: '{u.get_full_name()}' | Role: {role}")
