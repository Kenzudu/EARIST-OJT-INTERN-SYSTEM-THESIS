from django.contrib.auth.models import User

try:
    user = User.objects.get(username='224-09101M')
    user.set_password('12312345')
    user.save()
    print(f'✅ Password reset successfully for user: {user.username}')
    print(f'   New password: 12312345')
except User.DoesNotExist:
    print('❌ User 224-09101M not found')
except Exception as e:
    print(f'❌ Error: {str(e)}')
