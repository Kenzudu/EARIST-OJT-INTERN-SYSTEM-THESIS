import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import StudentProfile

def assign_colleges():
    """
    Assign colleges to students based on their course.
    This is a helper script - modify the mappings as needed.
    """
    
    # Course to College mapping
    course_to_college = {
        # CCS - College of Computer Studies
        'BSCS': 'CCS',
        'COMPUTER SCIENCE': 'CCS',
        'BSIT': 'CCS',
        'INFO TECH': 'CCS',
        'INFORMATION TECHNOLOGY': 'CCS',
        'BS INFO': 'CCS',
        
        # CED - College of Education
        'BSED': 'CED',
        'BEED': 'CED',
        'EDUCATION': 'CED',
        'BSNED': 'CED',
        'SPECIAL NEEDS': 'CED',
        
        # CEN - College of Engineering
        'BSCE': 'CEN',
        'BSEE': 'CEN',
        'BSME': 'CEN',
        'ENGINEERING': 'CEN',
        
        # CBA - College of Business Administration
        'BSBA': 'CBA',
        'BSA': 'CBA',
        'BUSINESS': 'CBA',
        'ACCOUNTING': 'CBA',
        
        # CAS - College of Arts and Sciences
        'BSAP': 'CAS',
        'APPLIED PHYSICS': 'CAS',
        'PHYSICS': 'CAS',
        
        # Add more mappings as needed
    }
    
    print("--- Assigning Colleges to Students ---")
    students = StudentProfile.objects.all()
    updated = 0
    
    for student in students:
        if not student.college or student.college == '':
            # Try to assign based on course
            course_upper = student.course.upper() if student.course else ''
            
            assigned = False
            for course_key, college in course_to_college.items():
                if course_key in course_upper:
                    student.college = college
                    student.save()
                    print(f"✓ {student.user.username}: {student.course} → {college}")
                    updated += 1
                    assigned = True
                    break
            
            if not assigned:
                print(f"✗ {student.user.username}: Course '{student.course}' - No mapping found")
    
    print(f"\n✓ Updated {updated} students")
    print("\nTo manually assign a student to a college, use:")
    print("  student = StudentProfile.objects.get(user__username='username')")
    print("  student.college = 'CED'  # or CCS, CBA, etc.")
    print("  student.save()")

if __name__ == '__main__':
    assign_colleges()
