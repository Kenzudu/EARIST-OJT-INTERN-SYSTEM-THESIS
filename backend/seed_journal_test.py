import os
import django
import datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import User, Attendance, Application

try:
    student = User.objects.get(username='234-testing')
    
    # Check for approved application (needed for ForeignKey usually, but nullable)
    app = Application.objects.filter(student=student, status='Approved').first()
    
    # Create an APPROVED attendance record for Yesterday (so it's in the past)
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    
    # Check if exists
    existing = Attendance.objects.filter(student=student, date=yesterday).first()
    if existing:
        print(f"Updating existing record for {yesterday}...")
        existing.status = 'Present'
        existing.time_in = datetime.time(8, 0)
        existing.time_out = datetime.time(17, 0)
        existing.hours_rendered = Decimal('8.00')
        existing.save()
    else:
        print(f"Creating new Present record for {yesterday}...")
        Attendance.objects.create(
            student=student,
            application=app,
            date=yesterday,
            time_in=datetime.time(8, 0),
            time_out=datetime.time(17, 0),
            hours_rendered=Decimal('8.00'),
            status='Present',
            notes="Seeded for Journal Test"
        )
    
    print("Success: Verified Attendance Record created/updated.")
    
except User.DoesNotExist:
    print("User 234-testing not found.")
except Exception as e:
    print(f"Error: {e}")
