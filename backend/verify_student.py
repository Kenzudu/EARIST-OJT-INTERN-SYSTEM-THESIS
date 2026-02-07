import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import StudentProfile, User

try:
    student = User.objects.get(username='234-testing')
    print(f"User: {student.username}")
    print(f"College: {student.student_profile.college}")
    print(f"Course: {student.student_profile.course}")
except Exception as e:
    print(e)
