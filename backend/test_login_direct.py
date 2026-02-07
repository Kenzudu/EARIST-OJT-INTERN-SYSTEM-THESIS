import requests
import json

# Test admin login
print("Testing Admin Login (admin1)...")
response = requests.post(
    'http://localhost:8000/api/login/',
    json={
        'username': 'admin1',
        'password': 'admin1'
    }
)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print()

# Test coordinator login
print("Testing Coordinator Login (testadmin)...")
response = requests.post(
    'http://localhost:8000/api/login/',
    json={
        'username': 'testadmin',
        'password': 'admin123'
    }
)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
