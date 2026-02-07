import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def reset_coordinator_passwords():
    """Reset all coordinator account passwords to admin12345"""
    
    # Get all coordinators (users with role='coordinator')
    coordinators = User.objects.filter(
        user_role__role='coordinator'
    )
    
    if not coordinators.exists():
        print("No coordinator accounts found.")
        return
    
    print(f"Found {coordinators.count()} coordinator accounts.")
    print("\nResetting passwords to 'admin12345'...\n")
    
    new_password = 'admin12345'
    updated_count = 0
    
    for coordinator in coordinators:
        try:
            coordinator.set_password(new_password)
            coordinator.save()
            print(f"✓ Reset password for: {coordinator.username} ({coordinator.email})")
            updated_count += 1
        except Exception as e:
            print(f"✗ Failed to reset password for {coordinator.username}: {str(e)}")
    
    print(f"\n{'='*60}")
    print(f"Password reset complete!")
    print(f"Updated {updated_count} out of {coordinators.count()} coordinator accounts")
    print(f"New password for all coordinators: {new_password}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    reset_coordinator_passwords()
