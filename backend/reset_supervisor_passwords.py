import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def reset_supervisor_passwords():
    """Reset all supervisor account passwords to admin12345"""
    
    # Get all supervisors (users with role='supervisor')
    supervisors = User.objects.filter(
        user_role__role='supervisor'
    )
    
    if not supervisors.exists():
        print("No supervisor accounts found.")
        return
    
    print(f"Found {supervisors.count()} supervisor accounts.")
    print("\nResetting passwords to 'admin12345'...\n")
    
    new_password = 'admin12345'
    updated_count = 0
    
    for supervisor in supervisors:
        try:
            supervisor.set_password(new_password)
            supervisor.save()
            print(f"✓ Reset password for: {supervisor.username} ({supervisor.email})")
            updated_count += 1
        except Exception as e:
            print(f"✗ Failed to reset password for {supervisor.username}: {str(e)}")
    
    print(f"\n{'='*60}")
    print(f"Password reset complete!")
    print(f"Updated {updated_count} out of {supervisors.count()} supervisor accounts")
    print(f"New password for all supervisors: {new_password}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    reset_supervisor_passwords()
