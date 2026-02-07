

# ========================================
# SUPERVISOR API ENDPOINTS
# ========================================
# Company supervisors managing their assigned interns

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from .models import (
    UserRole, Company, CompanyUser, Internship, Application,
    Task, Attendance, DailyJournal, PerformanceEvaluation, Message, SupervisorDocument
)
from .serializers import (
    TaskSerializer, AttendanceSerializer, DailyJournalSerializer,
    PerformanceEvaluationSerializer, SupervisorDocumentSerializer
)
from .permissions import role_required

# Supervisor Dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_dashboard(request):
    """Get supervisor dashboard data - assigned interns, pending tasks, etc."""
    try:
        # Get supervisor's company
        if not hasattr(request.user, 'company_user_profile'):
            return Response({
                'error': 'No company profile found for this supervisor'
            }, status=status.HTTP_404_NOT_FOUND)
        
        company_user = request.user.company_user_profile
        company = company_user.company
        
        # Get all approved applications for this company's internships
        company_internships = Internship.objects.filter(company=company)
        assigned_interns = Application.objects.filter(
            internship__in=company_internships,
            status='Approved'
        ).select_related('student', 'internship')
        
        # Get statistics
        total_interns = assigned_interns.count()
        
        # Get pending tasks
        intern_users = [app.student for app in assigned_interns]
        pending_tasks = Task.objects.filter(
            student__in=intern_users,
            status__in=['Pending', 'In Progress']
        ).count()
        
        # Get pending attendance verifications (today's attendance)
        from django.utils import timezone
        today = timezone.now().date()
        pending_attendance = Attendance.objects.filter(
            student__in=intern_users,
            date=today
        ).count()
        
        # Get pending evaluations (interns without recent evaluation)
        from datetime import timedelta
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        evaluated_students = PerformanceEvaluation.objects.filter(
            evaluated_by=request.user,
            submitted_at__gte=thirty_days_ago
        ).values_list('student_id', flat=True)
        
        pending_evaluations = total_interns - len(set(evaluated_students))
        
        return Response({
            'company_name': company.name,
            'position': company_user.position,
            'phone': company_user.phone,
            'target_colleges': company_user.target_colleges,
            'total_interns': total_interns,
            'pending_tasks': pending_tasks,
            'pending_attendance': pending_attendance,
            'pending_evaluations': max(0, pending_evaluations),
            'interns': [{
                'id': app.student.id,
                'name': f"{app.student.first_name} {app.student.last_name}",
                'position': app.internship.position,
                'applied_at': app.applied_at
            } for app in assigned_interns[:5]]  # Show first 5
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Supervisor Profile
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_profile(request):
    """Get or update supervisor profile"""
    try:
        if not hasattr(request.user, 'company_user_profile'):
            return Response({
                'error': 'No company profile found for this supervisor'
            }, status=status.HTTP_404_NOT_FOUND)
        
        company_user = request.user.company_user_profile
        
        if request.method == 'GET':
            return Response({
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email,
                'company_name': company_user.company.name,
                'position': company_user.position,
                'phone': company_user.phone,
                'target_colleges': company_user.target_colleges
            })
        
        elif request.method == 'PUT':
            # Update user details
            user = request.user
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            user.save()

            # Update phone and target_colleges
            if 'phone' in request.data:
                company_user.phone = request.data['phone']
            if 'target_colleges' in request.data:
                company_user.target_colleges = request.data['target_colleges']
            
            company_user.save()
            
            # Also update the company's target_colleges to match
            company_user.company.target_colleges = company_user.target_colleges
            company_user.company.save()
            
            return Response({
                'message': 'Profile updated successfully',
                'first_name': user.first_name,
                'last_name': user.last_name,
                'company_name': company_user.company.name,
                'position': company_user.position,
                'phone': company_user.phone,
                'target_colleges': company_user.target_colleges
            })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View Assigned Interns
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_interns_list(request):
    """Get list of interns/applicants for this supervisor's company internships"""
    try:
        if not hasattr(request.user, 'company_user_profile'):
            return Response({
                'error': 'No company profile found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        company = request.user.company_user_profile.company
        company_internships = Internship.objects.filter(company=company)
        
        # Get ALL applications (pending, approved, rejected) so supervisor can manage them
        applications = Application.objects.filter(
            internship__in=company_internships
        ).select_related('student', 'student__student_profile', 'internship').order_by('-applied_at')
        
        interns_data = []
        for app in applications:
            student = app.student
            profile = getattr(student, 'student_profile', None)
            
            # Get profile image URL
            profile_image_url = None
            if profile and profile.profile_picture:
                try:
                    profile_image_url = request.build_absolute_uri(profile.profile_picture.url)
                except (ValueError, AttributeError):
                    profile_image_url = None
            
            interns_data.append({
                'id': student.id,
                'username': student.username,
                'name': f"{student.first_name} {student.last_name}",
                'email': student.email,
                'position': app.internship.position,
                'student_id': profile.student_id if profile else '',
                'course': profile.course if profile else '',
                'phone': profile.phone if profile else '',
                'profile_image': profile_image_url,
                'applied_at': app.applied_at,
                'application_id': app.id,
                'status': app.status,  # Show application status (Pending, Approved, Rejected)
                'internship_id': app.internship.id
            })
        
        return Response(interns_data)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Approve/Reject Application
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_update_application_status(request, application_id):
    """Approve or reject an application"""
    try:
        # Get the application
        application = Application.objects.get(id=application_id)
        
        # Verify this application is for supervisor's company
        if not hasattr(request.user, 'company_user_profile'):
            return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
        
        company = request.user.company_user_profile.company
        
        if application.internship.company != company:
            return Response({
                'error': 'This application is not for your company'
            }, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # If approving, check if student already has an approved application
        if new_status == 'Approved' and application.status != 'Approved':
            # Check if student already has an approved application
            existing_approved = Application.objects.filter(
                student=application.student,
                status='Approved'
            ).exclude(id=application_id).first()
            
            if existing_approved:
                return Response({
                    'error': f'Student is already approved for {existing_approved.internship.position} at {existing_approved.internship.company.name}. A student can only have one active internship at a time.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if slots are available and decrement
            internship = application.internship
            if internship.slots > 0:
                internship.slots -= 1
                internship.save()
                
                application.status = 'Approved'
                application.save()
                
                # Auto-reject all other pending applications for this student
                Application.objects.filter(
                    student=application.student,
                    status='Pending'
                ).exclude(id=application_id).update(status='Rejected')
                
                return Response({
                    'message': 'Application approved successfully. All other pending applications have been automatically rejected.'
                })
            else:
                return Response({'error': 'No slots available for this internship'}, status=status.HTTP_400_BAD_REQUEST)
        
        # For other status updates (Rejected, etc.)
        application.status = new_status
        application.save()
        
        return Response({'message': f'Application status updated to {new_status}'})
        
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# View Intern Details
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_intern_detail(request, intern_id):
    """Get detailed information about a specific intern"""
    try:
        # Verify this intern is assigned to supervisor's company
        if not hasattr(request.user, 'company_user_profile'):
            return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
        
        company = request.user.company_user_profile.company
        intern = User.objects.get(id=intern_id)
        
        # Check if intern is assigned to this company
        application = Application.objects.filter(
            student=intern,
            internship__company=company,
            status='Approved'
        ).first()
        
        if not application:
            return Response({
                'error': 'This intern is not assigned to your company'
            }, status=status.HTTP_403_FORBIDDEN)
        
        profile = getattr(intern, 'student_profile', None)
        
        # Get intern's tasks
        tasks = Task.objects.filter(student=intern).order_by('-created_at')[:10]
        
        # Get intern's attendance
        attendance = Attendance.objects.filter(student=intern).order_by('-date')[:10]
        
        # Get intern's journals
        journals = DailyJournal.objects.filter(student=intern).order_by('-date')[:10]
        
        return Response({
            'id': intern.id,
            'name': f"{intern.first_name} {intern.last_name}",
            'email': intern.email,
            'student_id': profile.student_id if profile else '',
            'course': profile.course if profile else '',
            'phone': profile.phone if profile else '',
            'position': application.internship.position,
            'tasks': TaskSerializer(tasks, many=True).data,
            'attendance': AttendanceSerializer(attendance, many=True).data,
            'journals': DailyJournalSerializer(journals, many=True).data
        })
    except User.DoesNotExist:
        return Response({'error': 'Intern not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Task Management
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_tasks(request):
    """Manage tasks for assigned interns"""
    if request.method == 'GET':
        try:
            # Get all tasks for interns in supervisor's company
            if not hasattr(request.user, 'company_user_profile'):
                return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
            
            company = request.user.company_user_profile.company
            company_internships = Internship.objects.filter(company=company)
            applications = Application.objects.filter(
                internship__in=company_internships,
                status='Approved'
            )
            intern_users = [app.student for app in applications]
            
            tasks = Task.objects.filter(student__in=intern_users).order_by('-created_at')
            serializer = TaskSerializer(tasks, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            # Create new task for an intern
            student_id = request.data.get('student_id')
            
            # Verify student is assigned to this company
            if not hasattr(request.user, 'company_user_profile'):
                return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
            
            company = request.user.company_user_profile.company
            student = User.objects.get(id=student_id)
            
            # Check if student is assigned to this company
            application = Application.objects.filter(
                student=student,
                internship__company=company,
                status='Approved'
            ).first()
            
            if not application:
                return Response({
                    'error': 'This student is not assigned to your company'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Create task
            task = Task.objects.create(
                title=request.data.get('title'),
                description=request.data.get('description'),
                student=student,
                application=application,
                assigned_by=request.user,
                deadline=request.data.get('deadline'),
                priority=request.data.get('priority', 'Medium'),
                status='Pending'
            )
            
            serializer = TaskSerializer(task)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# View Intern Journals
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_journals(request):
    """View journals from assigned interns"""
    try:
        if not hasattr(request.user, 'company_user_profile'):
            return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
        
        company = request.user.company_user_profile.company
        company_internships = Internship.objects.filter(company=company)
        applications = Application.objects.filter(
            internship__in=company_internships,
            status='Approved'
        )
        intern_users = [app.student for app in applications]
        
        # Show Submitted, Approved, and Rejected journals (not Draft)
        journals = DailyJournal.objects.filter(
            student__in=intern_users,
            status__in=['Submitted', 'Approved', 'Rejected']
        ).select_related('student').order_by('-date')
        
        serializer = DailyJournalSerializer(journals, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Submit Performance Evaluation
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_submit_evaluation(request):
    """Submit performance evaluation for an intern"""
    try:
        student_id = request.data.get('student_id')
        
        # Verify student is assigned to this company
        if not hasattr(request.user, 'company_user_profile'):
            return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
        
        company = request.user.company_user_profile.company
        student = User.objects.get(id=student_id)
        
        application = Application.objects.filter(
            student=student,
            internship__company=company,
            status='Approved'
        ).first()
        
        if not application:
            return Response({
                'error': 'This student is not assigned to your company'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Create evaluation
        evaluation = PerformanceEvaluation.objects.create(
            student=student,
            application=application,
            evaluated_by=request.user,
            evaluation_period_start=request.data.get('period_start'),
            evaluation_period_end=request.data.get('period_end'),
            punctuality=request.data.get('punctuality', 0),
            work_quality=request.data.get('work_quality', 0),
            teamwork=request.data.get('teamwork', 0),
            communication=request.data.get('communication', 0),
            initiative=request.data.get('initiative', 0),
            problem_solving=request.data.get('problem_solving', 0),
            comments=request.data.get('comments', ''),
            strengths=request.data.get('strengths', ''),
            areas_for_improvement=request.data.get('areas_for_improvement', ''),
            grade=request.data.get('grade', '')
        )
        
        serializer = PerformanceEvaluationSerializer(evaluation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Verify Attendance
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_attendance(request):
    """View and verify intern attendance"""
    if request.method == 'GET':
        try:
            if not hasattr(request.user, 'company_user_profile'):
                return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
            
            company = request.user.company_user_profile.company
            company_internships = Internship.objects.filter(company=company)
            applications = Application.objects.filter(
                internship__in=company_internships,
                status='Approved'
            )
            intern_users = [app.student for app in applications]
            
            attendance = Attendance.objects.filter(
                student__in=intern_users
            ).select_related('student').order_by('-date')
            
            serializer = AttendanceSerializer(attendance, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PUT':
        try:
            # Verify/update attendance record
            attendance_id = request.data.get('attendance_id')
            attendance = Attendance.objects.get(id=attendance_id)
            
            # Verify this attendance belongs to an intern in supervisor's company
            if not hasattr(request.user, 'company_user_profile'):
                return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
            
            company = request.user.company_user_profile.company
            application = Application.objects.filter(
                student=attendance.student,
                internship__company=company,
                status='Approved'
            ).first()
            
            if not application:
                return Response({
                    'error': 'This attendance record is not for your company'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Update attendance
            attendance.status = request.data.get('status', attendance.status)
            attendance.notes = request.data.get('notes', attendance.notes)
            attendance.marked_by = request.user
            attendance.save()
            
            serializer = AttendanceSerializer(attendance)
            return Response(serializer.data)
        except Attendance.DoesNotExist:
            return Response({'error': 'Attendance record not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Messaging System
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR, UserRole.COORDINATOR, UserRole.ADMIN])
def supervisor_messages(request):
    """View and send messages"""
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
            attachment = request.FILES.get('attachment')  # Get uploaded file
            
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
@role_required([UserRole.SUPERVISOR, UserRole.COORDINATOR, UserRole.ADMIN])
def supervisor_mark_message_read(request, message_id):
    """Mark a message as read or delete it"""
    try:
        if request.method == 'PUT':
            from django.utils import timezone
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
@role_required([UserRole.SUPERVISOR, UserRole.COORDINATOR, UserRole.ADMIN])
def supervisor_delete_all_messages(request):
    """Delete all messages for the current user"""
    try:
        from django.db.models import Q
        
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


# Get Student Attendance Records with Progress
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN, UserRole.SUPERVISOR])
def supervisor_student_attendance(request, student_id):
    """Get all attendance records and progress for a specific student"""
    try:
        student = User.objects.get(id=student_id)
        
        # Check if user is admin or supervisor
        is_admin = request.user.is_staff or (hasattr(request.user, 'user_role') and request.user.user_role.role == 'admin')
        
        # Get student's approved application (if any)
        application = Application.objects.filter(
            student=student,
            status='Approved'
        ).first()
        
        if not is_admin:
            # For supervisors, verify student is assigned to their company
            if not hasattr(request.user, 'company_user_profile'):
                return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
            
            company = request.user.company_user_profile.company
            
            # Check if student is assigned to this company
            if not application or application.internship.company != company:
                return Response({
                    'error': 'This student is not assigned to your company'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Get student profile
        profile = getattr(student, 'student_profile', None)
        
        # Get all attendance records for this student
        attendance_records = Attendance.objects.filter(
            student=student
        ).order_by('-date')
        
        # Calculate attendance statistics
        total_records = attendance_records.count()
        present_count = attendance_records.filter(status='Present').count()
        late_count = attendance_records.filter(status='Late').count()
        absent_count = attendance_records.filter(status='Absent').count()
        pending_count = attendance_records.filter(status='Pending').count()
        
        # Calculate total hours from attendance
        attendance_hours = sum([record.hours_rendered or 0 for record in attendance_records])
        
        # Get journal entries for additional hours
        journals = DailyJournal.objects.filter(student=student).order_by('-date')
        journal_hours = sum([j.hours_rendered or 0 for j in journals])
        
        # Calculate total hours and progress
        total_hours = attendance_hours
        from core.coordinator_views import get_required_hours_for_student
        required_hours = get_required_hours_for_student(student)
        progress_percentage = min(100, (total_hours / required_hours * 100) if required_hours > 0 else 0)
        
        # Get tasks
        tasks = Task.objects.filter(student=student).order_by('-created_at')
        completed_tasks = tasks.filter(status='Completed').count()
        total_tasks = tasks.count()
        
        # Get evaluations
        evaluations = PerformanceEvaluation.objects.filter(student=student).order_by('-submitted_at')
        
        # Serialize data
        attendance_serializer = AttendanceSerializer(attendance_records, many=True)
        journal_serializer = DailyJournalSerializer(journals[:10], many=True)  # Last 10 journals
        task_serializer = TaskSerializer(tasks[:10], many=True)  # Last 10 tasks
        
        return Response({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}",
            'student_email': student.email,
            'student_id_number': profile.student_id if profile else '',
            'course': profile.course if profile else '',
            'position': application.internship.position if application else 'No Active Internship',
            'company_name': application.internship.company.name if application else 'N/A',
            
            # Attendance Statistics
            'total_records': total_records,
            'present_count': present_count,
            'late_count': late_count,
            'absent_count': absent_count,
            'pending_count': pending_count,
            
            # Progress Information
            'total_hours': round(total_hours, 2),
            'attendance_hours': round(attendance_hours, 2),
            'journal_hours': round(journal_hours, 2),
            'required_hours': required_hours,
            'progress_percentage': round(progress_percentage, 2),
            
            # Tasks
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': total_tasks - completed_tasks,
            
            # Counts
            'journal_count': journals.count(),
            'evaluation_count': evaluations.count(),
            
            # Detailed Records
            'attendance_records': attendance_serializer.data,
            'recent_journals': journal_serializer.data,
            'recent_tasks': task_serializer.data,
        })
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# Student Progress Tracking
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.COORDINATOR])
def supervisor_student_progress(request, student_id):
    """Get detailed progress for a specific student including hours, journals, attendance, and evaluations"""
    try:
        student = User.objects.get(id=student_id)
        
        # Get all journal entries
        journals = DailyJournal.objects.filter(student=student).order_by('-date')
        
        # Calculate total hours from journals
        journal_hours = sum([j.hours_rendered or 0 for j in journals])
        
        # Get attendance records
        attendance_records = Attendance.objects.filter(student=student).order_by('-date')
        attendance_hours = sum([a.hours_rendered or 0 for a in attendance_records])
        
        # Get application to find required hours
        from core.coordinator_views import get_required_hours_for_student
        required_hours = get_required_hours_for_student(student)
        
        # Use attendance hours as the primary source (most accurate)
        total_hours = attendance_hours
        progress_percentage = min(100, (total_hours / required_hours * 100) if required_hours > 0 else 0)
        
        # Get evaluations
        evaluations = PerformanceEvaluation.objects.filter(student=student).order_by('-submitted_at')
        evaluation_data = [{
            'id': e.id,
            'evaluator_name': e.evaluated_by.get_full_name() if e.evaluated_by else 'N/A',
            'total_score': e.total_score,
            'grade': e.grade,
            'feedback': e.comments,
            'period_start': e.evaluation_period_start,
            'period_end': e.evaluation_period_end,
            'created_at': e.submitted_at
        } for e in evaluations]
        
        # Serialize journals with more details
        journal_data = [{
            'id': j.id,
            'date': j.date,
            'activities': j.activities,
            'learning_outcomes': j.learning_outcomes,
            'hours_rendered': j.hours_rendered,
            'status': j.status,
            'supervisor_feedback': j.supervisor_feedback if hasattr(j, 'supervisor_feedback') else None,
            'created_at': j.created_at
        } for j in journals]
        
        # Serialize attendance records
        attendance_data = [{
            'id': a.id,
            'date': a.date,
            'time_in': a.time_in.strftime('%H:%M:%S') if a.time_in else None,
            'time_out': a.time_out.strftime('%H:%M:%S') if a.time_out else None,
            'hours_rendered': a.hours_rendered,
            'status': a.status,
            'remarks': a.remarks if hasattr(a, 'remarks') else None
        } for a in attendance_records]

        # Calculate Attendance Stats for Dashboard Cards
        present_count = attendance_records.filter(status='Present').count()
        late_count = attendance_records.filter(status='Late').count()
        absent_count = attendance_records.filter(status='Absent').count()
        
        # Calculate Late Hours (sum of hours for Late records)
        late_hours = sum([a.hours_rendered or 0 for a in attendance_records if a.status == 'Late'])

        # Get Tasks Stats
        tasks = Task.objects.filter(
            student=student
        )
        tasks_total = tasks.count()
        tasks_completed = tasks.filter(status='Completed').count()
        
        return Response({
            'student_id': student.id,
            'student_name': student.get_full_name(),
            'student_email': student.email,
            'total_hours': round(total_hours, 2),
            'journal_hours': round(journal_hours, 2),
            'attendance_hours': round(attendance_hours, 2),
            'required_hours': required_hours,
            'progress_percentage': round(progress_percentage, 2),
            
            # Dashboard Stats
            'present_count': present_count,
            'late_count': late_count,
            'late_hours': round(late_hours, 2),
            'absent_count': absent_count,
            'tasks_total': tasks_total,
            'tasks_completed': tasks_completed,
            
            'journal_entries_count': journals.count(),
            'journals': journal_data,
            'attendance_records_count': attendance_records.count(),
            'attendance_records': attendance_data,
            'evaluations_count': evaluations.count(),
            'evaluations': evaluation_data
        })
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# Document Upload and Management
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_documents(request):
    """Upload and manage documents for interns"""
    if request.method == 'GET':
        try:
            # Get supervisor's company
            if not hasattr(request.user, 'company_user_profile'):
                return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
            
            company = request.user.company_user_profile.company
            
            # Get all documents for interns in this company
            company_internships = Internship.objects.filter(company=company)
            applications = Application.objects.filter(
                internship__in=company_internships,
                status='Approved'
            )
            student_ids = applications.values_list('student_id', flat=True)
            
            documents = SupervisorDocument.objects.filter(
                student_id__in=student_ids
            ).select_related('student', 'uploaded_by')
            
            serializer = SupervisorDocumentSerializer(documents, many=True, context={'request': request})
            data = serializer.data

            # ------------------------------------------------------------------
            # Inject Application Resumes (Virtual Documents)
            # ------------------------------------------------------------------
            for app in applications:
                # 1. Resume File
                if app.resume_file:
                    try:
                        file_url = request.build_absolute_uri(app.resume_file.url)
                        data.append({
                            'id': -app.id,  # Negative ID indicates virtual/application doc
                            'student': app.student.id,
                            'student_name': app.student.get_full_name(),
                            'uploaded_by': app.student.id,
                            'uploaded_by_name': app.student.get_full_name(),
                            'application': app.id,
                            'document_type': 'Resume',
                            'title': 'Application Resume',
                            'description': 'Submitted via Internship Application',
                            'document_file': file_url,
                            'is_official': True,
                            'uploaded_at': app.applied_at.isoformat() if app.applied_at else None
                        })
                    except Exception:
                        pass # Skip if file missing

                # 2. Resume URL (Link) - Only if file doesn't exist to avoid duplicates if both used
                elif app.resume_url:
                    data.append({
                        'id': -app.id,
                        'student': app.student.id,
                        'student_name': app.student.get_full_name(),
                        'uploaded_by': app.student.id,
                        'uploaded_by_name': app.student.get_full_name(),
                        'application': app.id,
                        'document_type': 'Resume',
                        'title': 'Online Resume',
                        'description': 'External link from Internship Application',
                        'document_file': app.resume_url,
                        'is_official': True,
                        'uploaded_at': app.applied_at.isoformat() if app.applied_at else None
                    })

            # Sort combined list by uploaded_at (newest first)
            data.sort(key=lambda x: x.get('uploaded_at') or '', reverse=True)

            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            # Validate supervisor has company profile
            if not hasattr(request.user, 'company_user_profile'):
                return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
            
            company = request.user.company_user_profile.company
            student_id = request.data.get('student_id')
            
            # Verify student is assigned to this company
            student = User.objects.get(id=student_id)
            application = Application.objects.filter(
                student=student,
                internship__company=company,
                status='Approved'
            ).first()
            
            if not application:
                return Response({
                    'error': 'This student is not assigned to your company'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Create document
            document = SupervisorDocument.objects.create(
                student=student,
                uploaded_by=request.user,
                application=application,
                document_type=request.data.get('document_type', 'Other'),
                title=request.data.get('title'),
                description=request.data.get('description', ''),
                document_file=request.FILES.get('document_file'),
                is_official=request.data.get('is_official', 'true').lower() == 'true'
            )
            
            serializer = SupervisorDocumentSerializer(document, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_document_delete(request, document_id):
    """Delete a document"""
    try:
        document = SupervisorDocument.objects.get(id=document_id, uploaded_by=request.user)
        document.delete()
        return Response({'message': 'Document deleted successfully'})
    except SupervisorDocument.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_terminate_internship(request, student_id):
    """Terminate a student's internship"""
    try:
        # Validate supervisor has company profile
        if not hasattr(request.user, 'company_user_profile'):
            return Response({'error': 'No company profile found'}, status=status.HTTP_404_NOT_FOUND)
        
        company = request.user.company_user_profile.company
        termination_reason = request.data.get('reason', '')
        
        if not termination_reason:
            return Response({'error': 'Termination reason is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the approved application for this student at this company
        application = Application.objects.filter(
            student_id=student_id,
            internship__company=company,
            status='Approved'
        ).first()
        
        if not application:
            return Response({
                'error': 'No active internship found for this student at your company'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update application status to Terminated
        from django.utils import timezone
        application.status = 'Terminated'
        application.terminated_at = timezone.now()
        application.termination_reason = termination_reason
        application.save()
        
        # Create notification for the student
        Notification.objects.create(
            user=application.student,
            title='Internship Terminated',
            message=f'Your internship at {company.name} for the position of {application.internship.position} has been terminated.\n\nReason: {termination_reason}\n\nYou can now apply for other internship opportunities.',
            notification_type='warning'
        )
        
        return Response({
            'message': 'Internship terminated successfully',
            'student_name': application.student.get_full_name(),
            'position': application.internship.position
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

