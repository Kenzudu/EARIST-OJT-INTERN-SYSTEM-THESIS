import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User

def test_coordinator_dashboards():
    """Test that each coordinator sees only their college's data"""
    
    coordinators = [
        ('coordinator_ced', 'CED'),
        ('coordinator_ccs', 'CCS'),
        ('coordinator_cba', 'CBA'),
        ('coordinator_cas', 'CAS'),
        ('coordinator_cen', 'CEN'),
        ('coordinator_cit', 'CIT'),
        ('coordinator_chm', 'CHM'),
        ('coordinator_cpac', 'CPAC'),
        ('coordinator_cafa', 'CAFA'),
    ]
    
    print("--- Testing Coordinator Dashboards ---\n")
    
    for username, college in coordinators:
        try:
            # Reset password
            user = User.objects.get(username=username)
            user.set_password('password123')
            user.save()
            
            # Login
            client = APIClient()
            response = client.post('/api/login/', {
                'username': username,
                'password': 'password123'
            }, format='json')
            
            if response.status_code != 200:
                print(f"✗ {username}: Login failed")
                continue
            
            token = response.data['token']
            
            # Get dashboard stats
            client.credentials(HTTP_AUTHORIZATION='Token ' + token)
            response = client.get('/api/coordinator/dashboard/')
            
            if response.status_code == 200:
                data = response.data
                print(f"✓ {username} ({college}):")
                print(f"  Students: {data.get('total_students', 0)}")
                print(f"  Companies: {data.get('total_companies', 0)}")
                print(f"  Pending Apps: {data.get('pending_applications', 0)}")
                print(f"  Active Internships: {data.get('active_internships', 0)}")
                print()
            else:
                print(f"✗ {username}: Dashboard fetch failed - {response.status_code}")
                print()
                
        except User.DoesNotExist:
            print(f"✗ {username}: User not found\n")
        except Exception as e:
            print(f"✗ {username}: Error - {str(e)}\n")

if __name__ == '__main__':
    test_coordinator_dashboards()
