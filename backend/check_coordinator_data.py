import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import CoordinatorProfile, StudentProfile

def check_data():
    print("--- Checking Coordinator Data ---")
    try:
        ced_coord = User.objects.get(username='coordinator_ced')
        print(f"User: {ced_coord.username}")
        if hasattr(ced_coord, 'coordinator_profile'):
            profile = ced_coord.coordinator_profile
            print(f"  College: {profile.college}")
            print(f"  Department: {profile.department}")
        else:
            print("  No CoordinatorProfile found!")
    except User.DoesNotExist:
        print("User 'coordinator_ced' not found.")

    print("\n--- Checking Student Data (CED) ---")
    # Find students with college='CED'
    ced_students = StudentProfile.objects.filter(college='CED')
    print(f"Found {ced_students.count()} students in CED:")
    for s in ced_students:
        print(f"  Student: {s.user.username}, College: {s.college}")

    print("\n--- Checking All Students ---")
    students = StudentProfile.objects.all()
    print(f"Total Students: {students.count()}")
    for s in students:
        print(f"  Student: {s.user.username}, College: {s.college}, ID: {s.student_id}")

    print("\n--- Checking All Coordinators ---")
    coords = User.objects.filter(user_role__role='coordinator')
    for c in coords:
        college = "N/A"
        if hasattr(c, 'coordinator_profile'):
            college = c.coordinator_profile.college
        print(f"Coordinator: {c.username}, College: {college}")

if __name__ == '__main__':
    check_data()
