"""
Script to migrate existing users to the new role-based system.
Run this after creating the UserRole model and running migrations.

Usage:
    python migrate_roles.py
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole, StudentProfile, Supervisor, CompanyUser


def migrate_roles():
    """Assign roles to all existing users"""
    
    print("Starting role migration...")
    print("=" * 50)
    
    # Get all users
    users = User.objects.all()
    total_users = users.count()
    print(f"Found {total_users} users to process\n")
    
    assigned_count = 0
    skipped_count = 0
    
    for user in users:
        # Skip if user already has a role
        if hasattr(user, 'user_role'):
            print(f"⏭️  Skipping {user.username} - already has role: {user.user_role.get_role_display()}")
            skipped_count += 1
            continue
        
        # Determine role based on existing data
        role = None
        role_reason = ""
        
        # Check if user is a student (has StudentProfile)
        if hasattr(user, 'student_profile'):
            role = UserRole.STUDENT
            role_reason = "has StudentProfile"
        
        # Check if user is a supervisor (in Supervisor model)
        elif Supervisor.objects.filter(user=user).exists():
            role = UserRole.SUPERVISOR
            role_reason = "in Supervisor model"
        
        # Check if user is a company user (in CompanyUser model)
        elif CompanyUser.objects.filter(user=user).exists():
            role = UserRole.SUPERVISOR
            role_reason = "in CompanyUser model"
        
        # Check if user is staff (admin/coordinator)
        elif user.is_staff:
            # First staff user becomes admin, others become coordinators
            if not UserRole.objects.filter(role=UserRole.ADMIN).exists():
                role = UserRole.ADMIN
                role_reason = "first staff user (superuser)"
            else:
                role = UserRole.COORDINATOR
                role_reason = "staff user"
        
        # Default to student if no other role found
        else:
            role = UserRole.STUDENT
            role_reason = "default (no specific profile found)"
        
        # Create UserRole
        user_role = UserRole.objects.create(user=user, role=role)
        print(f"✅ Assigned {user.username} → {user_role.get_role_display()} ({role_reason})")
        assigned_count += 1
    
    print("\n" + "=" * 50)
    print("Migration Summary:")
    print(f"  Total users: {total_users}")
    print(f"  Assigned roles: {assigned_count}")
    print(f"  Skipped (already had role): {skipped_count}")
    print("=" * 50)
    
    # Show role distribution
    print("\nRole Distribution:")
    for role_code, role_name in UserRole.ROLE_CHOICES:
        count = UserRole.objects.filter(role=role_code).count()
        print(f"  {role_name}: {count}")
    
    print("\n✅ Role migration completed successfully!")


if __name__ == '__main__':
    try:
        migrate_roles()
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()
