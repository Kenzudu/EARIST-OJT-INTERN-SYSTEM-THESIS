import os
import django
import datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import User, Attendance, DailyJournal, Application

TARGET_USERNAME = '234-03828M'

try:
    student = User.objects.get(username=TARGET_USERNAME)
    print(f"Found student: {student.username} (ID: {student.id})")

    # 1. Clear Journals
    deleted_journals, _ = DailyJournal.objects.filter(student=student).delete()
    print(f"Deleted {deleted_journals} Journal entries.")

    # 2. Clear Attendance
    deleted_attendance, _ = Attendance.objects.filter(student=student).delete()
    print(f"Deleted {deleted_attendance} Attendance records.")

    # 3. Seed ONE Approved Attendance for Testing
    # This allows the user to immediately see the 'Pending Journal' logic
    app = Application.objects.filter(student=student, status='Approved').first()
    
    test_date = datetime.date.today()
    Attendance.objects.create(
        student=student,
        application=app,
        date=test_date,
        time_in=datetime.time(8, 0),
        time_out=datetime.time(17, 0),
        hours_rendered=Decimal('8.00'),
        status='Present',
        notes="Seeded for Journal Linking Test"
    )
    print(f"Created ONE Approved Attendance record for {test_date} to test linking.")

except User.DoesNotExist:
    print(f"User {TARGET_USERNAME} not found.")
except Exception as e:
    print(f"Error: {e}")
