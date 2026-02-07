
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Company

# Create a company that expired yesterday
# Current Date is 2026-01-23
expired_date = date(2026, 1, 22)

c = Company.objects.create(
    name="TechFlow Solutions (Expired)",
    description="This is a dummy company to demonstrate the expired status.",
    industry="Software Development",
    contact_person="Alex Morgan",
    contact_email="alex@techflow.com",
    address="42 Silicon Valley, CA",
    phone="09171234567",
    website="https://techflow.com",
    status="Approved", # Will be auto-archived by the view
    moa_start_date=date(2025, 1, 22),
    moa_expiration_date=expired_date,
    target_colleges=["CCS", "CIT", "CEN"] # Common colleges
)

print(f"Successfully created dummy company: {c.name}")
print(f"Expiration Date: {c.moa_expiration_date}")
print(f"Initial Status: {c.status}")
print("Refresh the Companies page to see it move to 'Archived'.")
