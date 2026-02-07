"""
Management command to assign roles to existing users.
This should be run once after adding the UserRole model.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserRole, StudentProfile, Supervisor, CompanyUser


class Command(BaseCommand):
    help = 'Assign roles to existing users based on their profiles'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting role assignment...'))
        
        users_updated = 0
        users_created = 0
        
        for user in User.objects.all():
            # Check if user already has a role
            if hasattr(user, 'user_role'):
                self.stdout.write(f'User {user.username} already has role: {user.user_role.role}')
                continue
            
            # Determine role based on existing data
            role = None
            
            # Check if user is admin/superuser
            if user.is_superuser or user.is_staff:
                role = UserRole.ADMIN
                self.stdout.write(f'Assigning ADMIN role to {user.username} (staff/superuser)')
            
            # Check if user has a Supervisor profile (OJT Adviser)
            elif hasattr(user, 'supervisor_profile'):
                role = UserRole.COORDINATOR  # Supervisors are coordinators in the new system
                self.stdout.write(f'Assigning COORDINATOR role to {user.username} (has supervisor profile)')
            
            # Check if user has a CompanyUser profile (Company Supervisor)
            elif hasattr(user, 'company_user_profile'):
                role = UserRole.SUPERVISOR
                self.stdout.write(f'Assigning SUPERVISOR role to {user.username} (has company profile)')
            
            # Check if user has a StudentProfile (Student)
            elif hasattr(user, 'student_profile'):
                role = UserRole.STUDENT
                self.stdout.write(f'Assigning STUDENT role to {user.username} (has student profile)')
            
            # Default to student if no profile exists
            else:
                role = UserRole.STUDENT
                self.stdout.write(self.style.WARNING(
                    f'No profile found for {user.username}, defaulting to STUDENT role'
                ))
            
            # Create UserRole
            if role:
                UserRole.objects.create(user=user, role=role)
                users_created += 1
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Created role {role} for user {user.username}'
                ))
        
        self.stdout.write(self.style.SUCCESS(
            f'\nRole assignment complete! Created {users_created} role assignments.'
        ))
