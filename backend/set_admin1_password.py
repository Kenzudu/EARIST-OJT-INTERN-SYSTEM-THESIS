"""
Set admin1 password to admin123
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(username='admin1')
    user.set_password('admin123')
    user.save()
    
    print("\n" + "="*60)
    print("✅ PASSWORD UPDATED SUCCESSFULLY")
    print("="*60)
    print(f"\n👤 Username: {user.username}")
    print(f"📧 Email: {user.email}")
    print(f"🔑 New Password: admin123")
    print(f"👔 Role: {'Admin' if user.is_staff else 'User'}")
    print("\n" + "="*60)
    print("You can now login with:")
    print("  Username: admin1")
    print("  Password: admin123")
    print("="*60 + "\n")
    
except User.DoesNotExist:
    print("\n❌ Error: User 'admin1' not found!")
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
