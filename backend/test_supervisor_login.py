import requests
import json

print("Testing Supervisor Login...")
print("=" * 60)

response = requests.post(
    'http://localhost:8000/api/login/',
    json={
        'username': 'supervisor1',
        'password': 'supervisor123'
    }
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    data = response.json()
    print("\n✓ Login successful!")
    print(f"  Token: {data.get('token', 'N/A')[:20]}...")
    print(f"  Username: {data.get('user', {}).get('username', 'N/A')}")
    print(f"  Role: {data.get('user', {}).get('role', 'N/A')}")
    print(f"  Role Display: {data.get('user', {}).get('role_display', 'N/A')}")
else:
    print("\n✗ Login failed!")
    print(f"  Error: {response.text}")
