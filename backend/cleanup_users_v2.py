import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# IDs to KEEP
# 6: admin1 (Admin - Staff)
# 34: Rafael Kenneth Saluba (Student)
# 51: coordinator_ccs (Coordinator)
# 76: supervisor_ccs (Supervisor)
# 88: admin (Superuser)
# 93: 234-testing (Student)

keep_ids = [6, 34, 51, 76, 88, 93]

print("Retrying cleanup (Including Staff accounts)...")

# Delete everyone else, ONLY keeping Superusers and the specific IDs list.
# Removing the is_staff check because Coordinators were likely marked as staff.
users_to_delete = User.objects.exclude(id__in=keep_ids).exclude(is_superuser=True)

count = users_to_delete.count()
print(f"Found {count} additional users to delete.")

if count > 0:
    for u in users_to_delete:
        print(f"Deleting: {u.username} ({u.get_full_name()}) - Staff: {u.is_staff}")
    
    users_to_delete.delete()
    print("Deletion complete.")
else:
    print("No users to delete.")
