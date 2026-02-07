

# ========================================
# ADMIN API ENDPOINTS
# ========================================
# System administrators with full access

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q
from .permissions import role_required
from .models import UserRole, Company, UserActivityLog, Message
from .serializers import UserActivityLogSerializer

# Assign/Change User Role
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_assign_role(request, user_id):
    """Assign or change a user's role (Admin only)"""
    try:
        user = User.objects.get(id=user_id)
        new_role = request.data.get('role')
        
        # Validate role
        valid_roles = ['admin', 'coordinator', 'supervisor', 'student']
        if new_role not in valid_roles:
            return Response({
                'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create UserRole
        if hasattr(user, 'user_role'):
            user_role = user.user_role
            old_role = user_role.role
            user_role.role = new_role
            user_role.save()
            message = f'User role changed from {old_role} to {new_role}'
        else:
            user_role = UserRole.objects.create(
                user=user,
                role=new_role
            )
            message = f'User role set to {new_role}'
        
        # Update is_staff based on role
        if new_role in ['admin', 'coordinator']:
            user.is_staff = True
            if new_role == 'admin':
                user.is_superuser = True
        else:
            user.is_staff = False
            user.is_superuser = False
        user.save()
        
        return Response({
            'message': message,
            'user_id': user.id,
            'username': user.username,
            'role': new_role,
            'role_display': user_role.get_role_display()
        })
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Database Backup
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_backup_database(request):
    """Create a database backup (Admin only)"""
    try:
        import subprocess
        from django.conf import settings
        import os
        from datetime import datetime
        
        # Get database settings
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        
        # Create backup directory if it doesn't exist
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        # Generate backup filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'backup_{timestamp}.json')
        
        # Use Django's dumpdata command
        result = subprocess.run(
            ['python', 'manage.py', 'dumpdata', '--output', backup_file, '--indent', '2'],
            cwd=settings.BASE_DIR,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            # Get file size
            file_size = os.path.getsize(backup_file)
            file_size_mb = file_size / (1024 * 1024)
            
            # Log the backup
            UserActivityLog.objects.create(
                user=request.user,
                action='database_backup',
                description=f'Database backup created: {os.path.basename(backup_file)}'
            )
            
            return Response({
                'message': 'Database backup created successfully',
                'backup_file': os.path.basename(backup_file),
                'file_size_mb': round(file_size_mb, 2),
                'timestamp': timestamp
            })
        else:
            return Response({
                'error': 'Backup failed',
                'details': result.stderr
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': f'Backup failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# List Backups
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_list_backups(request):
    """List all available database backups"""
    try:
        from django.conf import settings
        import os
        from datetime import datetime
        
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        
        if not os.path.exists(backup_dir):
            return Response({'backups': []})
        
        backups = []
        for filename in os.listdir(backup_dir):
            if filename.startswith('backup_') and filename.endswith('.json'):
                filepath = os.path.join(backup_dir, filename)
                file_size = os.path.getsize(filepath)
                file_size_mb = file_size / (1024 * 1024)
                modified_time = os.path.getmtime(filepath)
                
                backups.append({
                    'filename': filename,
                    'size_mb': round(file_size_mb, 2),
                    'created_at': datetime.fromtimestamp(modified_time).strftime('%Y-%m-%d %H:%M:%S')
                })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response({'backups': backups})
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Comprehensive Audit Logs
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_audit_logs(request):
    """Get comprehensive audit trail of all critical actions"""
    try:
        # Get query parameters
        action_type = request.GET.get('action_type', None)
        user_id = request.GET.get('user_id', None)
        start_date = request.GET.get('start_date', None)
        end_date = request.GET.get('end_date', None)
        
        # Build query
        logs = UserActivityLog.objects.all()
        
        if action_type:
            logs = logs.filter(action=action_type)
        
        if user_id:
            logs = logs.filter(user_id=user_id)
        
        if start_date:
            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d')
            logs = logs.filter(timestamp__gte=start)
        
        if end_date:
            from datetime import datetime
            end = datetime.strptime(end_date, '%Y-%m-%d')
            logs = logs.filter(timestamp__lte=end)
        
        # Order by most recent
        logs = logs.order_by('-timestamp')[:100]  # Limit to 100 most recent
        
        # Serialize
        serializer = UserActivityLogSerializer(logs, many=True)
        
        # Get statistics
        total_logs = UserActivityLog.objects.count()
        critical_actions = UserActivityLog.objects.filter(
            action__in=['role_change', 'user_delete', 'database_backup', 'system_config_change']
        ).count()
        
        return Response({
            'logs': serializer.data,
            'total_logs': total_logs,
            'critical_actions': critical_actions,
            'filtered_count': logs.count()
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# System Configuration
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_system_config(request):
    """Get or update system-wide configuration (Admin only)"""
    if request.method == 'GET':
        try:
            # Return current system configuration
            config = {
                'system_name': 'EARIST Internship Management System',
                'email_notifications_enabled': True,
                'auto_approve_companies': False,
                'max_applications_per_student': 5,
                'required_internship_hours': 486,
                'allow_student_registration': True,
                'maintenance_mode': False
            }
            
            return Response(config)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PUT':
        try:
            # Update system configuration
            updated_fields = []
            
            # Log the configuration change
            UserActivityLog.objects.create(
                user=request.user,
                action='system_config_change',
                description=f'System configuration updated: {", ".join(updated_fields)}'
            )
            
            return Response({
                'message': 'System configuration updated successfully',
                'updated_fields': updated_fields
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Admin Dashboard Statistics
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_dashboard_stats(request):
    """Get statistics for admin dashboard"""
    try:
        total_users = User.objects.count()
        
        # Count by role
        total_students = 0
        total_coordinators = 0
        total_admins = 0
        
        for user in User.objects.all():
            if hasattr(user, 'user_role'):
                role = user.user_role.role
                if role == 'student':
                    total_students += 1
                elif role == 'coordinator':
                    total_coordinators += 1
                elif role == 'admin':
                    total_admins += 1
            elif user.is_staff:
                total_admins += 1
            else:
                total_students += 1
                
        total_companies = Company.objects.count()
        
        return Response({
            'total_users': total_users,
            'total_students': total_students,
            'total_coordinators': total_coordinators,
            'total_companies': total_companies
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========================================
# MESSAGING
# ========================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_messages(request):
    """View and send messages for admin"""
    if request.method == 'GET':
        try:
            # Get all messages where user is sender or recipient (excluding soft-deleted)
            sent_messages = Message.objects.filter(sender=request.user, deleted_by_sender=False)
            received_messages = Message.objects.filter(recipient=request.user, deleted_by_recipient=False)
            
            messages_data = []
            
            # Format sent messages
            for msg in sent_messages:
                messages_data.append({
                    'id': msg.id,
                    'type': 'sent',
                    'sender': msg.sender.username,
                    'sender_name': f"{msg.sender.first_name} {msg.sender.last_name}" if msg.sender.first_name else msg.sender.username,
                    'recipient': msg.recipient.username,
                    'recipient_name': f"{msg.recipient.first_name} {msg.recipient.last_name}" if msg.recipient.first_name else msg.recipient.username,
                    'subject': msg.subject,
                    'message': msg.message,
                    'attachment': request.build_absolute_uri(msg.attachment.url) if msg.attachment else None,
                    'created_at': msg.created_at,
                    'is_read': msg.is_read,
                    'delivered_at': msg.delivered_at,
                    'read_at': msg.read_at,
                    'reply_to': msg.reply_to.id if msg.reply_to else None
                })
            
            # Format received messages and auto-mark as delivered
            for msg in received_messages:
                # Auto-mark as delivered when fetched
                if not msg.delivered_at:
                    msg.delivered_at = timezone.now()
                    msg.save(update_fields=['delivered_at'])
                
                messages_data.append({
                    'id': msg.id,
                    'type': 'received',
                    'sender': msg.sender.username,
                    'sender_name': f"{msg.sender.first_name} {msg.sender.last_name}" if msg.sender.first_name else msg.sender.username,
                    'recipient': msg.recipient.username,
                    'recipient_name': f"{msg.recipient.first_name} {msg.recipient.last_name}" if msg.recipient.first_name else msg.recipient.username,
                    'subject': msg.subject,
                    'message': msg.message,
                    'attachment': request.build_absolute_uri(msg.attachment.url) if msg.attachment else None,
                    'created_at': msg.created_at,
                    'is_read': msg.is_read,
                    'delivered_at': msg.delivered_at,
                    'read_at': msg.read_at,
                    'reply_to': msg.reply_to.id if msg.reply_to else None
                })
            
            # Sort by created_at
            messages_data.sort(key=lambda x: x['created_at'], reverse=True)
            
            return Response(messages_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            recipient_id = request.data.get('recipient_id')
            subject = request.data.get('subject')
            message_text = request.data.get('message')
            attachment = request.FILES.get('attachment')
            
            if not all([recipient_id, subject, message_text]):
                return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
            
            recipient = User.objects.get(id=recipient_id)
            
            reply_to_id = request.data.get('reply_to_id')
            reply_to = None
            if reply_to_id:
                try:
                    reply_to = Message.objects.get(id=reply_to_id)
                except Message.DoesNotExist:
                    pass

            message = Message.objects.create(
                sender=request.user,
                recipient=recipient,
                subject=subject,
                message=message_text,
                attachment=attachment,
                reply_to=reply_to
            )
            
            return Response({
                'id': message.id,
                'created_at': message.created_at,
                'type': 'sent',
                'sender': request.user.username,
                'sender_name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                'recipient': recipient.username,
                'subject': message.subject,
                'message': message.message,
                'attachment': request.build_absolute_uri(message.attachment.url) if message.attachment else None,
                'is_read': False,
                'reply_to': message.reply_to.id if message.reply_to else None
            }, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({'error': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_mark_message_read(request, message_id):
    """Mark a message as read or delete it for admin"""
    try:
        if request.method == 'PUT':
            message = Message.objects.get(id=message_id, recipient=request.user)
            message.is_read = True
            message.read_at = timezone.now()
            message.save()
            
            return Response({'message': 'Message marked as read'})
        
        elif request.method == 'DELETE':
            # Allow soft deletion if user is sender or recipient
            message = Message.objects.filter(id=message_id).filter(
                Q(sender=request.user) | Q(recipient=request.user)
            ).first()
            
            if not message:
                return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Soft delete
            if message.sender == request.user:
                message.deleted_by_sender = True
            if message.recipient == request.user:
                message.deleted_by_recipient = True
            message.save()
            
            # If both deleted, remove from DB
            if message.deleted_by_sender and message.deleted_by_recipient:
                message.delete()
                
            return Response({'message': 'Message deleted successfully'})
            
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def admin_delete_all_messages(request):
    """Delete all messages for the current admin"""
    try:
        # Soft delete sent messages
        Message.objects.filter(sender=request.user).update(deleted_by_sender=True)
        # Soft delete received messages
        Message.objects.filter(recipient=request.user).update(deleted_by_recipient=True)
        
        # Determine count (approximate)
        deleted_count = Message.objects.filter(
            Q(sender=request.user, deleted_by_sender=True) | 
            Q(recipient=request.user, deleted_by_recipient=True)
        ).count()
        
        # Cleanup
        Message.objects.filter(deleted_by_sender=True, deleted_by_recipient=True).delete()
        
        return Response({
            'message': f'Successfully deleted {deleted_count} messages',
            'count': deleted_count
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

