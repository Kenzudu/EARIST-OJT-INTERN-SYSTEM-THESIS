import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(username='224-09101M')
    profile = user.student_profile
    
    # Set birthday to September 3, 2004
    profile.birthday = date(2004, 9, 3)
    profile.save()
    
    print(f"\n{'='*50}")
    print(f"✅ Birthday updated successfully!")
    print(f"{'='*50}")
    print(f"User: {user.username}")
    print(f"Name: {user.first_name} {user.last_name}")
    print(f"New Birthday: {profile.birthday}")
    print(f"{'='*50}\n")
    
except User.DoesNotExist:
    print(f"\n❌ User '224-09101M' not found\n")
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
