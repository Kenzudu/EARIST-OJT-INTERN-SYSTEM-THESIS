import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User

def debug_ced():
    print("--- Debugging CED Coordinator ---")
    try:
        user = User.objects.get(username='coordinator_ced')
        user.set_password('password123')
        user.save()
        print("Password reset to 'password123'")
        
        client = APIClient()
        
        # Login
        response = client.post('/api/login/', {
            'username': 'coordinator_ced',
            'password': 'password123'
        }, format='json')
        
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.data}")
            return
            
        token = response.data['token']
        print(f"Login successful. Token: {token[:10]}...")
        
        # Get Settings
        client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        response = client.get('/api/coordinator/settings/')
        print("\n--- Settings Response ---")
        print(json.dumps(response.data, indent=2))
        
        # Get Users
        response = client.get('/api/coordinator/users/')
        print("\n--- Users Response ---")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Count: {len(response.data)}")
            # print(json.dumps(response.data, indent=2)) 
        else:
            print(response.data)

    except User.DoesNotExist:
        print("User 'coordinator_ced' not found.")

if __name__ == '__main__':
    debug_ced()
