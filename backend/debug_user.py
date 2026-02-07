from django.contrib.auth.models import User
from core.models import StudentProfile, Application
u = User.objects.filter(id=14).first()
print(f"USER_EXISTS: {u is not None}")
if u:
    print(f"USERNAME: {u.username}")
    sp = getattr(u, 'student_profile', None)
    print(f"PROFILE_EXISTS: {sp is not None}")
    if sp:
        print(f"COLLEGE: {sp.college}")
    
    app = Application.objects.filter(student=u, status='Approved').first()
    print(f"APPROVED_APP: {app is not None}")
    if app:
        print(f"COMPANY: {app.internship.company.name}")
