#!/usr/bin/env python
"""
Sample Data Population Script
Run with: python manage.py shell < populate_sample_data.py
"""

import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Company, Internship, StudentProfile, Application

# Clear existing data
print("Clearing existing data...")
Application.objects.all().delete()
Internship.objects.all().delete()
Company.objects.all().delete()
StudentProfile.objects.all().delete()
User.objects.filter(username__in=['testuser', 'admin_user']).delete()

print("Creating sample data...\n")

# Create Companies
print("1. Creating Companies...")
company1 = Company.objects.create(
    name="Tech Innovations Inc.",
    address="123 Tech Street, Manila",
    contact_person="John Smith",
    contact_email="john@techinnovations.com",
    phone="02-1234-5678",
    website="https://techinnovations.com",
    industry="Information Technology",
    description="Leading software development company specializing in cloud solutions"
)

company2 = Company.objects.create(
    name="Digital Solutions PH",
    address="456 Digital Ave, Makati",
    contact_person="Maria Garcia",
    contact_email="maria@digitalsolutions.ph",
    phone="02-9876-5432",
    website="https://digitalsolutions.ph",
    industry="Software Development",
    description="Full-stack development agency for fintech and e-commerce"
)

company3 = Company.objects.create(
    name="MOA Consulting",
    address="789 Business Park, BGC",
    contact_person="Alex Chen",
    contact_email="alex@moaconsulting.com",
    phone="02-5555-5555",
    website="https://moaconsulting.com",
    industry="Business Consulting",
    description="Strategic IT consulting firm"
)
print(f"✓ Created {Company.objects.count()} companies\n")

# Create Internships
print("2. Creating Internships...")
internship1 = Internship.objects.create(
    company=company1,
    position="Frontend Developer Intern",
    description="Work on modern React applications. You will learn best practices in web development and work with senior developers on real-world projects.",
    slots=3,
    required_skills="ReactJS, JavaScript ES6+, HTML5, CSS3, Git",
    work_location="BGC, Manila",
    duration_weeks=8,
    stipend="5,000",
    position_type="Full-time"
)

internship2 = Internship.objects.create(
    company=company1,
    position="Backend Developer Intern",
    description="Develop RESTful APIs using Python/Django. Learn database design, API security, and deployment practices.",
    slots=2,
    required_skills="Python, Django, PostgreSQL, REST APIs, Docker",
    work_location="Makati, Manila",
    duration_weeks=8,
    stipend="6,000",
    position_type="Full-time"
)

internship3 = Internship.objects.create(
    company=company2,
    position="Full Stack Developer Intern",
    description="Build complete applications from frontend to backend. Work with the team on production systems.",
    slots=1,
    required_skills="ReactJS, NodeJS, MongoDB, Docker, AWS",
    work_location="Quezon City",
    duration_weeks=10,
    stipend="7,000",
    position_type="Full-time"
)

internship4 = Internship.objects.create(
    company=company3,
    position="Cloud Solutions Intern",
    description="Support cloud infrastructure projects. Learn AWS services and DevOps practices.",
    slots=2,
    required_skills="AWS, Linux, Docker, Python, Terraform",
    work_location="Remote",
    duration_weeks=12,
    stipend="5,500",
    position_type="Full-time"
)
print(f"✓ Created {Internship.objects.count()} internships\n")

# Create Test User with Profile
print("3. Creating Test Student...")
user = User.objects.create_user(
    username='testuser',
    email='testuser@example.com',
    password='testpass123',
    first_name='John',
    last_name='Doe'
)

profile = StudentProfile.objects.create(
    user=user,
    bio="A passionate software developer with experience in web technologies. I love learning new frameworks and solving complex problems.",
    phone="09123456789",
    skills="ReactJS, JavaScript, HTML/CSS, Python, SQL, Git, Docker",
    certifications="Google Cloud Associate Cloud Engineer, AWS Certified Cloud Practitioner",
    career_interests="Full Stack Development, Cloud Engineering, DevOps",
    resume_url="https://example.com/resume.pdf"
)
print(f"✓ Created test user: {user.username}")
print(f"✓ Created student profile with skills: {profile.skills}\n")

# Create Applications
print("4. Creating Sample Applications...")
app1 = Application.objects.create(
    student=user,
    internship=internship1,
    status="Approved",
    cover_letter="I am very interested in this Frontend Developer position. My experience with React makes me a good fit for this role.",
    feedback="Great technical skills! Excellent communication and teamwork. Keep up the good work!"
)

app2 = Application.objects.create(
    student=user,
    internship=internship3,
    status="Pending",
    cover_letter="As a full stack developer, I am excited to contribute to your team and learn from experienced professionals."
)

app3 = Application.objects.create(
    student=user,
    internship=internship2,
    status="Rejected",
    cover_letter="I would like to apply for the Backend Developer position.",
    feedback="While your resume is impressive, we felt the other candidate had more specific Django experience."
)
print(f"✓ Created {Application.objects.count()} applications\n")

print("=" * 60)
print("SAMPLE DATA POPULATION COMPLETE!")
print("=" * 60)
print(f"\nTest Account:")
print(f"  Username: testuser")
print(f"  Email: testuser@example.com")
print(f"  Password: testpass123")
print(f"\nProfile Information:")
print(f"  Skills: {profile.skills}")
print(f"  Career Interests: {profile.career_interests}")
print(f"  Certifications: {profile.certifications}")
print(f"\nData Created:")
print(f"  • {Company.objects.count()} Companies")
print(f"  • {Internship.objects.count()} Internships")
print(f"  • {Application.objects.count()} Applications with various statuses")
print(f"\nNext Steps:")
print(f"  1. Login with testuser account")
print(f"  2. Visit the Recommendations page to see AI-generated guidance based on profile")
print(f"  3. Check Applications to see application management")
print(f"  4. Update your profile to see recommendations update accordingly")
