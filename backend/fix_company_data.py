import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import CompanyUser

User = get_user_model()

print("Fixing Company Data...")

try:
    # 1. Fetch Supervisor
    sup_username = 'supervisor_ccs'
    if not User.objects.filter(username=sup_username).exists():
        # Fallback to check by ID 76 if username changed (unlikely)
        if User.objects.filter(id=76).exists():
            sup = User.objects.get(id=76)
            print(f"Found user by ID 76: {sup.username}")
        else:
            print("Error: supervisor_ccs not found.")
            sys.exit(1)
    else:
         sup = User.objects.get(username=sup_username)

    print(f"Supervisor: {sup.username} | Name: {sup.get_full_name()}")

    # Ensure Name is Ryuken Ishida if blank (User mentioned 'Ryuken Ishida' as the valid one implicitly or I recall from list)
    # Step 2254 listed: ID 76 | Username: 'supervisor_ccs' | Full Name: 'Ryuken  Ishida'
    # Note double space. I might fix it to single space.
    
    current_name = sup.get_full_name()
    if "Ryuken" not in current_name: 
        # Just in case
        pass
    
    # Fix double space if present
    if "  " in current_name:
        sup.first_name = "Ryuken"
        sup.last_name = "Ishida"
        sup.save()
        print(f"Normalized Supervisor Name: {sup.get_full_name()}")

    # 2. Find Linked Company
    try:
        cu = CompanyUser.objects.get(user=sup)
        company = cu.company
        print(f"Linked Company: {company.name}")
        print(f"Current Contact Person: {company.contact_person}")
        print(f"Current Contact Email: {company.contact_email}")

        # 3. Update Company
        company.contact_person = sup.get_full_name()
        company.contact_email = sup.email
        company.save()
        
        print("Updated Company Contact Details.")
        print(f"New Contact: {company.contact_person}")
        print(f"New Email: {company.contact_email}")

    except CompanyUser.DoesNotExist:
        print("Error: No CompanyUser linked to this supervisor.")
        # Try to find DataCore manually and link?
        # User said "why is it john reyes". Check DataCore.
        # But if cleanup_companies worked, DataCore IS the linked one.

except Exception as e:
    print(f"An error occurred: {e}")
