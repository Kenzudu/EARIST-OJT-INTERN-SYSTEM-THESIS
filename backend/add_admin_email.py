"""
Add email to admin1 user
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

# Update admin1 user with email
try:
    user = User.objects.get(username='admin1')
    user.email = 'kenzudu@gmail.com'
    user.save()
    print(f"✅ Email added to {user.username}: {user.email}")
except User.DoesNotExist:
    print("❌ User 'admin1' not found")
except Exception as e:
    print(f"❌ Error: {str(e)}")
