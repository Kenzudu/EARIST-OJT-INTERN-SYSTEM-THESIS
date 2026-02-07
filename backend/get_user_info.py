import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(username='224-09101M')
    print(f"\n{'='*50}")
    print(f"USER INFORMATION FOR: {user.username}")
    print(f"{'='*50}")
    print(f"Full Name: {user.first_name} {user.last_name}")
    print(f"Email: {user.email}")
    print(f"Is Staff: {user.is_staff}")
    
    # Check for student profile
    if hasattr(user, 'student_profile'):
        profile = user.student_profile
        print(f"\nSTUDENT PROFILE:")
        print(f"Student ID: {profile.student_id if hasattr(profile, 'student_id') else 'N/A'}")
        print(f"Birthday: {profile.birthday if hasattr(profile, 'birthday') else 'N/A'}")
        print(f"Course: {profile.course if hasattr(profile, 'course') else 'N/A'}")
        print(f"College: {profile.college if hasattr(profile, 'college') else 'N/A'}")
        print(f"Year Level: {profile.year_level if hasattr(profile, 'year_level') else 'N/A'}")
    else:
        print("\nNo student profile found for this user")
    
    print(f"{'='*50}\n")
    
except User.DoesNotExist:
    print(f"\n❌ User '224-09101M' not found in database\n")
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
