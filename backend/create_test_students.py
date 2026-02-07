import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import StudentProfile, UserRole

def create_test_students():
    """Create 2 test students for each college (except CCS and GS)"""
    
    students_data = [
        # CED - College of Education
        {
            'username': 'student_ced_1',
            'email': 'student_ced_1@earist.edu.ph',
            'first_name': 'Maria',
            'last_name': 'Santos',
            'password': 'password123',
            'student_id': '2024-CED-001',
            'course': 'Bachelor of Elementary Education (BEEd)',
            'college': 'CED',
            'year': '3rd Year',
            'section': 'A'
        },
        {
            'username': 'student_ced_2',
            'email': 'student_ced_2@earist.edu.ph',
            'first_name': 'Jose',
            'last_name': 'Reyes',
            'password': 'password123',
            'student_id': '2024-CED-002',
            'course': 'Bachelor of Secondary Education (BSEd) - Major in Mathematics',
            'college': 'CED',
            'year': '4th Year',
            'section': 'B'
        },
        
        # CEN - College of Engineering
        {
            'username': 'student_cen_1',
            'email': 'student_cen_1@earist.edu.ph',
            'first_name': 'Carlos',
            'last_name': 'Garcia',
            'password': 'password123',
            'student_id': '2024-CEN-001',
            'course': 'Bachelor of Science in Civil Engineering (BSCE)',
            'college': 'CEN',
            'year': '3rd Year',
            'section': 'A'
        },
        {
            'username': 'student_cen_2',
            'email': 'student_cen_2@earist.edu.ph',
            'first_name': 'Miguel',
            'last_name': 'Torres',
            'password': 'password123',
            'student_id': '2024-CEN-002',
            'course': 'Bachelor of Science in Electrical Engineering (BSEE)',
            'college': 'CEN',
            'year': '4th Year',
            'section': 'B'
        },
        
        # CIT - College of Industrial Technology
        {
            'username': 'student_cit_1',
            'email': 'student_cit_1@earist.edu.ph',
            'first_name': 'Ramon',
            'last_name': 'Cruz',
            'password': 'password123',
            'student_id': '2024-CIT-001',
            'course': 'Bachelor of Industrial Technology (BIT) - Major in Automotive Technology',
            'college': 'CIT',
            'year': '3rd Year',
            'section': 'A'
        },
        {
            'username': 'student_cit_2',
            'email': 'student_cit_2@earist.edu.ph',
            'first_name': 'Pedro',
            'last_name': 'Mendoza',
            'password': 'password123',
            'student_id': '2024-CIT-002',
            'course': 'Bachelor of Industrial Technology (BIT) - Major in Electrical Technology',
            'college': 'CIT',
            'year': '4th Year',
            'section': 'B'
        },
        
        # CBA - College of Business Administration
        {
            'username': 'student_cba_1',
            'email': 'student_cba_1@earist.edu.ph',
            'first_name': 'Ana',
            'last_name': 'Ramos',
            'password': 'password123',
            'student_id': '2024-CBA-001',
            'course': 'Bachelor of Science in Business Administration (BSBA) - Major in Financial Management',
            'college': 'CBA',
            'year': '3rd Year',
            'section': 'A'
        },
        {
            'username': 'student_cba_2',
            'email': 'student_cba_2@earist.edu.ph',
            'first_name': 'Luis',
            'last_name': 'Fernandez',
            'password': 'password123',
            'student_id': '2024-CBA-002',
            'course': 'Bachelor of Science in Accountancy (BSA)',
            'college': 'CBA',
            'year': '4th Year',
            'section': 'B'
        },
        
        # CAS - College of Arts and Sciences
        {
            'username': 'student_cas_1',
            'email': 'student_cas_1@earist.edu.ph',
            'first_name': 'Sofia',
            'last_name': 'Villanueva',
            'password': 'password123',
            'student_id': '2024-CAS-001',
            'course': 'Bachelor of Science in Applied Physics (BSAP)',
            'college': 'CAS',
            'year': '3rd Year',
            'section': 'A'
        },
        {
            'username': 'student_cas_2',
            'email': 'student_cas_2@earist.edu.ph',
            'first_name': 'Diego',
            'last_name': 'Morales',
            'password': 'password123',
            'student_id': '2024-CAS-002',
            'course': 'Bachelor of Science in Applied Mathematics (BSAM)',
            'college': 'CAS',
            'year': '4th Year',
            'section': 'B'
        },
        
        # CHM - College of Hospitality Management
        {
            'username': 'student_chm_1',
            'email': 'student_chm_1@earist.edu.ph',
            'first_name': 'Isabella',
            'last_name': 'Castillo',
            'password': 'password123',
            'student_id': '2024-CHM-001',
            'course': 'Bachelor of Science in Hospitality Management (BSHM)',
            'college': 'CHM',
            'year': '3rd Year',
            'section': 'A'
        },
        {
            'username': 'student_chm_2',
            'email': 'student_chm_2@earist.edu.ph',
            'first_name': 'Gabriel',
            'last_name': 'Navarro',
            'password': 'password123',
            'student_id': '2024-CHM-002',
            'course': 'Bachelor of Science in Tourism Management (BSTM)',
            'college': 'CHM',
            'year': '4th Year',
            'section': 'B'
        },
        
        # CPAC - College of Public Administration and Criminology
        {
            'username': 'student_cpac_1',
            'email': 'student_cpac_1@earist.edu.ph',
            'first_name': 'Ricardo',
            'last_name': 'Aquino',
            'password': 'password123',
            'student_id': '2024-CPAC-001',
            'course': 'Bachelor of Science in Criminology (BSCrim)',
            'college': 'CPAC',
            'year': '3rd Year',
            'section': 'A'
        },
        {
            'username': 'student_cpac_2',
            'email': 'student_cpac_2@earist.edu.ph',
            'first_name': 'Manuel',
            'last_name': 'Santiago',
            'password': 'password123',
            'student_id': '2024-CPAC-002',
            'course': 'Bachelor of Public Administration (BPA)',
            'college': 'CPAC',
            'year': '4th Year',
            'section': 'B'
        },
        
        # CAFA - College of Architecture and Fine Arts
        {
            'username': 'student_cafa_1',
            'email': 'student_cafa_1@earist.edu.ph',
            'first_name': 'Elena',
            'last_name': 'Bautista',
            'password': 'password123',
            'student_id': '2024-CAFA-001',
            'course': 'Bachelor of Science in Architecture (BS Arch)',
            'college': 'CAFA',
            'year': '3rd Year',
            'section': 'A'
        },
        {
            'username': 'student_cafa_2',
            'email': 'student_cafa_2@earist.edu.ph',
            'first_name': 'Antonio',
            'last_name': 'Flores',
            'password': 'password123',
            'student_id': '2024-CAFA-002',
            'course': 'Bachelor of Fine Arts (BFA) - Major in Advertising Arts',
            'college': 'CAFA',
            'year': '4th Year',
            'section': 'B'
        },
    ]
    
    print("--- Creating Test Students ---")
    created = 0
    
    for data in students_data:
        try:
            # Check if user already exists
            if User.objects.filter(username=data['username']).exists():
                print(f"✗ {data['username']} already exists - skipping")
                continue
            
            # Create user
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                password=data['password']
            )
            
            # Create user role
            UserRole.objects.create(user=user, role='student')
            
            # Create student profile
            StudentProfile.objects.create(
                user=user,
                student_id=data['student_id'],
                course=data['course'],
                college=data['college'],
                year=data['year'],
                section=data['section']
            )
            
            print(f"✓ Created {data['username']} - {data['college']} - {data['course']}")
            created += 1
            
        except Exception as e:
            print(f"✗ Error creating {data['username']}: {str(e)}")
    
    print(f"\n✓ Successfully created {created} test students")
    print("\nAll students have password: password123")
    print("\nYou can now test each coordinator account to verify they see only their college's students!")

if __name__ == '__main__':
    create_test_students()
