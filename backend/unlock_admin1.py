"""
Unlock admin1 account by clearing login attempts
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import LoginAttempt

try:
    # Check if user exists
    user = User.objects.get(username='admin1')
    
    print("\n" + "="*60)
    print("🔓 UNLOCKING ADMIN1 ACCOUNT")
    print("="*60 + "\n")
    
    # Check for login attempts
    try:
        login_attempt = LoginAttempt.objects.get(username='admin1')
        print(f"📊 Current Status:")
        print(f"   Failed Attempts: {login_attempt.attempts}")
        print(f"   Last Attempt: {login_attempt.last_attempt}")
        print(f"   IP Address: {login_attempt.ip_address}")
        
        # Delete the login attempt record to unlock
        login_attempt.delete()
        print(f"\n✅ Login attempts cleared!")
        
    except LoginAttempt.DoesNotExist:
        print("ℹ️  No login attempt records found (account was not locked)")
    
    # Also reset the password to admin123 to be sure
    user.set_password('admin123')
    user.save()
    
    print("\n" + "="*60)
    print("✅ ACCOUNT UNLOCKED SUCCESSFULLY")
    print("="*60)
    print(f"\n👤 Username: {user.username}")
    print(f"📧 Email: {user.email}")
    print(f"🔑 Password: admin123")
    print(f"🔓 Status: UNLOCKED")
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
    import traceback
    traceback.print_exc()
