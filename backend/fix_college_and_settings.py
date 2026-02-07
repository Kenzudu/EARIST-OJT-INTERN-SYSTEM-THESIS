import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import StudentProfile, User, CoordinatorSettings, CoordinatorProfile

# 1. Update Student to CCS
try:
    student = User.objects.get(username='234-testing')
    profile = student.student_profile
    profile.college = 'CCS' # College of Computing Studies (IT)
    profile.save()
    print("Updated 234-testing to CCS")
except Exception as e:
    print(f"Error updating student: {e}")

# 2. Seed CCS Coordinator Settings
try:
    coord_user = User.objects.get(username='coordinator_ccs')
    settings, created = CoordinatorSettings.objects.get_or_create(coordinator=coord_user)
    
    # Match the screenshot: Resume/CV, Application Letter, Endorsement Letter
    settings.required_docs = [
        {'name': 'Resume/CV', 'required': True},
        {'name': 'Application Letter', 'required': True},
        {'name': 'Endorsement Letter', 'required': True}
    ]
    settings.save()
    print("Updated coordinator_ccs settings to match screenshot.")
    
except Exception as e:
    print(f"Error updating settings: {e}")
