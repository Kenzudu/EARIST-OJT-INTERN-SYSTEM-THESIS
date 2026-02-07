import requests

print("Testing /api/users/ endpoint...")
print("=" * 70)

# Login as admin
login = requests.post('http://localhost:8000/api/login/', json={
    'username': 'admin1',
    'password': 'admin1'
})

token = login.json()['token']
headers = {'Authorization': f'Token {token}'}

# Get users
response = requests.get('http://localhost:8000/api/users/', headers=headers)

if response.status_code == 200:
    users = response.json()
    
    print(f"\n✓ Found {len(users)} users\n")
    
    # Show first few users with their roles
    for user in users[:5]:
        print(f"Username: {user.get('username')}")
        print(f"  Role: {user.get('role', 'NOT FOUND')}")
        print(f"  Role Display: {user.get('role_display', 'NOT FOUND')}")
        print(f"  is_staff: {user.get('is_staff')}")
        print()
    
    # Count by role
    roles_count = {}
    for user in users:
        role = user.get('role', 'unknown')
        roles_count[role] = roles_count.get(role, 0) + 1
    
    print("=" * 70)
    print("ROLE COUNTS:")
    for role, count in roles_count.items():
        print(f"  {role}: {count}")
else:
    print(f"✗ Error: {response.status_code}")
    print(response.text)
