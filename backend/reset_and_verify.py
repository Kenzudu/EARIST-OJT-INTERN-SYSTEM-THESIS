import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

username = '224-09101M'
new_password = '12312345'

try:
    user = User.objects.get(username=username)
    
    # Set password
    user.set_password(new_password)
    user.save()
    
    print(f"\n{'='*50}")
    print(f"Password has been reset")
    print(f"{'='*50}")
    
    # Test authentication immediately
    auth_user = authenticate(username=username, password=new_password)
    
    if auth_user is not None:
        print(f"✅ Password reset SUCCESSFUL!")
        print(f"Username: {username}")
        print(f"Password: {new_password}")
        print(f"Authentication test: PASSED")
    else:
        print(f"❌ Password reset FAILED!")
        print(f"Authentication test: FAILED")
    
    print(f"{'='*50}\n")
    
except User.DoesNotExist:
    print(f"\n❌ User '{username}' not found\n")
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
