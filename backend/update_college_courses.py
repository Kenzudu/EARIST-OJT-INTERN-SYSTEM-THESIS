import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import StudentProfile

def assign_colleges():
    """
    Assign colleges to students based on their course.
    Updated with complete EARIST course list.
    """
    
    # Complete Course to College mapping based on EARIST official list
    # NOTE: Check CIT courses FIRST before CCS to avoid BSIT confusion
    course_to_college_priority = [
        # CIT - College of Industrial Technology (CHECK FIRST - has specific BSIT majors)
        ('AUTOMOTIVE', 'CIT'),
        ('ELECTRICAL TECHNOLOGY', 'CIT'),
        ('ELECTRONICS TECHNOLOGY', 'CIT'),
        ('FOOD TECHNOLOGY', 'CIT'),
        ('FASHION', 'CIT'),
        ('APPAREL', 'CIT'),
        ('INDUSTRIAL CHEMISTRY', 'CIT'),
        ('DRAFTING', 'CIT'),
        ('MACHINE SHOP', 'CIT'),
        ('REFRIGERATION', 'CIT'),
        ('AIR CONDITIONING', 'CIT'),
        ('INDUSTRIAL TECHNOLOGY', 'CIT'),
        
        # CCS - College of Computing Studies (CHECK AFTER CIT)
        ('BSINFOTECH', 'CCS'),
        ('BS INFO TECH', 'CCS'),
        ('BS INFO. TECH', 'CCS'),
        ('INFORMATION TECHNOLOGY', 'CCS'),
        ('INFO TECH', 'CCS'),
        ('BSCS', 'CCS'),
        ('COMPUTER SCIENCE', 'CCS'),
        
        # CAFA - College of Architecture and Fine Arts
        ('BS ARCHI', 'CAFA'),
        ('ARCHITECTURE', 'CAFA'),
        ('BSID', 'CAFA'),
        ('INTERIOR DESIGN', 'CAFA'),
        ('BFA', 'CAFA'),
        ('FINE ARTS', 'CAFA'),
        ('PAINTING', 'CAFA'),
        ('VISUAL COMMUNICATION', 'CAFA'),
        
        # CAS - College of Arts and Sciences (CHECK BEFORE CBA - BSAP contains "BA")
        ('BSAP', 'CAS'),
        ('APPLIED PHYSICS', 'CAS'),
        ('BSPSYCH', 'CAS'),
        ('PSYCHOLOGY', 'CAS'),
        ('BSMATH', 'CAS'),
        ('MATHEMATICS', 'CAS'),
        
        # CBA - College of Business Administration
        ('BSBA', 'CBA'),
        ('BUSINESS ADMINISTRATION', 'CBA'),
        ('MARKETING', 'CBA'),
        ('HRDM', 'CBA'),
        ('HUMAN RESOURCE', 'CBA'),
        ('BSEM', 'CBA'),
        ('ENTREPRENEURSHIP', 'CBA'),
        ('BSOA', 'CBA'),
        ('OFFICE ADMINISTRATION', 'CBA'),
        
        # CED - College of Education
        ('BSNED', 'CED'),
        ('SPECIAL NEEDS', 'CED'),
        ('BTLED', 'CED'),
        ('BTLE', 'CED'),
        ('HOME ECONOMICS', 'CED'),
        ('INDUSTRIAL ARTS', 'CED'),
        ('TCP', 'CED'),
        ('PROFESSIONAL EDUCATION', 'CED'),
        ('BSE', 'CED'),
        ('BSED', 'CED'),
        ('SECONDARY EDUCATION', 'CED'),
        
        # CEN - College of Engineering
        ('BSCHE', 'CEN'),
        ('CHEMICAL ENGINEERING', 'CEN'),
        ('BSCE', 'CEN'),
        ('CIVIL ENGINEERING', 'CEN'),
        ('BSEE', 'CEN'),
        ('ELECTRICAL ENGINEERING', 'CEN'),
        ('BSECE', 'CEN'),
        ('ELECTRONICS', 'CEN'),
        ('COMMUNICATION ENGINEERING', 'CEN'),
        ('BSME', 'CEN'),
        ('MECHANICAL ENGINEERING', 'CEN'),
        ('BSCOE', 'CEN'),
        ('COMPUTER ENGINEERING', 'CEN'),
        
        # CHM - College of Hospitality Management
        ('BST', 'CHM'),
        ('TOURISM', 'CHM'),
        ('TOURISM MANAGEMENT', 'CHM'),
        ('BSHM', 'CHM'),
        ('HOSPITALITY', 'CHM'),
        ('HOSPITALITY MANAGEMENT', 'CHM'),
        
        # CPAC - College of Public Administration and Criminology
        ('BPA', 'CPAC'),
        ('PUBLIC ADMINISTRATION', 'CPAC'),
        ('BSCRIM', 'CPAC'),
        ('CRIMINOLOGY', 'CPAC'),
    ]
    
    print("=" * 60)
    print("ASSIGNING COLLEGES TO STUDENTS")
    print("=" * 60)
    
    students = StudentProfile.objects.all()
    updated = 0
    not_found = []
    
    for student in students:
        if not student.college or student.college == '':
            # Try to assign based on course
            course_upper = student.course.upper() if student.course else ''
            
            assigned = False
            for course_key, college in course_to_college_priority:
                if course_key in course_upper:
                    student.college = college
                    student.save()
                    print(f"✓ {student.user.username}: {student.course} → {college}")
                    updated += 1
                    assigned = True
                    break
            
            if not assigned and student.course:
                not_found.append((student.user.username, student.course))
    
    print("\n" + "=" * 60)
    print(f"✓ Successfully updated {updated} students")
    print("=" * 60)
    
    if not_found:
        print("\n⚠ Students with unmapped courses:")
        print("-" * 60)
        for username, course in not_found:
            print(f"  • {username}: '{course}'")
        print("\nTo manually assign:")
        print("  student = StudentProfile.objects.get(user__username='username')")
        print("  student.college = 'CCS'  # or CAFA, CAS, CBA, CED, CEN, CHM, CIT, CPAC")
        print("  student.save()")

if __name__ == '__main__':
    assign_colleges()
