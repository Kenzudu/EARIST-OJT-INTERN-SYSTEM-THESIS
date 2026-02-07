"""
Regenerate all student QR codes with the current FRONTEND_URL from .env
This script should be run whenever the ngrok URL changes
"""
import os
import django
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import StudentProfile
from core.two_factor_utils import generate_student_qr_code
from django.conf import settings

# Get the current frontend URL from settings
FRONTEND_URL = settings.FRONTEND_URL

print(f"🔄 Regenerating QR codes with URL: {FRONTEND_URL}\n")
print("=" * 70)

# Get all students who have QR codes
students = StudentProfile.objects.exclude(qr_code_token__isnull=True).exclude(qr_code_token='')

total_students = students.count()
print(f"Found {total_students} students with QR codes\n")

if total_students == 0:
    print("❌ No students found with QR codes!")
    print("   Students need to generate their QR codes first from their dashboard.")
    exit(0)

# Regenerate each QR code
success_count = 0
for idx, student_profile in enumerate(students, 1):
    try:
        token = student_profile.qr_code_token
        
        # Generate new QR code using the utility function
        # This will automatically use the FRONTEND_URL from settings
        qr_code_image = generate_student_qr_code(token)
        
        # Update the QR code image in database
        student_profile.qr_code_image = qr_code_image
        student_profile.save()
        
        student_name = student_profile.user.get_full_name() or student_profile.user.username
        student_id = student_profile.student_id or "N/A"
        
        print(f"✅ [{idx}/{total_students}] {student_name} ({student_id})")
        print(f"   URL: {FRONTEND_URL}/public/student/{token}")
        
        success_count += 1
    except Exception as e:
        print(f"❌ [{idx}/{total_students}] Error: {e}")

print("\n" + "=" * 70)
print(f"\n🎉 Done! Successfully regenerated {success_count}/{total_students} QR codes!")
print(f"📱 All QR codes now point to: {FRONTEND_URL}")
print("\n💡 Students should refresh their dashboard to see the updated QR code.")
print("\n⚠️  IMPORTANT: If your ngrok URL changes, run this script again:")
print("   python regenerate_qr_codes.py")
