#!/usr/bin/env python
"""
Populate comprehensive test data for internship recommendations
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Company, Internship, StudentProfile, Application

# Get or create test student user
student_user, created = User.objects.get_or_create(
    username='testuser_recommendations',
    defaults={
        'email': 'teststudent@example.com',
        'first_name': 'Test',
        'last_name': 'Student',
        'is_staff': False
    }
)

# Set password
if created or not student_user.check_password('password123'):
    student_user.set_password('password123')
    student_user.save()
    print(f"Password set for {student_user.username}")

print(f"Student user: {student_user.username} (created: {created})")

# Create or update student profile
profile, created = StudentProfile.objects.get_or_create(
    user=student_user,
    defaults={
        'bio': 'Passionate software developer interested in web development and cloud technologies',
        'skills': 'Python, JavaScript, React, Django, SQL, Git',
        'career_interests': 'Full-stack development, cloud engineering',
        'certifications': 'Google Cloud Associate Cloud Engineer'
    }
)
print(f"Student profile: {'created' if created else 'updated'}")

# Get or create companies (with unique names)
company1, _ = Company.objects.get_or_create(
    name='Tech Startup Inc.',
    defaults={
        'address': 'BGC, Manila',
        'contact_person': 'John Doe',
        'contact_email': 'john@techstartup.com',
        'phone': '02-1111-1111',
        'website': 'https://techstartup.com',
        'industry': 'Software Development',
        'description': 'Fast-growing tech startup'
    }
)

company2, _ = Company.objects.get_or_create(
    name='Web Solutions Ltd.',
    defaults={
        'address': 'Makati, Manila',
        'contact_person': 'Maria Santos',
        'contact_email': 'maria@websolutions.com',
        'phone': '02-2222-2222',
        'website': 'https://websolutions.com',
        'industry': 'Web Development',
        'description': 'Full-stack web development company'
    }
)

# Create multiple internships with various skills
internships_data = [
    {
        'position': 'Python Backend Developer',
        'company': company1,
        'description': 'Build scalable APIs using Django and PostgreSQL',
        'required_skills': 'Python, Django, SQL, REST APIs',
        'work_location': 'BGC, Manila',
        'duration_weeks': 8,
        'stipend': '15000',
        'position_type': 'Full-time',
        'slots': 2
    },
    {
        'position': 'React Frontend Developer',
        'company': company2,
        'description': 'Develop responsive web UIs with React',
        'required_skills': 'JavaScript, React, CSS, HTML',
        'work_location': 'Makati, Manila',
        'duration_weeks': 8,
        'stipend': '15000',
        'position_type': 'Full-time',
        'slots': 1
    },
    {
        'position': 'Full-stack Developer',
        'company': company1,
        'description': 'Work on full-stack web applications',
        'required_skills': 'Python, JavaScript, React, Django, SQL',
        'work_location': 'BGC, Manila',
        'duration_weeks': 12,
        'stipend': '18000',
        'position_type': 'Full-time',
        'slots': 1
    },
]

created_internships = []
for data in internships_data:
    internship, created = Internship.objects.get_or_create(
        position=data['position'],
        company=data['company'],
        defaults={k: v for k, v in data.items() if k not in ['position', 'company']}
    )
    created_internships.append(internship)
    print(f"Internship: {internship.position} at {internship.company.name} ({'created' if created else 'updated'})")

# Create applications to simulate interest
if len(created_internships) > 0:
    app1, _ = Application.objects.get_or_create(
        student=student_user,
        internship=created_internships[0],
        defaults={'status': 'Pending', 'cover_letter': 'I am interested in this position'}
    )
    print(f"Application 1: created")

print("\n✅ Test data populated successfully!")
print(f"Ready for testing recommendations with user: {student_user.username}")
