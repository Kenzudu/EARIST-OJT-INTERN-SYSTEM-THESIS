import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

username = '224-09101M'

try:
    user = User.objects.get(username=username)
    profile = user.student_profile
    
    # Set birth_date (not birthday!)
    profile.birth_date = date(2004, 9, 3)
    profile.save()
    
    print(f"\n{'='*60}")
    print(f"✅ BIRTH DATE SET SUCCESSFULLY!")
    print(f"{'='*60}")
    print(f"Username: {user.username}")
    print(f"Name: {user.first_name} {user.last_name}")
    print(f"Birth Date: {profile.birth_date}")
    print(f"Birth Date (formatted): {profile.birth_date.strftime('%Y-%m-%d')}")
    print(f"Birth Date (MM/DD/YYYY): {profile.birth_date.strftime('%m/%d/%Y')}")
    print(f"{'='*60}\n")
    
    print(f"LOGIN CREDENTIALS:")
    print(f"Username: {username}")
    print(f"Password: 12312345")
    print(f"Birthday: 09/03/2004 or 2004-09-03")
    print(f"{'='*60}\n")
    
except User.DoesNotExist:
    print(f"\n❌ User not found\n")
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
    import traceback
    traceback.print_exc()
