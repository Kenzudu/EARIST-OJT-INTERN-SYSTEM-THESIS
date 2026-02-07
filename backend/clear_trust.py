import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import TrustedDevice

try:
    user = User.objects.get(username='admin1')
    count = TrustedDevice.objects.filter(user=user).count()
    print(f'Found {count} trusted devices for {user.username}')
    
    deleted = TrustedDevice.objects.filter(user=user).delete()
    print(f'Successfully deleted {deleted[0]} trusted devices for {user.username}')
    print('Done! You can now test the login flow.')
except User.DoesNotExist:
    print('User admin1 not found')
except Exception as e:
    print(f'Error: {e}')
