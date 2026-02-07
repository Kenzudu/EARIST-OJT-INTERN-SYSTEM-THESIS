
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import StudentProfile, CoordinatorSettings, UserRole

def check_hours():
    # Find the student 'Rafael Kenneth Saluba' (from screenshot)
    # or just any student to see typical data
    # The screenshot shows ID 234-03828M
    
    student_profile = StudentProfile.objects.filter(student_id='234-03828M').first()
    if not student_profile:
        print("Student not found!")
        # Try generic search
        student_profile = StudentProfile.objects.last()
        if not student_profile:
             print("No students found.")
             return

    student = student_profile.user
    print(f"Checking student: {student.first_name} {student.last_name}")
    print(f"College: {student_profile.college}")
    print(f"Course (DB Value): '{student_profile.course}'")
    
    # access coordinator settings
    coordinator = User.objects.filter(
        user_role__role='coordinator',
        coordinator_profile__college=student_profile.college
    ).first()
    
    if not coordinator:
        print(f"No coordinator found for college {student_profile.college}")
        return

    print(f"Coordinator found: {coordinator.username}")
    
    settings = CoordinatorSettings.objects.filter(coordinator=coordinator).first()
    if not settings:
        print("No CoordinatorSettings found.")
        return
        
    print("Coordinator Settings Hours Config:")
    print(json.dumps(settings.hours_config, indent=2))
    
    # Simulate the logic
    print("-" * 20)
    print("Matching Logic Test:")
    matched = False
    for config in settings.hours_config:
        program = config.get('program', '')
        print(f"Checking vs Program: '{program}'")
        if program.upper() == student_profile.course.upper():
            print(f"MATCH FOUND! Required Hours: {config.get('requiredHours')}")
            matched = True
            break
            
    if not matched:
        print("NO MATCH FOUND. Returning default 486.")

if __name__ == '__main__':
    check_hours()
