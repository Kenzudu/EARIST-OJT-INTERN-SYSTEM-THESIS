import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from core.models import StudentProfile

def test_login(username_or_id, password):
    print(f"Testing login for input: '{username_or_id}'")
    
    login_input = username_or_id
    if login_input:
        login_input = login_input.strip()
        
    resolved_username = login_input
    
    try:
        student_profile = StudentProfile.objects.get(student_id__iexact=login_input)
        print(f"  -> Found Student ID match! User: {student_profile.user.username}")
        resolved_username = student_profile.user.username
    except StudentProfile.DoesNotExist:
        print(f"  -> No Student ID match for '{login_input}'")
    except Exception as e:
        print(f"  -> Error looking up student ID: {e}")

    user = authenticate(username=resolved_username, password=password)
    if user:
        print(f"  -> SUCCESS: Authenticated as {user.username}")
    else:
        print(f"  -> FAILED: Could not authenticate user '{resolved_username}' with provided password.")

# Test cases based on previous debug_users.py output
# Rovic | 234-03142FM
print("--- Test Case 1: Correct Student ID ---")
test_login("234-03142FM", "password123") # Assuming default password, or I'll try to find a known user

print("\n--- Test Case 2: Student ID with spaces ---")
test_login("  234-03142FM  ", "password123")

print("\n--- Test Case 3: Lowercase Student ID ---")
test_login("234-03142fm", "password123")

print("\n--- Test Case 4: Username directly ---")
test_login("Rovic", "password123")
