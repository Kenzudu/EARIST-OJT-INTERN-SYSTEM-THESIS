import requests

# Login
login_res = requests.post('http://localhost:8000/api/login/', json={'username': 'admin1', 'password': 'admin1'})
token = login_res.json()['token']

# Get stats
stats_res = requests.get('http://localhost:8000/api/statistics/', headers={'Authorization': f'Token {token}'})

print("Statistics API Response:")
print(f"Status: {stats_res.status_code}")
print(f"Response: {stats_res.json()}")

expected = {
    'total_users': 13,
    'total_admins': 1,
    'total_coordinators': 1,
    'total_supervisors': 1,
    'total_students': 10
}

actual = stats_res.json()

print("\nComparison:")
for key, expected_val in expected.items():
    actual_val = actual.get(key)
    match = "✓" if actual_val == expected_val else "✗"
    print(f"{match} {key}: expected={expected_val}, actual={actual_val}")
