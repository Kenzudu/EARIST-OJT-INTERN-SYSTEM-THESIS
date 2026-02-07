#!/usr/bin/env python
"""
Populate recommendation data for all users
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import StudentProfile, Application, Internship

print('Setting up recommendation data for all users...\n')

# Get or create internships
internships = Internship.objects.all()
print(f'Available internships: {internships.count()}')

# Update all non-admin users
for user in User.objects.filter(is_staff=False):
    print(f'\nProcessing user: {user.username}')
    
    # Create or update profile
    profile, created = StudentProfile.objects.get_or_create(
        user=user,
        defaults={
            'bio': 'Passionate developer interested in web development and cloud solutions',
            'skills': 'Python, JavaScript, React, Django, SQL, Git, REST APIs',
            'career_interests': 'Full-stack development, cloud engineering, software architecture',
            'certifications': 'Google Cloud Associate Cloud Engineer'
        }
    )
    
    if not created:
        profile.bio = 'Passionate developer interested in web development and cloud solutions'
        profile.skills = 'Python, JavaScript, React, Django, SQL, Git, REST APIs'
        profile.career_interests = 'Full-stack development, cloud engineering, software architecture'
        profile.certifications = 'Google Cloud Associate Cloud Engineer'
        profile.save()
    
    print(f'  Profile: {"created" if created else "updated"}')
    
    # Create applications for first 2 internships
    app_count = 0
    for internship in internships[:2]:
        app, created = Application.objects.get_or_create(
            student=user,
            internship=internship,
            defaults={'status': 'Pending', 'cover_letter': f'Interested in {internship.position}'}
        )
        if created:
            app_count += 1
    
    total_apps = Application.objects.filter(student=user).count()
    print(f'  Applications: {app_count} new, total: {total_apps}')

print('\n✅ All users updated with recommendation data!')
