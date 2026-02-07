import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

# Reset admin1 password
try:
    user = User.objects.get(username='admin1')
    user.set_password('admin1')
    user.save()
    print(f"✓ Reset password for admin1 to 'admin1'")
except User.DoesNotExist:
    print("✗ User admin1 not found")

# Reset testadmin password
try:
    user = User.objects.get(username='testadmin')
    user.set_password('admin123')
    user.save()
    print(f"✓ Reset password for testadmin to 'admin123'")
except User.DoesNotExist:
    print("✗ User testadmin not found")

print("\nPasswords have been reset. You can now log in.")
