import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Company

companies = Company.objects.all().order_by('-created_at')

print(f"\n{'='*60}")
print(f"ALL COMPANIES IN DATABASE:")
print(f"{'='*60}\n")

if companies.count() == 0:
    print("❌ NO COMPANIES FOUND")
else:
    for company in companies[:10]:  # Show last 10
        print(f"ID: {company.id}")
        print(f"Name: {company.name}")
        print(f"Status: {company.status}")
        print(f"Target Colleges: {company.target_colleges}")
        print(f"Created: {company.created_at}")
        print(f"-" * 60)

print(f"\nTotal companies: {companies.count()}")
print(f"{'='*60}\n")
