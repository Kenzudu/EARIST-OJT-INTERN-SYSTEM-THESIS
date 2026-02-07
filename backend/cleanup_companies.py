import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Company, CompanyUser

print("Identifying companies to delete...")

# Find companies with active supervisors (CompanyUser records)
active_company_map = {} # company_id -> company_name

for cu in CompanyUser.objects.all():
    active_company_map[cu.company.id] = cu.company.name
    print(f"Keeping Company: '{cu.company.name}' (Supervisor: {cu.user.username})")

active_ids = list(active_company_map.keys())

# Find companies to delete
companies_to_delete = Company.objects.exclude(id__in=active_ids)
count = companies_to_delete.count()

print(f"Found {count} companies without active supervisors.")

if count > 0:
    for c in companies_to_delete:
        print(f"Deleting Company: {c.name}")
    
    companies_to_delete.delete()
    print("Deletion complete.")
else:
    print("No companies to remove.")
