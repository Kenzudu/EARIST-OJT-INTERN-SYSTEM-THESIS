import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Internship, Company

print("=" * 60)
print("INTERNSHIP POSTINGS IN THE SYSTEM")
print("=" * 60)

internships = Internship.objects.all()
print(f"\nTotal Internship Postings: {internships.count()}")

if internships.exists():
    print("\nRecent Internship Postings:")
    for job in internships[:10]:
        print(f"\n  Position: {job.position}")
        print(f"  Company: {job.company.name}")
        print(f"  Slots: {job.slots}")
        print(f"  Duration: {job.duration_weeks} weeks")
        print(f"  Location: {job.work_location}")
else:
    print("\n❌ No internship postings found in the database.")
    print("\nTo create internship postings, a Supervisor needs to:")
    print("1. Login to the Supervisor Portal")
    print("2. Navigate to 'Internship Postings' or 'Post an Internship'")
    print("3. Fill out the internship posting form")
    print("4. Submit the posting")


print("\n" + "=" * 60)
print("COMPANIES IN THE SYSTEM")
print("=" * 60)

companies = Company.objects.all()
print(f"\nTotal Companies: {companies.count()}")
print("\nCompanies with Approved Status:")
for company in companies.filter(status='Approved')[:5]:
    print(f"  - {company.name} (Targets: {company.target_colleges})")
