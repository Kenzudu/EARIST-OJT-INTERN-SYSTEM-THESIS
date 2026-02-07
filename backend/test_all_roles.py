import requests
import json

print("=" * 70)
print("TESTING ALL ROLE API ENDPOINTS")
print("=" * 70)

# Test Admin Endpoints
print("\n🔐 ADMIN ENDPOINTS")
print("-" * 70)

# Login as admin
admin_login = requests.post('http://localhost:8000/api/login/', json={
    'username': 'admin1',
    'password': 'admin1'
})
admin_token = admin_login.json()['token']
admin_headers = {'Authorization': f'Token {admin_token}'}

# Test role assignment
print("\n1. Testing role assignment...")
role_response = requests.put(
    'http://localhost:8000/api/admin/users/1/assign-role/',
    headers=admin_headers,
    json={'role': 'student'}
)
print(f"   Status: {role_response.status_code}")
if role_response.status_code == 200:
    print(f"   ✓ {role_response.json().get('message')}")

# Test database backup
print("\n2. Testing database backup...")
backup_response = requests.post(
    'http://localhost:8000/api/admin/backup/',
    headers=admin_headers
)
print(f"   Status: {backup_response.status_code}")
if backup_response.status_code == 200:
    data = backup_response.json()
    print(f"   ✓ Backup created: {data.get('backup_file')}")
    print(f"   ✓ Size: {data.get('file_size_mb')} MB")

# Test list backups
print("\n3. Testing list backups...")
list_response = requests.get(
    'http://localhost:8000/api/admin/backups/',
    headers=admin_headers
)
print(f"   Status: {list_response.status_code}")
if list_response.status_code == 200:
    backups = list_response.json().get('backups', [])
    print(f"   ✓ Found {len(backups)} backups")

# Test audit logs
print("\n4. Testing audit logs...")
audit_response = requests.get(
    'http://localhost:8000/api/admin/audit-logs/',
    headers=admin_headers
)
print(f"   Status: {audit_response.status_code}")
if audit_response.status_code == 200:
    data = audit_response.json()
    print(f"   ✓ Total logs: {data.get('total_logs')}")
    print(f"   ✓ Critical actions: {data.get('critical_actions')}")

# Test system config
print("\n5. Testing system config...")
config_response = requests.get(
    'http://localhost:8000/api/admin/system-config/',
    headers=admin_headers
)
print(f"   Status: {config_response.status_code}")
if config_response.status_code == 200:
    config = config_response.json()
    print(f"   ✓ System: {config.get('system_name')}")

# Test Coordinator Endpoints
print("\n\n🏫 COORDINATOR ENDPOINTS")
print("-" * 70)

# Login as coordinator
coord_login = requests.post('http://localhost:8000/api/login/', json={
    'username': 'testadmin',
    'password': 'admin123'
})
coord_token = coord_login.json()['token']
coord_headers = {'Authorization': f'Token {coord_token}'}

# Test coordinator dashboard
print("\n1. Testing coordinator dashboard...")
coord_dash_response = requests.get(
    'http://localhost:8000/api/coordinator/dashboard/',
    headers=coord_headers
)
print(f"   Status: {coord_dash_response.status_code}")
if coord_dash_response.status_code == 200:
    data = coord_dash_response.json()
    print(f"   ✓ Total students: {data.get('total_students')}")
    print(f"   ✓ Total companies: {data.get('total_companies')}")
    print(f"   ✓ Pending applications: {data.get('pending_applications')}")

# Test document generation
print("\n2. Testing document generation...")
doc_response = requests.post(
    'http://localhost:8000/api/coordinator/documents/generate/',
    headers=coord_headers,
    json={
        'document_type': 'recommendation',
        'student_id': 1
    }
)
print(f"   Status: {doc_response.status_code}")
if doc_response.status_code == 201:
    data = doc_response.json()
    print(f"   ✓ {data.get('message')}")
    print(f"   ✓ Student: {data.get('student_name')}")

# Test Supervisor Endpoints
print("\n\n👔 SUPERVISOR ENDPOINTS")
print("-" * 70)

# Login as supervisor
sup_login = requests.post('http://localhost:8000/api/login/', json={
    'username': 'supervisor1',
    'password': 'supervisor123'
})
sup_token = sup_login.json()['token']
sup_headers = {'Authorization': f'Token {sup_token}'}

# Test supervisor dashboard
print("\n1. Testing supervisor dashboard...")
sup_dash_response = requests.get(
    'http://localhost:8000/api/supervisor/dashboard/',
    headers=sup_headers
)
print(f"   Status: {sup_dash_response.status_code}")
if sup_dash_response.status_code == 200:
    data = sup_dash_response.json()
    print(f"   ✓ Company: {data.get('company_name')}")
    print(f"   ✓ Total interns: {data.get('total_interns')}")

# Test interns list
print("\n2. Testing interns list...")
interns_response = requests.get(
    'http://localhost:8000/api/supervisor/interns/',
    headers=sup_headers
)
print(f"   Status: {interns_response.status_code}")
if interns_response.status_code == 200:
    interns = interns_response.json()
    print(f"   ✓ Found {len(interns)} interns")

print("\n" + "=" * 70)
print("✅ ALL ROLE ENDPOINTS TESTED!")
print("=" * 70)
