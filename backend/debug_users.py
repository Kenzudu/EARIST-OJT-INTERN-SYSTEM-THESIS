import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import StudentProfile

print(f"{'Username':<20} | {'Student ID':<20} | {'Role':<10}")
print("-" * 60)

for user in User.objects.all():
    role = "Admin" if user.is_staff else "Student"
    student_id = "N/A"
    try:
        if hasattr(user, 'student_profile'):
            student_id = user.student_profile.student_id
    except Exception as e:
        student_id = f"Error: {e}"
    
    print(f"{user.username:<20} | {student_id:<20} | {role:<10}")
