import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.cache import cache

username = '224-09101M'

try:
    user = User.objects.get(username=username)
    
    # Clear all possible cache keys for login attempts
    cache_keys = [
        f'login_attempts_{username}',
        f'login_locked_{username}',
        f'failed_attempts_{username}',
        f'lockout_{username}',
    ]
    
    for key in cache_keys:
        cache.delete(key)
    
    print(f"\n{'='*50}")
    print(f"✅ Account unlocked successfully!")
    print(f"{'='*50}")
    print(f"Username: {username}")
    print(f"All login attempt records cleared")
    print(f"Account is now accessible")
    print(f"{'='*50}\n")
    
    # Also verify the user is active
    if not user.is_active:
        user.is_active = True
        user.save()
        print(f"User account activated")
    
except User.DoesNotExist:
    print(f"\n❌ User '{username}' not found\n")
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
