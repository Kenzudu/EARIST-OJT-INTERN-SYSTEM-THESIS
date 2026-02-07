
import json
import shutil
import os
import sys
from io import StringIO
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.core.management import call_command
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from django.db import connection
from .models import UserActivityLog, User, Application, Internship, StudentProfile, DocumentTemplate, PreTrainingRequirement

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def database_stats(request):
    """Get system stats for the dashboard"""
    # Database size estimate (Postgres/SQLite specific, assuming SQLite for local file)
    db_size = "Unknown"
    db_path = connection.settings_dict['NAME']
    if os.path.isfile(db_path):
        size_bytes = os.path.getsize(db_path)
        db_size = f"{size_bytes / (1024 * 1024):.2f} MB"

    stats = {
        'users_count': User.objects.count(),
        'applications_count': Application.objects.count(),
        'activity_logs_count': UserActivityLog.objects.count(),
        'db_size': db_size,
        'system_status': 'Healthy',
    }
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_activity_logs(request):
    """Fetch paginated activity logs"""
    logs = UserActivityLog.objects.select_related('user').order_by('-timestamp')[:100] # Limit to last 100 for performance
    data = [{
        'id': log.id,
        'user': log.user.username,
        'role': 'Admin' if log.user.is_staff else 'User', # Simplified role check
        'action': log.action,
        'description': log.description,
        'timestamp': log.timestamp,
    } for log in logs]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_database(request):
    """Download system backup as JSON"""
    try:
        # Capture stdout
        out = StringIO()
        # Dump only the 'core' app data to avoid auth permissions clutter or huge content
        call_command('dumpdata', 'core', indent=2, stdout=out)
        
        response = HttpResponse(out.getvalue(), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="earist_ojt_backup_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json"'
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def perform_maintenance(request):
    """Perform system maintenance tasks (Preview or Execute)"""
    action = request.data.get('action')
    mode = request.data.get('mode', 'execute') # 'preview' or 'execute'
    
    try:
        report = []
        
        if action == 'clear_logs':
            thirty_days_ago = timezone.now() - timedelta(days=30)
            qs = UserActivityLog.objects.filter(timestamp__lt=thirty_days_ago)
            count = qs.count()
            
            if mode == 'preview':
                details = f"Found {count} logs older than 30 days pending removal."
                status_label = 'Pending'
            else:
                deleted_count, _ = qs.delete()
                details = f"Maintenance complete. Removed {deleted_count} old log entries."
                status_label = 'Pass'
                
            report.append({
                'check': 'Activity Logs Cleanup',
                'status': status_label,
                'details': details
            })
        
        elif action == 'cleanup_files':
            media_root = settings.MEDIA_ROOT
            orphaned_files = []
            
            # 1. Collect referenced files
            referenced_files = set()
            from .models import StudentProfile, DocumentTemplate
            for profile in StudentProfile.objects.all():
                if profile.resume: referenced_files.add(os.path.basename(profile.resume.name))
                if profile.profile_picture: referenced_files.add(os.path.basename(profile.profile_picture.name))
            for doc in DocumentTemplate.objects.all():
                if doc.file: referenced_files.add(os.path.basename(doc.file.name))
            
            # 2. Scan folders
            target_folders = ['resumes', 'profile_pictures', 'document_templates']
            for folder in target_folders:
                folder_path = os.path.join(media_root, folder)
                if os.path.exists(folder_path):
                    for filename in os.listdir(folder_path):
                        if filename not in referenced_files:
                            file_path = os.path.join(folder_path, filename)
                            if os.path.isfile(file_path):
                                orphaned_files.append((filename, file_path))
            
            count = len(orphaned_files)
            
            if mode == 'preview':
                if count > 0:
                    names = ", ".join([f[0] for f in orphaned_files[:5]])
                    if count > 5: names += f", +{count-5} more"
                    details = f"Found {count} orphaned files to delete: {names}"
                else:
                    details = "No orphaned files found."
                status_label = 'Pending' if count > 0 else 'Pass'
                
            else:
                deleted_count = 0
                deleted_names = []
                for fname, fpath in orphaned_files:
                    try:
                        os.remove(fpath)
                        deleted_count += 1
                        deleted_names.append(fname)
                    except: pass
                
                if deleted_count > 0:
                    names = ", ".join(deleted_names[:5])
                    if deleted_count > 5: names += f", +{deleted_count-5} more"
                    details = f"Removed {deleted_count} orphaned files: {names}"
                else:
                    details = "No orphaned files found."
                status_label = 'Pass'

            report.append({
                'check': 'Storage Cleanup',
                'status': status_label,
                'details': details
            })
            
        elif action == 'archive_students':
            candidates = User.objects.filter(
                user_role__role='student',
                core_applications__status='Completed',
                is_active=True
            )
            count = candidates.count()
            
            if mode == 'preview':
                if count > 0:
                    names = ", ".join([u.username for u in candidates[:5]])
                    if count > 5: names += f", +{count-5} more"
                    details = f"Found {count} students eligible for archiving: {names}"
                else:
                    details = "No students pending archive."
                status_label = 'Pending' if count > 0 else 'Pass'
                
            else:
                archived_names = [u.username for u in candidates[:5]]
                candidates.update(is_active=False)
                
                if count > 0:
                    names = ", ".join(archived_names)
                    if count > 5: names += f", +{count-5} more"
                    details = f"Archived {count} students: {names}"
                else:
                    details = "No students pending archive."
                status_label = 'Pass'

            report.append({
                'check': 'Student Archiving',
                'status': status_label,
                'details': details
            })
            
        elif action == 'prune_unverified':
            cutoff = timezone.now() - timedelta(days=30)
            candidates = User.objects.filter(
                date_joined__lt=cutoff,
                last_login__isnull=True,
                is_active=False
            )
            count = candidates.count()
            
            if mode == 'preview':
                if count > 0:
                    names = ", ".join([u.username for u in candidates[:5]])
                    if count > 5: names += f", +{count-5} more"
                    details = f"Found {count} unverified accounts to prune: {names}"
                else:
                    details = "No unverified accounts found."
                status_label = 'Pending' if count > 0 else 'Pass'
                
            else:
                pruned_names = [u.username for u in candidates[:5]]
                candidates.delete()
                
                if count > 0:
                    names = ", ".join(pruned_names)
                    if count > 5: names += f", +{count-5} more"
                    details = f"Pruned {count} accounts: {names}"
                else:
                    details = "No unverified accounts found."
                status_label = 'Pass'

            report.append({
                'check': 'Account Pruning',
                'status': status_label,
                'details': details
            })
            
        elif action == 'integrity_check':
            # Comprehensive System Health Check
            
            if mode == 'preview':
                report = [{
                    'check': 'System Health Scan',
                    'status': 'Pending',
                    'details': 'Ready to perform comprehensive system integrity diagnosis. This process is read-only.'
                }]
                return Response({'report': report})
            
            report = []
            
            # 1. User Consistency
            total_users = User.objects.count()
            users_no_role_qs = User.objects.filter(user_role__isnull=True)
            users_no_role = users_no_role_qs.count()
            
            if users_no_role > 0:
                names = ", ".join([u.username for u in users_no_role_qs[:5]])
                if users_no_role > 5: names += f", +{users_no_role - 5} more"
                role_details = f"{users_no_role} users missing roles: {names}"
            else:
                role_details = f"All {total_users} users have Valid Roles."

            report.append({
                'check': 'User Role Association',
                'status': 'Fail' if users_no_role > 0 else 'Pass',
                'details': role_details
            })

            # 2. Students Profile
            students_qs = User.objects.filter(user_role__role='student')
            students_no_profile_qs = students_qs.filter(student_profile__isnull=True)
            students_no_profile = students_no_profile_qs.count()
            if students_no_profile > 0:
                names = ", ".join([u.username for u in students_no_profile_qs[:5]])
                if students_no_profile > 5: names += f", +{students_no_profile - 5} more"
                profile_details = f"{students_no_profile} students missing profile: {names}"
            else:
                profile_details = f"All {students_qs.count()} active students have profile records."

            report.append({
                'check': 'Student Profile Data',
                'status': 'Fail' if students_no_profile > 0 else 'Pass',
                'details': profile_details
            })
            
            # 3. Application Integrity
            orphaned_apps = Application.objects.filter(student__isnull=True).count()
            report.append({
                'check': 'Application Linking',
                'status': 'Fail' if orphaned_apps > 0 else 'Pass',
                'details': f'{orphaned_apps} applications are detached from students.' if orphaned_apps > 0 else 'All applications are correctly linked to students.'
            })

            # 4. Storage Health
            media_ok = os.path.exists(settings.MEDIA_ROOT)
            report.append({
                'check': 'Storage System',
                'status': 'Pass' if media_ok else 'Fail',
                'details': 'Media directory accessible.' if media_ok else 'Media Root directory missing.'
            })
            
            # 5. Database Bloat
            log_count = UserActivityLog.objects.count()
            report.append({
                'check': 'Database Bloat',
                'status': 'Warning' if log_count > 10000 else 'Pass',
                'details': f'{log_count} activity logs found. Recommendation: Clear logs.' if log_count > 10000 else 'Activity log size is within optimal limits.'
            })

        else:
            return Response({'error': 'Invalid maintenance action'}, status=400)
            
        return Response({'report': report})
            
    except Exception as e:
        return Response({'error': str(e)}, status=500)
