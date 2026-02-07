#!/usr/bin/env python
"""
Populate recommendation data for existing users
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Company, Internship, StudentProfile, Application

# Update existing users with profiles and applications
users_to_update = ['kenzu', 'hello']

for username in users_to_update:
    try:
        user = User.objects.get(username=username)
        print(f"\nUpdating user: {username}")
        
        # Create or update profile
        profile, created = StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Passionate developer interested in technology and innovation',
                'skills': 'Python, JavaScript, React, Django, SQL',
                'career_interests': 'Web development, software engineering',
                'certifications': 'AWS Certified Cloud Practitioner'
            }
        )
        if not created:
            profile.bio = 'Passionate developer interested in technology and innovation'
            profile.skills = 'Python, JavaScript, React, Django, SQL'
            profile.career_interests = 'Web development, software engineering'
            profile.certifications = 'AWS Certified Cloud Practitioner'
            profile.save()
        
        print(f"  Profile: {'created' if created else 'updated'}")
        
        # Get existing internships
        internships = Internship.objects.all()
        
        # Create applications for first 2 internships
        for internship in internships[:2]:
            app, created = Application.objects.get_or_create(
                student=user,
                internship=internship,
                defaults={
                    'status': 'Pending',
                    'cover_letter': f'I am interested in the {internship.position} position.'
                }
            )
            print(f"  Application: {internship.position} - {'created' if created else 'updated'}")
        
    except User.DoesNotExist:
        print(f"User {username} not found")

print("\n✅ All users updated!")
