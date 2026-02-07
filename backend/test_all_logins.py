import requests
import json

print("=" * 70)
print("TESTING ALL LOGIN ACCOUNTS")
print("=" * 70)

accounts = [
    {'username': 'admin1', 'password': 'admin1', 'role': 'Admin'},
    {'username': 'testadmin', 'password': 'admin123', 'role': 'Coordinator'},
    {'username': 'supervisor1', 'password': 'supervisor123', 'role': 'Supervisor'},
]

for account in accounts:
    print(f"\n{account['role']} Login Test:")
    print("-" * 70)
    
    response = requests.post(
        'http://localhost:8000/api/login/',
        json={
            'username': account['username'],
            'password': account['password']
        }
    )
    
    print(f"Username: {account['username']}")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ SUCCESS")
        print(f"  Token: {data.get('token', '')[:20]}...")
        print(f"  Role: {data.get('user', {}).get('role', 'N/A')}")
        print(f"  Role Display: {data.get('user', {}).get('role_display', 'N/A')}")
    else:
        print(f"✗ FAILED")
        print(f"  Error: {response.text}")

print("\n" + "=" * 70)
print("LOGIN TEST COMPLETE")
print("=" * 70)
