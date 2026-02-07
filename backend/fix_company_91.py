import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Company

# Find the company created by coordinator
company = Company.objects.get(id=91)

print(f"\n{'='*60}")
print(f"BEFORE UPDATE:")
print(f"{'='*60}")
print(f"Name: {company.name}")
print(f"Target Colleges: {company.target_colleges}")

# Update to CCS (assuming it was created by CCS coordinator)
company.target_colleges = ['CCS']
company.save()

print(f"\n{'='*60}")
print(f"AFTER UPDATE:")
print(f"{'='*60}")
print(f"Name: {company.name}")
print(f"Target Colleges: {company.target_colleges}")
print(f"\n✅ Company updated successfully!")
print(f"{'='*60}\n")
