import requests

print("Testing /api/statistics/ endpoint...")
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

print(f"Status Code: {response.status_code}\n")

if response.status_code == 200:
    stats = response.json()
    
    print("✓ Statistics Response:")
    print(f"  Total Users: {stats.get('total_users')}")
    print(f"  Total Admins: {stats.get('total_admins')}")
    print(f"  Total Coordinators: {stats.get('total_coordinators')}")
    print(f"  Total Supervisors: {stats.get('total_supervisors')}")
    print(f"  Total Students: {stats.get('total_students')}")
    print(f"  Users without role: {stats.get('users_without_role')}")
else:
    print(f"✗ Error: {response.status_code}")
    print(response.text)

print("\n" + "=" * 70)
