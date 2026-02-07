import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.apps import apps

username = '224-09101M'

try:
    user = User.objects.get(username=username)
    
    print(f"\n{'='*60}")
    print(f"Searching for birthday field...")
    print(f"{'='*60}\n")
    
    # Check all related objects
    for related_object in user._meta.related_objects:
        print(f"Related model: {related_object.related_model.__name__}")
        accessor_name = related_object.get_accessor_name()
        print(f"Accessor: {accessor_name}")
        
        try:
            related_instance = getattr(user, accessor_name)
            if hasattr(related_instance, 'birthday'):
                print(f"✅ Found birthday field in {related_object.related_model.__name__}!")
                print(f"Current value: {related_instance.birthday}")
                
                # Set birthday
                related_instance.birthday = date(2004, 9, 3)
                related_instance.save()
                
                print(f"✅ Birthday updated to: September 3, 2004")
                print(f"{'='*60}\n")
                break
        except Exception as e:
            print(f"Error accessing {accessor_name}: {e}\n")
    
    # Also check if User model itself has birthday
    if hasattr(user, 'birthday'):
        print(f"✅ Found birthday field in User model!")
        user.birthday = date(2004, 9, 3)
        user.save()
        print(f"✅ Birthday updated to: September 3, 2004")
    
except User.DoesNotExist:
    print(f"\n❌ User not found\n")
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
    import traceback
    traceback.print_exc()
