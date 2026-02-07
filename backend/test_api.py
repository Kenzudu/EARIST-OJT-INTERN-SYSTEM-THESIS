import requests

# Test GET request
print("Testing GET /api/internships/")
try:
    response = requests.get('http://localhost:8000/api/internships/')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "="*50 + "\n")

# Test with authentication
print("Testing GET /api/internships/ with token")
# We need a token - let's try to login first
login_response = requests.post('http://localhost:8000/api/login/', json={
    'username': 'supervisor_ccs',
    'password': 'password123'
})
print(f"Login Status: {login_response.status_code}")
if login_response.status_code == 200:
    token = login_response.json().get('token')
    print(f"Token: {token[:20]}...")
    
    # Now try with token
    headers = {'Authorization': f'Token {token}'}
    response = requests.get('http://localhost:8000/api/internships/', headers=headers)
    print(f"GET Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
else:
    print(f"Login failed: {login_response.text}")
