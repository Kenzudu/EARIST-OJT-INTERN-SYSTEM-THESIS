import os
import django
from datetime import date, timedelta
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Company

def update_companies():
    companies = Company.objects.all()
    print(f"Found {companies.count()} companies to update...")

    dummy_moa_path = 'moa_documents/dummy_moa.txt'

    for company in companies:
        # Set start date to sometime in the last 6 months
        days_ago = random.randint(1, 180)
        start_date = date.today() - timedelta(days=days_ago)
        
        # Set expiration to 1 year after start date
        expiration_date = start_date + timedelta(days=365)
        
        company.moa_start_date = start_date
        company.moa_expiration_date = expiration_date
        company.moa_file = dummy_moa_path
        
        # Randomly approve some, leave others pending
        if random.choice([True, True, False]): # 66% chance of being approved
            company.status = 'Approved'
        else:
            company.status = 'Pending'
            
        company.save()
        print(f"Updated {company.name}: {start_date} to {expiration_date} [{company.status}]")

if __name__ == '__main__':
    update_companies()
