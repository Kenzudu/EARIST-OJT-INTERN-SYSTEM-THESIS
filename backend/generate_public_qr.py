import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import StudentProfile
import qrcode
from io import BytesIO
import base64

# Get the student
user = User.objects.get(student_profile__student_id='234-testing')
student_profile = user.student_profile

# The token is already generated and stored
token = student_profile.qr_code_token

# Create the PUBLIC URL (using ngrok)
public_url = f"https://unfestering-cinereous-jax.ngrok-free.dev/public/student/{token}"

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

print(f"✅ Updated QR code for student: {user.get_full_name()}")
print(f"📱 Public URL: {public_url}")
print(f"\nNow the student can:")
print("1. Go to their dashboard")
print("2. See the updated QR code")
print("3. Scan it with ANY phone (doesn't need to be on same network)")
print("\n🎯 Test it yourself by scanning the QR code on the student dashboard!")
