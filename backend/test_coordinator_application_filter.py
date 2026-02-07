"""
This script demonstrates the fix needed for coordinator application filtering.

The issue: Coordinators see ALL applications instead of only applications 
from students in their college.

The fix: Filter applications by student's college matching coordinator's college.

Example:
- CCS Coordinator should only see applications from CCS students
- CBA Coordinator should only see applications from CBA students
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Application, StudentProfile, CoordinatorProfile
from django.contrib.auth.models import User

def test_application_filtering():
    """Test that applications are properly filtered by college"""
    
    # Get a coordinator
    coordinator_user = User.objects.filter(user_role__role='coordinator').first()
    
    if not coordinator_user:
        print("No coordinator found")
        return
    
    print(f"\nTesting for coordinator: {coordinator_user.username}")
    
    # Get coordinator's college
    try:
        coordinator_profile = coordinator_user.coordinator_profile
        coordinator_college = coordinator_profile.college
        print(f"Coordinator's college: {coordinator_college}")
    except:
        print("Coordinator has no college assigned")
        return
    
    # Get all applications
    all_applications = Application.objects.all()
    print(f"\nTotal applications in system: {all_applications.count()}")
    
    # Get students from coordinator's college
    college_student_ids = StudentProfile.objects.filter(
        college=coordinator_college
    ).values_list('user_id', flat=True)
    
    print(f"Students in {coordinator_college}: {len(college_student_ids)}")
    
    # Filter applications by college students
    college_applications = Application.objects.filter(
        student_id__in=college_student_ids
    )
    
    print(f"Applications from {coordinator_college} students: {college_applications.count()}")
    
    # Show sample applications
    print(f"\nSample applications from {coordinator_college}:")
    for app in college_applications[:5]:
        student = app.student
        student_college = student.student_profile.college if hasattr(student, 'student_profile') else 'N/A'
        print(f"  - {student.first_name} {student.last_name} ({student_college}) -> {app.internship.position}")
    
    # Show applications that should NOT be visible
    other_applications = Application.objects.exclude(student_id__in=college_student_ids)
    if other_applications.exists():
        print(f"\n❌ Applications that should NOT be visible to {coordinator_college} coordinator:")
        for app in other_applications[:5]:
            student = app.student
            student_college = student.student_profile.college if hasattr(student, 'student_profile') else 'N/A'
            print(f"  - {student.first_name} {student.last_name} ({student_college}) -> {app.internship.position}")

if __name__ == '__main__':
    test_application_filtering()
