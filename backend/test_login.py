import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

username = '224-09101M'
password = '12312345'

try:
    # Try to authenticate
    user = authenticate(username=username, password=password)
    
    if user is not None:
        print(f"\n{'='*50}")
        print(f"✅ Authentication SUCCESSFUL!")
        print(f"{'='*50}")
        print(f"Username: {user.username}")
        print(f"Name: {user.first_name} {user.last_name}")
        print(f"Email: {user.email}")
        print(f"Is Active: {user.is_active}")
        print(f"Is Staff: {user.is_staff}")
        
        # Check student profile
        if hasattr(user, 'student_profile'):
            profile = user.student_profile
            print(f"\nStudent Profile:")
            print(f"Birthday: {profile.birthday}")
            print(f"Student ID: {profile.student_id}")
        
        print(f"{'='*50}\n")
    else:
        print(f"\n{'='*50}")
        print(f"❌ Authentication FAILED!")
        print(f"{'='*50}")
        
        # Check if user exists
        try:
            user_obj = User.objects.get(username=username)
            print(f"User exists: {user_obj.username}")
            print(f"Is Active: {user_obj.is_active}")
            print(f"Password might be incorrect or user is inactive")
        except User.DoesNotExist:
            print(f"User '{username}' does not exist")
        
        print(f"{'='*50}\n")
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
