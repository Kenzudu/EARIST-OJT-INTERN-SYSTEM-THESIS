import requests
import json

print("Testing Supervisor API Endpoints...")
print("=" * 60)

# First, login as supervisor
print("\n1. Logging in as supervisor1...")
login_response = requests.post(
    'http://localhost:8000/api/login/',
    json={
        'username': 'supervisor1',
        'password': 'supervisor123'
    }
)

if login_response.status_code != 200:
    print(f"✗ Login failed: {login_response.text}")
    exit(1)

login_data = login_response.json()
token = login_data['token']
print(f"✓ Login successful! Token: {token[:20]}...")

headers = {'Authorization': f'Token {token}'}

# Test supervisor dashboard
print("\n2. Testing supervisor dashboard...")
dashboard_response = requests.get(
    'http://localhost:8000/api/supervisor/dashboard/',
    headers=headers
)
print(f"Status: {dashboard_response.status_code}")
if dashboard_response.status_code == 200:
    data = dashboard_response.json()
    print(f"✓ Dashboard data:")
    print(f"  Company: {data.get('company_name')}")
    print(f"  Total Interns: {data.get('total_interns')}")
    print(f"  Pending Tasks: {data.get('pending_tasks')}")
else:
    print(f"✗ Error: {dashboard_response.text}")

# Test interns list
print("\n3. Testing interns list...")
interns_response = requests.get(
    'http://localhost:8000/api/supervisor/interns/',
    headers=headers
)
print(f"Status: {interns_response.status_code}")
if interns_response.status_code == 200:
    interns = interns_response.json()
    print(f"✓ Found {len(interns)} interns")
    for intern in interns[:3]:
        print(f"  - {intern.get('name')} ({intern.get('position')})")
else:
    print(f"✗ Error: {interns_response.text}")

# Test tasks endpoint
print("\n4. Testing tasks endpoint...")
tasks_response = requests.get(
    'http://localhost:8000/api/supervisor/tasks/',
    headers=headers
)
print(f"Status: {tasks_response.status_code}")
if tasks_response.status_code == 200:
    tasks = tasks_response.json()
    print(f"✓ Found {len(tasks)} tasks")
else:
    print(f"✗ Error: {tasks_response.text}")

# Test journals endpoint
print("\n5. Testing journals endpoint...")
journals_response = requests.get(
    'http://localhost:8000/api/supervisor/journals/',
    headers=headers
)
print(f"Status: {journals_response.status_code}")
if journals_response.status_code == 200:
    journals = journals_response.json()
    print(f"✓ Found {len(journals)} journals")
else:
    print(f"✗ Error: {journals_response.text}")

print("\n" + "=" * 60)
print("Supervisor API Test Complete!")
