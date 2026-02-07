import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import StudentProfile
import qrcode
from io import BytesIO
import base64

# Your ngrok public URL
NGROK_URL = "https://unfestering-cinereous-jax.ngrok-free.dev"

# Get all students who have QR codes
students = StudentProfile.objects.exclude(qr_code_token__isnull=True).exclude(qr_code_token='')

print(f"Found {students.count()} students with QR codes\n")

for student_profile in students:
    token = student_profile.qr_code_token
    
    # Create the PUBLIC URL (using ngrok)
    public_url = f"{NGROK_URL}/public/student/{token}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(public_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    qr_code_data_uri = f"data:image/png;base64,{img_str}"
    
    # Update the QR code image in database
    student_profile.qr_code_image = qr_code_data_uri
    student_profile.save()
    
    print(f"✅ {student_profile.user.get_full_name()} ({student_profile.student_id})")
    print(f"   URL: {public_url}\n")

print(f"\n🎉 Done! All {students.count()} QR codes now use the public ngrok URL!")
print("\nStudents should refresh their dashboard to see the updated QR code.")
