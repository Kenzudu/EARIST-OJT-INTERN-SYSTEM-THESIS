import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import User, Attendance, DailyJournal

try:
    # Try finding user by username or checking similar
    users = User.objects.filter(username__contains='234')
    for u in users:
        print(f"User: {u.username} (ID: {u.id})")
        
        # Check Attendance
        atts = Attendance.objects.filter(student=u)
        print(f"  Attendance Records ({atts.count()}):")
        for a in atts:
            print(f"    - Date: {a.date}, Status: {a.status}, Hours: {a.hours_rendered}")

        # Check Journals
        journals = DailyJournal.objects.filter(student=u)
        print(f"  Journal Entries ({journals.count()}):")
        for j in journals:
            print(f"    - Date: {j.date}, Status: {j.status}")
            
except Exception as e:
    print(f"Error: {e}")
