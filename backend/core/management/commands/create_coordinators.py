from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserRole, CoordinatorProfile, StudentProfile

class Command(BaseCommand):
    help = 'Creates coordinator accounts for each college'

    def handle(self, *args, **kwargs):
        colleges = StudentProfile.COLLEGE_CHOICES
        
        for code, name in colleges:
            username = f"coordinator_{code.lower()}"
            email = f"coordinator_{code.lower()}@earist.edu.ph"
            password = "password123" # Default password
            
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f'User {username} already exists'))
                continue
                
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name="Coordinator",
                last_name=code,
                is_staff=True # Coordinators are staff
            )
            
            # Assign Role
            UserRole.objects.create(user=user, role=UserRole.COORDINATOR)
            
            # Create Profile
            CoordinatorProfile.objects.create(
                user=user,
                college=code,
                department=name
            )
            
            self.stdout.write(self.style.SUCCESS(f'Created coordinator: {username}'))
