import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

username = '224-09101M'

try:
    user = User.objects.get(username=username)
    profile = user.student_profile
    
    print(f"\n{'='*60}")
    print(f"COMPLETE USER INFORMATION")
    print(f"{'='*60}")
    print(f"Username: {user.username}")
    print(f"Password: (hashed) - Set to: 12312345")
    print(f"First Name: {user.first_name}")
    print(f"Last Name: {user.last_name}")
    print(f"Email: {user.email}")
    print(f"Is Active: {user.is_active}")
    print(f"Is Staff: {user.is_staff}")
    print(f"\nStudent Profile:")
    print(f"Student ID: {profile.student_id}")
    print(f"Birthday: {profile.birthday}")
    print(f"Birthday (formatted): {profile.birthday.strftime('%Y-%m-%d') if profile.birthday else 'N/A'}")
    print(f"Birthday (MM/DD/YYYY): {profile.birthday.strftime('%m/%d/%Y') if profile.birthday else 'N/A'}")
    print(f"Course: {profile.course}")
    print(f"College: {profile.college}")
    
    # Check if student_id matches username
    if profile.student_id != user.username:
        print(f"\n⚠️  WARNING: Student ID ({profile.student_id}) doesn't match username ({user.username})")
    
    print(f"{'='*60}\n")
    
    # Test authentication
    from django.contrib.auth import authenticate
    auth_user = authenticate(username=username, password='12312345')
    if auth_user:
        print(f"✅ Password authentication: WORKS")
    else:
        print(f"❌ Password authentication: FAILED")
    
except User.DoesNotExist:
    print(f"\n❌ User not found\n")
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
    import traceback
    traceback.print_exc()
