import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import CoordinatorSettings, User

try:
    coord_user = User.objects.get(username='coordinator_ccs') # Brenan
    settings, created = CoordinatorSettings.objects.get_or_create(coordinator=coord_user)
    
    # Set Required Hours for BS INFO TECH
    settings.hours_config = [
        {'program': 'BS INFO TECH', 'requiredHours': 486}
    ]
    settings.save()
    print("Updated coordinator_ccs hours to 486.")
    
except Exception as e:
    print(f"Error updating hours: {e}")
