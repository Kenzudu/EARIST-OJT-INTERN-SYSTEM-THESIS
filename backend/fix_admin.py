import os
import django
import sys

print("Starting fix_admin.py...")

try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    print("Setting up Django...")
    django.setup()
    print("Django setup complete.")

    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'
    
    print(f"Checking for user '{username}'...")
    
    users = User.objects.filter(username=username)
    
    if users.exists():
        u = users.first()
        print(f"User '{username}' found. Resetting password...")
        u.set_password(password)
        u.is_staff = True
        u.is_superuser = True
        u.save()
        print(f"Successfully UPDATED user: {username} with password: {password}")
    else:
        print(f"User '{username}' not found. Creating...")
        User.objects.create_superuser(username, email, password)
        print(f"Successfully CREATED user: {username} with password: {password}")

except Exception as e:
    print(f"An error occurred: {e}")
    import traceback
    traceback.print_exc()
