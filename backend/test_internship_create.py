import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Internship, CompanyUser
from django.contrib.auth.models import User

try:
    print("1. Getting user...")
    u = User.objects.get(username='supervisor_ccs')
    print(f"   Found user: {u}")
    
    print("2. Getting CompanyUser...")
    cu = CompanyUser.objects.get(user=u)
    print(f"   Found CompanyUser: {cu}")
    print(f"   Company: {cu.company}")
    
    print("3. Creating Internship...")
    i = Internship.objects.create(
        company=cu.company,
        position='Test Position',
        description='Test Description',
        slots=2,
        duration_hours=300,
        work_location='Manila',
        position_type='Full-time'
    )
    print(f"   SUCCESS! Created internship ID: {i.id}")
    print(f"   Position: {i.position}")
    print(f"   Duration Hours: {i.duration_hours}")
    
except Exception as e:
    import traceback
    print(f"\nERROR: {e}")
    traceback.print_exc()
