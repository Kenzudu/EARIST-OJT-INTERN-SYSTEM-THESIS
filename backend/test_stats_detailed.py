import requests
import json

print("Detailed Statistics Test")
print("=" * 70)

# Login as admin
login = requests.post('http://localhost:8000/api/login/', json={
    'username': 'admin1',
    'password': 'admin1'
})

token = login.json()['token']
headers = {'Authorization': f'Token {token}'}

# Get statistics
response = requests.get('http://localhost:8000/api/statistics/', headers=headers)

print(f"Status Code: {response.status_code}")
print(f"\nFull Response:")
print(json.dumps(response.json(), indent=2))

# Also check the database directly
print("\n" + "=" * 70)
print("Direct Database Check:")
print("=" * 70)

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import UserRole, User

print(f"\nUserRole.objects.filter(role='admin').count() = {UserRole.objects.filter(role='admin').count()}")
print(f"UserRole.objects.filter(role='coordinator').count() = {UserRole.objects.filter(role='coordinator').count()}")
print(f"UserRole.objects.filter(role='supervisor').count() = {UserRole.objects.filter(role='supervisor').count()}")
print(f"UserRole.objects.filter(role='student').count() = {UserRole.objects.filter(role='student').count()}")

print("\nCoordinators in database:")
for role in UserRole.objects.filter(role='coordinator'):
    print(f"  - {role.user.username}")

print("\nSupervisors in database:")
for role in UserRole.objects.filter(role='supervisor'):
    print(f"  - {role.user.username}")
