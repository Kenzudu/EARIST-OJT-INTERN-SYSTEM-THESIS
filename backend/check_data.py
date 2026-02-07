#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Internship, User, StudentProfile, Application, Company

print("=== DATABASE CHECK ===")
print(f"Companies: {Company.objects.count()}")
print(f"Internships: {Internship.objects.count()}")
print(f"Users: {User.objects.count()}")
print(f"Student Profiles: {StudentProfile.objects.count()}")
print(f"Applications: {Application.objects.count()}")

print("\n=== USERS ===")
for user in User.objects.all():
    print(f"  {user.username} (staff: {user.is_staff})")
    profile = StudentProfile.objects.filter(user=user).first()
    if profile:
        print(f"    -> Profile: {profile.bio[:50] if profile.bio else 'No bio'}")

print("\n=== INTERNSHIPS ===")
for internship in Internship.objects.all()[:5]:
    print(f"  {internship.position} - {internship.company.name}")
