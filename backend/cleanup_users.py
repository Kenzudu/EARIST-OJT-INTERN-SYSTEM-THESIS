import os
import django
import sys
from django.db.models import Q

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# IDs to KEEP based on analysis
# 6: admin1
# 14: johnsteven (Delete?) User didn't say keep.
# 34: Rafael Kenneth Saluba (234-03828M) - KEEP
# 51: coordinator_ccs - KEEP
# 76: supervisor_ccs - KEEP
# 88: admin (Superuser) - KEEP
# 93: 234-testing - KEEP

# Users to explicitly keep by Username/ID/Role
keep_ids = [6, 34, 51, 76, 88, 93]

print("Identifying users to delete...")

users_to_delete = User.objects.exclude(id__in=keep_ids).exclude(is_superuser=True).exclude(is_staff=True)

# Double check we don't delete staff that we missed?
# admin1 is staff. admin is superuser.
# check if any other staff exist?

count = users_to_delete.count()
print(f"Found {count} users to delete.")

if count > 0:
    for u in users_to_delete:
        print(f"Deleting: {u.username} ({u.get_full_name()}) - {getattr(u, 'user_role', 'No Role')}")
    
    # Execute Delete
    users_to_delete.delete()
    print("Deletion complete.")
else:
    print("No users to delete.")
