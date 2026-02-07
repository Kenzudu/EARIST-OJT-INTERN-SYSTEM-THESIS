#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Internship, User, StudentProfile, Application
from core.matching import get_student_matches

# Test with user 'testuser_recommendations'
user = User.objects.get(username='testuser_recommendations')
user_id = user.id

print(f"\n=== Testing recommendations for user: {user.username} (id={user_id}) ===")

# Check student profile
profile = StudentProfile.objects.filter(user=user).first()
print(f"\nStudent Profile:")
if profile:
    print(f"  Bio: {profile.bio[:80] if profile.bio else 'None'}")
    print(f"  Skills: {profile.skills[:80] if profile.skills else 'None'}")
    print(f"  Career Interests: {profile.career_interests[:80] if profile.career_interests else 'None'}")
else:
    print("  No profile found")

# Check applications
apps = Application.objects.filter(student=user)
print(f"\nApplications: {apps.count()}")
for app in apps:
    print(f"  - {app.internship.position} ({app.status})")

# Try to get recommendations
print(f"\nTrying to get recommendations...")
try:
    matches = get_student_matches(user_id, top_n=10)
    print(f"Matches found: {len(matches)}")
    print(f"Type of matches: {type(matches)}")
    print(f"Raw matches: {matches}")
    if isinstance(matches, list):
        for i, match in enumerate(matches):
            print(f"  [{i}] type={type(match)}, content={match}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
