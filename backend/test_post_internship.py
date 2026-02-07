import requests

# Login as supervisor
print("Logging in as supervisor...")
login_response = requests.post('http://localhost:8000/api/login/', json={
    'username': 'supervisor_ccs',
    'password': 'password123'
})
print(f"Login Status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json().get('token')
    print(f"Token: {token[:20]}...")
    
    # Test POST - Create new internship
    headers = {'Authorization': f'Token {token}'}
    internship_data = {
        'position': 'API Test Internship',
        'description': 'This is a test internship created via API',
        'slots': 3,
        'required_skills': 'Python, Django, REST API',
        'work_location': 'Makati',
        'duration_hours': 400,
        'stipend': '5000',
        'position_type': 'Full-time'
    }
    
    print("\nPosting new internship...")
    response = requests.post('http://localhost:8000/api/internships/', 
                            json=internship_data, 
                            headers=headers)
    print(f"POST Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("\n✅ SUCCESS! Internship created successfully!")
    else:
        print("\n❌ FAILED to create internship")
else:
    print(f"Login failed: {login_response.text}")
