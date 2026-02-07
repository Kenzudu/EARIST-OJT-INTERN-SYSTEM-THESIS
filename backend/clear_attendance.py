"""
Quick script to clear attendance data for student 234-03828M
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Attendance, StudentProfile

try:
    # Find the student
    student_profile = StudentProfile.objects.get(student_id='234-03828M')
    student_user = student_profile.user
    
    # Count and delete attendance records
    count = Attendance.objects.filter(student=student_user).count()
    Attendance.objects.filter(student=student_user).delete()
    
    print(f"✅ Successfully deleted {count} attendance record(s) for:")
    print(f"   Student ID: 234-03828M")
    print(f"   Username: {student_user.username}")
    print(f"   Name: {student_user.get_full_name()}")
    print(f"\nThe student can now demonstrate clock in/out from scratch!")
    
except StudentProfile.DoesNotExist:
    print("❌ Error: Student with ID '234-03828M' not found")
except Exception as e:
    print(f"❌ Error: {str(e)}")
