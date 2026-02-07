import os
import django
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Company, UserRole, CompanyUser

def create_supervisors():
    # Map colleges to specific company names to ensure 1:1 mapping
    COLLEGE_COMPANIES = {
        'CCS': 'TechVision Solutions Inc.',
        'CAS': 'Global Research Analytics',
        'CBA': 'Prime Financial Group',
        'CED': 'Future Minds Academy',
        'CEN': 'BuildMaster Construction',
        'CHM': 'Royal Palms Hotel & Resort',
        'CIT': 'Industrial Tech Innovations',
        'CPAC': 'Public Service Partners',
        'CAFA': 'Design & Structure Architects'
    }
    
    print(f"Ensuring 1 company and 1 supervisor for each of the {len(COLLEGE_COMPANIES)} colleges...")

    created_count = 0
    
    for college, company_name in COLLEGE_COMPANIES.items():
        print(f"\nProcessing College: {college}")
        
        # 1. Get or Create the Company
        company, created = Company.objects.get_or_create(
            name=company_name,
            defaults={
                'address': '123 Business District, Manila',
                'contact_person': 'HR Manager',
                'contact_email': f'hr@{company_name.lower().replace(" ", "").replace(".", "")}.com',
                'phone': '09171234567',
                'industry': 'Various',
                'description': f'A leading company partnering with {college}.',
                'status': 'Approved',
                'target_colleges': [college] # Target ONLY this college
            }
        )
        
        if created:
            print(f"  Created new company: {company.name}")
        else:
            print(f"  Found existing company: {company.name}")
            # Ensure it targets this college
            if college not in company.target_colleges:
                company.target_colleges.append(college)
                company.save()
                print(f"  Updated target colleges for {company.name}")

        # 2. Create Supervisor for this Company
        username = f"supervisor_{college.lower()}_v2" # v2 to avoid conflict with previous script
        email = f"supervisor_{college.lower()}_v2@example.com"
        password = "password123"
        
        if User.objects.filter(username=username).exists():
            print(f"  User {username} already exists. Skipping.")
            continue
            
        try:
            # Create User
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name="Supervisor",
                last_name=f"{college}"
            )
            
            # Create UserRole
            UserRole.objects.create(user=user, role='supervisor')
            
            # Create CompanyUser
            CompanyUser.objects.create(
                user=user,
                company=company,
                position=f"OJT Supervisor ({college})",
                phone="09123456789"
            )
            
            print(f"  Created supervisor linked to {company.name} (User: {username})")
            created_count += 1
            
        except Exception as e:
            print(f"  Failed to create supervisor for {college}: {e}")

    print(f"\nSuccessfully created {created_count} supervisors.")

if __name__ == "__main__":
    create_supervisors()
