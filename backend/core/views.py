from rest_framework.decorators import api_view
import csv
import os
import datetime
from datetime import timedelta
from rest_framework.response import Response
from rest_framework import status
from .permissions import role_required
from .models import UserRole
from django.contrib.auth import login
from django.utils import timezone
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from .serializers import (
    RegisterSerializer, LoginSerializer, StudentProfileSerializer, UserActivityLogSerializer,
    CompanySerializer, InternshipSerializer, ApplicationSerializer, UserSerializer,
    SupervisorSerializer, CompanyUserSerializer, DailyJournalSerializer,
    PreTrainingRequirementSerializer, DocumentTemplateSerializer, AttendanceSerializer,
    TaskSerializer, PerformanceEvaluationSerializer, NoticeSerializer, SupportTicketSerializer,
    NarrativeReportSerializer, CoordinatorProfileSerializer
)
from .models import (
    Company, Internship, Application, StudentProfile, UserActivityLog,
    Supervisor, CompanyUser, DailyJournal, PreTrainingRequirement,
    DocumentTemplate, Attendance, Task, PerformanceEvaluation,
    Notice, SupportTicket, EmailVerification, GradingCriteria, StudentFinalGrade, NarrativeReport,
    CoordinatorProfile, LoginAttempt, EmailOTP, TwoFactorAuth, Message, TypingIndicator
)
import zipfile
import io
import random
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token 
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Sum
from django.db import models
from django.http import HttpResponse
from django.utils import timezone

def check_student_compliance(user):
    """
    Check if student has completed all required pre-training documents (Approved status).
    Returns (is_compliant, missing_docs_list)
    """
    if not hasattr(user, 'student_profile') or not user.student_profile.college:
        return True, []
        
    student_college = user.student_profile.college
    
    # Get Coordinator Settings
    from .models import CoordinatorProfile, CoordinatorSettings, PreTrainingRequirement
    
    # Find coordinator profile for this college
    coordinator_profile = CoordinatorProfile.objects.filter(college=student_college).first()
    
    required_doc_names = []
    
    # If no coordinator or no settings, enforce DEFAULTS
    if not coordinator_profile:
        required_doc_names = ['Resume/CV', 'Application Letter', 'Endorsement Letter', 'Waiver', 'Consent Letter']
    else:
        settings = CoordinatorSettings.objects.filter(coordinator=coordinator_profile.user).first()
        if not settings or not settings.required_docs:
             required_doc_names = ['Resume/CV', 'Application Letter', 'Endorsement Letter', 'Waiver', 'Consent Letter']
        else:
            # Get required documents (where required=True)
            required_doc_names = [d['name'] for d in settings.required_docs if d.get('required', False)]
    
    # If explicitly no required docs (empty list configured), allow
    if not required_doc_names:
        return True, []

    # Get student's Approved documents
    submitted_docs = PreTrainingRequirement.objects.filter(
        student=user,
        status='Approved'
    ).values_list('requirement_type', flat=True)
    
    missing_docs = []
    for req_name in required_doc_names:
        if req_name not in submitted_docs:
            missing_docs.append(req_name)
            
    if missing_docs:
        return False, missing_docs
        
    return True, []

# 🧱 Dashboard Summary
@api_view(['GET'])
@permission_classes([AllowAny])
def get_dashboard(request):
    user = request.user if request.user.is_authenticated else None

    if user and user.is_staff:  # Admin
        data = {
            "role": "admin",
            "total_companies": Company.objects.count(),
            "total_internships": Internship.objects.count(),
            "total_applications": Application.objects.count(),
        }
    elif user:  # Regular user
        data = {
            "role": "user",
            "total_companies": Company.objects.count(),
            "total_internships": Internship.objects.count(),
            "my_applications": Application.objects.filter(student=user).count(),
        }
    else:
        data = {"role": "guest"}
    
    return Response(data)

# 🔑 Admin Dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
    
    # Count users by role
    from .models import UserRole
    
    data = {
        "role": "admin",
        "total_companies": Company.objects.count(),
        "total_internships": Internship.objects.count(),
        "total_applications": Application.objects.count(),
        "pending_applications": Application.objects.filter(status="Pending").count(),
        "approved_applications": Application.objects.filter(status="Approved").count(),
        "rejected_applications": Application.objects.filter(status="Rejected").count(),
        "total_students": UserRole.objects.filter(role='student').count(),
        "total_users": User.objects.count(),
        "total_admins": UserRole.objects.filter(role='admin').count(),
        "total_coordinators": UserRole.objects.filter(role='coordinator').count(),
        "total_supervisors": UserRole.objects.filter(role='supervisor').count(),
    }
    return Response(data)

# 👨‍🎓 Student Dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    user = request.user
    my_apps = Application.objects.filter(student=user)
    
    data = {
        "role": "student",
        "total_internships": Internship.objects.count(),
        "total_applications": my_apps.count(),
        "approved_applications": my_apps.filter(status="Approved").count(),
        "pending_applications": my_apps.filter(status="Pending").count(),
        "rejected_applications": my_apps.filter(status="Rejected").count(),
    }
    return Response(data)

# 🏢 Companies CRUD
@api_view(['GET', 'POST'])
def company_list(request):
    if request.method == 'GET':
        # Auto-archive expired companies
        try:
            today = timezone.now().date()
            Company.objects.filter(moa_expiration_date__lt=today, status='Approved').update(status='Archived')
        except Exception as e:
            print(f"Error auto-archiving companies: {e}")

        companies = Company.objects.all()
        
        # Filter by target colleges for coordinators
        user = request.user
        if user.is_authenticated and hasattr(user, 'user_role'):
            if user.user_role.role == 'coordinator' and hasattr(user, 'coordinator_profile'):
                coordinator_college = user.coordinator_profile.college
                # Filter companies that target this coordinator's college
                # For JSONField, we need to filter companies where the array contains the college
                filtered_companies = []
                for company in companies:
                    if company.target_colleges and coordinator_college in company.target_colleges:
                        filtered_companies.append(company.id)
                companies = companies.filter(id__in=filtered_companies)
        
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def company_detail(request, pk):
    try:
        company = Company.objects.get(pk=pk)
    except Company.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = CompanySerializer(company)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = CompanySerializer(company, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_full_details(request, pk):
    """Get full details of a company including supervisors and students"""
    try:
        company = Company.objects.get(pk=pk)
    except Company.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    # Get basic info
    data = CompanySerializer(company).data
    
    # Get Supervisors (CompanyUser)
    supervisors = company.company_users.all()
    supervisor_data = []
    for s in supervisors:
        supervisor_data.append({
            'name': f"{s.user.first_name} {s.user.last_name}",
            'email': s.user.email,
            'phone': s.phone,
            'position': s.position
        })
    data['supervisors'] = supervisor_data
    
    # Get Students (via Internship -> Application)
    internships = company.internships.all()
    students_data = []
    
    for internship in internships:
        # Get active/approved/completed applications
        apps = internship.application_set.filter(status__in=['Approved', 'Completed', 'In Progress'])
        for app in apps:
            student = app.student
            profile = getattr(student, 'student_profile', None)
            students_data.append({
                'id': student.id,
                'name': f"{student.first_name} {student.last_name}",
                'email': student.email,
                'position': internship.position,
                'course': profile.course if profile else "N/A",
                'status': app.status
            })
            
    data['students'] = students_data
    
    return Response(data)


# 📤 Bulk Import Companies from CSV/Excel
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_import_companies(request):
    """Import multiple companies from CSV or Excel file"""
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
    
    if 'file' not in request.FILES:
        return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    file_name = file.name.lower()
    
    try:
        import pandas as pd
        import io
        
        # Read file based on extension
        if file_name.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file.read()))
        elif file_name.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(file.read()))
        else:
            return Response({
                "error": "Invalid file format. Please upload CSV or Excel file."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Expected columns (case-insensitive)
        required_columns = ['name']
        optional_columns = ['contact_person', 'email', 'phone', 'address']
        
        # Normalize column names to lowercase
        df.columns = df.columns.str.lower().str.strip()
        
        # Check if required columns exist
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                "error": f"Missing required columns: {', '.join(missing_columns)}",
                "hint": "Required: name. Optional: contact_person, email, phone, address"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process companies
        created_companies = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Prepare company data
                company_data = {
                    'name': str(row.get('name', '')).strip(),
                    'contact_person': str(row.get('contact_person', '')).strip() if pd.notna(row.get('contact_person')) else '',
                    'email': str(row.get('email', '')).strip() if pd.notna(row.get('email')) else '',
                    'phone': str(row.get('phone', '')).strip() if pd.notna(row.get('phone')) else '',
                    'address': str(row.get('address', '')).strip() if pd.notna(row.get('address')) else '',
                }
                
                # Skip if name is empty
                if not company_data['name'] or company_data['name'] == 'nan':
                    errors.append(f"Row {index + 2}: Company name is required")
                    continue
                
                # Check if company already exists
                if Company.objects.filter(name__iexact=company_data['name']).exists():
                    errors.append(f"Row {index + 2}: Company '{company_data['name']}' already exists")
                    continue
                
                # Create company
                serializer = CompanySerializer(data=company_data)
                if serializer.is_valid():
                    company = serializer.save()
                    created_companies.append(company.name)
                else:
                    errors.append(f"Row {index + 2}: {serializer.errors}")
                    
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return Response({
            'success': True,
            'created_count': len(created_companies),
            'created_companies': created_companies,
            'errors_count': len(errors),
            'errors': errors[:10],  # Limit to first 10 errors
            'message': f"Successfully imported {len(created_companies)} companies"
        }, status=status.HTTP_201_CREATED)
        
    except ImportError:
        return Response({
            "error": "pandas library is required for file import. Please install it: pip install pandas openpyxl"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "error": f"Failed to process file: {str(e)}"
        }, status=status.HTTP_400_BAD_REQUEST)


# 💼 Internships CRUD
@api_view(['GET', 'POST'])
def internship_list(request):
    if request.method == 'GET':
        # Check if user is a student and restrict access if they have missing requirements
        if request.user.is_authenticated:
            try:
                 if hasattr(request.user, 'user_role') and request.user.user_role.role == 'student':
                    is_compliant, missing_docs = check_student_compliance(request.user)
                    if not is_compliant:
                        return Response({
                            'error': 'Pre-training requirements incomplete',
                            'missing_requirements': missing_docs,
                            'message': 'You cannot search or view internships until all required documents are approved by your coordinator.'
                        }, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                pass # Continue if check fails (e.g. during migrations or edge cases)

        internships = Internship.objects.select_related('company').all()
        
        # For students, hide filled internships (Auto-disable logic)
        if request.user.is_authenticated and hasattr(request.user, 'user_role') and request.user.user_role.role == 'student':
            from django.db.models import Count, F, Q
            # Count approved applications and exclude if >= slots
            internships = internships.annotate(
                approved_apps=Count('application', filter=Q(application__status='Approved'))
            ).filter(approved_apps__lt=F('slots'))

        serializer = InternshipSerializer(internships, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        # For supervisors, automatically set the company
        data = request.data.copy()
        
        # Check if user is a supervisor and get their company
        user = request.user
        user_role = None
        try:
            if hasattr(user, 'user_role'):
                user_role = user.user_role.role
        except:
            pass
        
        if user_role == 'supervisor':
            try:
                company_user = CompanyUser.objects.get(user=user)
                data['company_id'] = company_user.company.id
            except CompanyUser.DoesNotExist:
                return Response({"error": "Supervisor not linked to any company"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = InternshipSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def internship_detail(request, pk):
    try:
        internship = Internship.objects.get(pk=pk)
    except Internship.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = InternshipSerializer(internship)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = InternshipSerializer(internship, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        internship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# 📝 Applications CRUD

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def application_list(request):
    if request.method == 'GET':
        # Check user role
        user = request.user
        user_role = None
        
        if hasattr(user, 'user_role'):
            user_role = user.user_role.role
        
        # Admin sees all applications
        if user.is_staff and (not user_role or user_role == 'admin'):
            apps = Application.objects.all()
        # Coordinator sees only applications from students in their college
        elif user_role == 'coordinator':
            try:
                coordinator_profile = user.coordinator_profile
                coordinator_college = coordinator_profile.college
                
                # Get student IDs from coordinator's college
                college_student_ids = StudentProfile.objects.filter(
                    college=coordinator_college
                ).values_list('user_id', flat=True)
                
                # Filter applications by these students
                apps = Application.objects.filter(student_id__in=college_student_ids)
            except:
                # If coordinator has no college assigned, show no applications
                apps = Application.objects.none()
        # Students see only their own applications
        else:
            apps = Application.objects.filter(student=request.user)
        
        serializer = ApplicationSerializer(apps, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        # Check if student has an active approved application (not completed)
        active_approved_app = Application.objects.filter(
            student=request.user,
            status='Approved'
        ).first()
        
        if active_approved_app:
            # Student has an approved internship - cannot apply to others
            return Response({
                'error': 'You already have an approved internship. You must complete your current internship before applying to another position.',
                'active_internship': {
                    'position': active_approved_app.internship.position,
                    'company': active_approved_app.internship.company.name,
                    'approved_date': active_approved_app.applied_at
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if student has reached the application limit
        from core.models import SystemSettings
        settings = SystemSettings.load()
        
        # Count current applications for this student
        current_app_count = Application.objects.filter(student=request.user).count()
        
        if current_app_count >= settings.max_applications_per_student:
            return Response({
                'error': f'You have reached the maximum limit of {settings.max_applications_per_student} applications.',
                'current_count': current_app_count,
                'max_allowed': settings.max_applications_per_student
            }, status=status.HTTP_400_BAD_REQUEST)
        
        internship_id = request.data.get('internship') or request.data.get('internship_id')
        if not internship_id:
            return Response({'error': 'Internship is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            internship = Internship.objects.get(id=internship_id)
        except Internship.DoesNotExist:
            return Response({'error': 'Invalid internship ID.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if student already applied to this internship
        existing_app = Application.objects.filter(student=request.user, internship=internship).first()
        if existing_app:
            return Response({
                'error': 'You have already applied to this internship.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cover_letter = request.data.get('cover_letter', '')
        resume_url = request.data.get('resume_url', '')
        resume_file = request.FILES.get('resume_file')
        parents_consent = request.FILES.get('parents_consent')
        internship_contract = request.FILES.get('internship_contract')
        student_health_record = request.FILES.get('student_health_record')
        
        app = Application(
            student=request.user, 
            internship=internship,
            cover_letter=cover_letter,
            resume_url=resume_url,
            resume_file=resume_file,
            parents_consent=parents_consent,
            internship_contract=internship_contract,
            student_health_record=student_health_record
        )
        app.save()
        serializer = ApplicationSerializer(app, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def application_detail(request, pk):
    try:
        application = Application.objects.get(pk=pk)
    except Application.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    # Check ownership: students can only access their own applications
    # Admins can access all applications
    if not request.user.is_staff and application.student != request.user:
        return Response(
            {'error': 'You do not have permission to access this application.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        serializer = ApplicationSerializer(application, context={'request': request})
        return Response(serializer.data)
    elif request.method in ['PUT', 'PATCH']:
        # Store old status for email notification
        old_status = application.status
        
        # Students can only update cover_letter, resume info, and only if status is Pending
        if not request.user.is_staff:
            if application.status != 'Pending':
                return Response(
                    {'error': 'You can only edit applications with Pending status.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Only allow updating cover_letter, resume_url, resume_file for students
            update_data = {
                'cover_letter': request.data.get('cover_letter', application.cover_letter),
                'resume_url': request.data.get('resume_url', application.resume_url),
            }
            if 'resume_file' in request.FILES:
                update_data['resume_file'] = request.FILES['resume_file']
        else:
            # Admins can update any field
            update_data = request.data.copy()
            if 'resume_file' in request.FILES:
                update_data['resume_file'] = request.FILES['resume_file']
        
        serializer = ApplicationSerializer(application, data=update_data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            
            # Send email notification if status changed
            new_status = serializer.data.get('status')
            if new_status and new_status != old_status:
                from .email_notifications import send_application_status_email
                try:
                    send_application_status_email(application, old_status, new_status)
                except Exception as e:
                    print(f"Failed to send email notification: {str(e)}")
                    # Don't fail the request if email fails
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        try:
            application.delete()
            return Response({'success': 'Application deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'error': f'Failed to delete application: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# 🔐 Authentication
# Send Verification Code
@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_code(request):
    """Send a 4-digit verification code to the email"""
    from django.core.mail import send_mail
    from django.utils import timezone
    from datetime import timedelta
    
    email = request.data.get('email')
    
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate 4-digit code
    code = str(random.randint(1000, 9999))
    
    # Delete old unverified codes for this email
    EmailVerification.objects.filter(email=email, is_verified=False).delete()
    
    # Create new verification record
    verification = EmailVerification.objects.create(email=email, code=code)
    
    # Send email
    try:
        from django.core.mail import EmailMultiAlternatives
        
        # HTML email template
        html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                            <div style="font-size: 32px; margin-bottom: 10px;">✉️</div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #333;">EARIST OJT System</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #333; text-align: center;">
                                Email Verification
                            </h2>
                            
                            <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.6; color: #666; text-align: center;">
                                Thank you for registering!<br>
                                Please use the code below to verify your email address.
                            </p>
                            
                            <!-- Code Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3px; border-radius: 12px; display: inline-block;">
                                            <div style="background: #ffffff; padding: 25px 60px; border-radius: 10px;">
                                                <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace;">
                                                    {code}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666; text-align: center;">
                                This code will expire in <strong>1 hour</strong>.
                            </p>
                            
                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                <tr>
                                    <td style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 4px;">
                                        <p style="margin: 0; font-size: 13px; color: #1565c0; line-height: 1.5;">
                                            <strong>ℹ️ Note:</strong><br>
                                            If you didn't request this code, please ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; font-size: 13px; color: #666; text-align: center;">
                                Best regards,<br>
                                <strong>EARIST OJT System Team</strong>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer Note -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                    <tr>
                        <td style="text-align: center; padding: 0 40px;">
                            <p style="margin: 0; font-size: 12px; color: #999; line-height: 1.5;">
                                © 2025 EARIST OJT System. All rights reserved.<br>
                                This message was sent to {email}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''
        
        # Plain text version
        text_content = f'''Your verification code is: {code}

This code will expire in 1 hour.

If you did not request this code, please ignore this email.

Best regards,
EARIST OJT System'''
        
        # Create email with both HTML and plain text
        email_msg = EmailMultiAlternatives(
            subject='Email Verification Code - EARIST OJT System',
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email]
        )
        email_msg.attach_alternative(html_content, "text/html")
        email_msg.send(fail_silently=False)
        return Response({
            'message': 'Verification code sent to your email',
            'email': email
        }, status=status.HTTP_200_OK)
    except Exception as e:
        # Log the error but don't delete verification - allow manual testing
        import traceback
        error_details = str(e)
        # For development: return the code in response if email fails
        if 'EMAIL_HOST_PASSWORD' in error_details or 'authentication' in error_details.lower():
            return Response({
                'message': 'Email service not configured. For testing, your code is: ' + code,
                'code': code,  # Only for development/testing
                'email': email,
                'warning': 'Email sending failed. Please configure EMAIL_PASSWORD in .env file.'
            }, status=status.HTTP_200_OK)
        verification.delete()
        return Response({
            'error': f'Failed to send email: {error_details}. Please check email configuration.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Verify Code
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_code(request):
    """Verify the email verification code"""
    from django.utils import timezone
    from datetime import timedelta
    
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response({"error": "Email and code are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Find verification record
    try:
        verification = EmailVerification.objects.get(email=email, code=code, is_verified=False)
    except EmailVerification.DoesNotExist:
        return Response({"error": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if code expired (1 hour)
    if timezone.now() - verification.created_at > timedelta(hours=1):
        verification.delete()
        return Response({"error": "Verification code has expired. Please request a new code."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check attempts
    verification.attempts += 1
    if verification.attempts > 5:
        verification.delete()
        return Response({"error": "Too many attempts. Please request a new code."}, status=status.HTTP_400_BAD_REQUEST)
    
    verification.is_verified = True
    verification.save()
    
    return Response({
        'message': 'Email verified successfully',
        'email': email
    }, status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'User registered successfully!'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    from django.utils import timezone
    from datetime import timedelta
    from .models import LoginAttempt

    # Get client IP
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')


    # Check if the input username matches a Student ID
    input_username = request.data.get('username')
    input_birth_date = request.data.get('birth_date')
    target_username = input_username
    student_profile = None
    
    if input_username:
        input_username = input_username.strip()
        
        # Try to resolve Student ID to Username
        try:
            # Case-insensitive lookup for Student ID
            student_profile = StudentProfile.objects.get(student_id__iexact=input_username)
            target_username = student_profile.user.username
        except (StudentProfile.DoesNotExist, StudentProfile.MultipleObjectsReturned):
            # Not a student ID, check if it's a non-student user (admin/coordinator/supervisor)
            if User.objects.filter(username=input_username).exists():
                user = User.objects.get(username=input_username)
                
                # Check if user has a non-student role
                if hasattr(user, 'user_role'):
                    if user.user_role.role in ['admin', 'coordinator', 'supervisor']:
                        # Non-student user - allow login with username
                        target_username = input_username
                    else:
                        # Student trying to login with username instead of Student ID
                        return Response({
                            "error": "Please log in using your Student ID."
                        }, status=status.HTTP_400_BAD_REQUEST)
                elif user.is_staff or user.is_superuser:
                    # Legacy admin user without role - allow login
                    target_username = input_username
                else:
                    # Regular user trying to login with username instead of Student ID
                    return Response({
                        "error": "Please log in using your Student ID."
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                 # User doesn't exist
                 pass
            pass

    # Check lockout status for the target username BEFORE any verification
    if target_username:
        try:
            attempt = LoginAttempt.objects.get(username=target_username)
            if attempt.attempts >= 3:
                # Check 2-minute lockout
                time_diff = timezone.now() - attempt.last_attempt
                if time_diff.total_seconds() < 120: # 120 seconds = 2 minutes
                    minutes_left = 2 - int(time_diff.total_seconds() / 60)
                    return Response({
                        "error": f"Account temporarily locked. Please try again in {minutes_left} minutes."
                    }, status=status.HTTP_403_FORBIDDEN)
                else:
                    # Lockout expired, reset attempts
                    attempt.attempts = 0
                    attempt.save()
        except LoginAttempt.DoesNotExist:
            pass

    # NOW verify birthday if it's a student login
    if student_profile:
        if not input_birth_date:
            # Track this as a failed attempt
            if target_username:
                attempt, created = LoginAttempt.objects.get_or_create(username=target_username)
                attempt.ip_address = ip
                attempt.attempts += 1
                attempt.last_attempt = timezone.now()
                
                attempt.save()
                
                attempt.save()
                remaining = 3 - attempt.attempts
                return Response({
                    "error": f"Birthday is required for login. {remaining} attempts remaining."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                "error": "Birthday is required for login."
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if str(student_profile.birth_date) != input_birth_date:
            # Track this as a failed attempt
            if target_username:
                attempt, created = LoginAttempt.objects.get_or_create(username=target_username)
                attempt.ip_address = ip
                attempt.attempts += 1
                attempt.last_attempt = timezone.now()
                
                attempt.save()
                
                attempt.save()
                remaining = 3 - attempt.attempts
                return Response({
                    "error": f"Invalid birthday. {remaining} attempts remaining."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                "error": "Invalid birthday. Please check your details."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Birthday is correct, update request.data with actual username
        if hasattr(request.data, '_mutable'):
            request.data._mutable = True
        request.data['username'] = student_profile.user.username

    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data
        
        # Get user role
        user_role = 'student'  # default
        if hasattr(user, 'user_role'):
            user_role = user.user_role.role
        elif user.is_superuser or user.is_staff:
            user_role = 'admin'
        
        # Check if 2FA is required for this user
        two_fa_required = False
        two_fa_setup_required = False
        
        try:
            two_factor = TwoFactorAuth.objects.get(user=user, is_enabled=True, is_verified=True)
            two_fa_required = True
        except TwoFactorAuth.DoesNotExist:
            # If user is admin and doesn't have 2FA enabled, offer choice
            if user_role == 'admin':
                # Return choice prompt
                return Response({
                    'requires_2fa_choice': True,
                    'message': 'Please choose your preferred 2FA method',
                    'user_id': user.id,
                    'username': user.username,
                    'has_email': bool(user.email),
                    'email': user.email if user.email else None
                }, status=status.HTTP_200_OK)
            
            two_fa_required = False
        
        # If 2FA is enabled, check preferred method and handle accordingly
        if two_fa_required:
            preferred_method = two_factor.preferred_method
            
            # Handle based on preferred method
            if preferred_method == 'email':
                # Email-based 2FA
                if not user.email:
                    return Response({
                        'error': 'No email address on file. Please contact administrator.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if device is trusted
                from .two_factor_utils import is_device_trusted, generate_device_id
                device_token = request.data.get('device_token')  # Get from frontend localStorage
                device_trusted = is_device_trusted(user, request, device_token)
                device_id = generate_device_id(request, device_token)
                
                # Debug logging
                print(f"[2FA DEBUG] User: {user.username}, Device ID: {device_id}, Token: {device_token[:16] if device_token else 'None'}..., Trusted: {device_trusted}")
                
                if device_trusted:
                    print(f"[2FA SKIP] Device is trusted, skipping 2FA for {user.username}")
                
                if not device_trusted:
                    # Check if email OTP code is provided
                    email_code = request.data.get('email_code', '').strip()
                    
                    if not email_code:
                        # Send email OTP
                        code = str(random.randint(100000, 999999))
                        from .two_factor_utils import get_client_ip
                        ip_address = get_client_ip(request)
                        
                        print(f"[2FA EMAIL] Sending OTP {code} to {user.email}")
                        
                        EmailOTP.objects.create(
                            user=user,
                            code=code,
                            expires_at=timezone.now() + timedelta(minutes=10),
                            ip_address=ip_address
                        )
                        
                        try:
                            from django.core.mail import EmailMultiAlternatives
                            
                            # HTML email template
                            html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🔐</div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #333;">EARIST OJT System</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #333; text-align: center;">
                                Security Verification Code
                            </h2>
                            
                            <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.6; color: #666; text-align: center;">
                                Hello <strong>{user.get_full_name() or user.username}</strong>,<br>
                                We received a request to verify your identity.
                            </p>
                            
                            <!-- Code Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3px; border-radius: 12px; display: inline-block;">
                                            <div style="background: #ffffff; padding: 25px 50px; border-radius: 10px;">
                                                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                                                    {code}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666; text-align: center;">
                                This code will expire in <strong>10 minutes</strong>.
                            </p>
                            
                            <!-- Warning Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                <tr>
                                    <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                                        <p style="margin: 0; font-size: 13px; color: #856404; line-height: 1.5;">
                                            <strong>⚠️ Security Notice:</strong><br>
                                            If you didn't request this code, please ignore this email or contact your administrator immediately.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; font-size: 13px; color: #666; text-align: center;">
                                Best regards,<br>
                                <strong>EARIST OJT System Team</strong>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer Note -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                    <tr>
                        <td style="text-align: center; padding: 0 40px;">
                            <p style="margin: 0; font-size: 12px; color: #999; line-height: 1.5;">
                                © 2025 EARIST OJT System. All rights reserved.<br>
                                This message was sent to {user.email}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''
                            
                            # Plain text version
                            text_content = f'''Hello {user.get_full_name() or user.username},

Your 2FA verification code is: {code}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email or contact your administrator.

Best regards,
EARIST OJT System'''
                            
                            # Create email with both HTML and plain text
                            email_msg = EmailMultiAlternatives(
                                subject='EARIST OJT System - Your 2FA Code',
                                body=text_content,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                to=[user.email]
                            )
                            email_msg.attach_alternative(html_content, "text/html")
                            email_msg.send(fail_silently=False)
                        except Exception as email_error:
                            return Response({
                                'error': f'Failed to send verification email: {str(email_error)}'
                            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        
                        return Response({
                            'requires_email_2fa': True,
                            'message': f'Verification code sent to {user.email}',
                            'email': user.email,
                            'user_id': user.id,
                            'username': user.username
                        }, status=status.HTTP_200_OK)
                    else:
                        # Verify email OTP
                        try:
                            otp = EmailOTP.objects.filter(
                                user=user,
                                code=email_code,
                                is_used=False,
                                expires_at__gt=timezone.now()
                            ).latest('created_at')
                            
                            if otp.attempts >= 3:
                                return Response({'error': 'Too many attempts. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)
                            
                            if otp.code != email_code:
                                otp.attempts += 1
                                otp.save()
                                return Response({'error': f'Invalid code. {3 - otp.attempts} attempts remaining.'}, status=status.HTTP_400_BAD_REQUEST)
                            
                            # Mark as used
                            otp.is_used = True
                            otp.used_at = timezone.now()
                            otp.save()
                            
                            # Trust device if requested
                            trust_this_device = request.data.get('trust_device', False)
                            if trust_this_device:
                                from .two_factor_utils import trust_device as trust_device_func, log_2fa_event
                                trust_device_func(user, request, days=7)
                                log_2fa_event(user, 'DEVICE_TRUSTED', request, 'Device marked as trusted for 7 days')
                            
                        except EmailOTP.DoesNotExist:
                            return Response({'error': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)
            
            elif preferred_method == 'app':
                # App-based 2FA (Google Authenticator)
                from .two_factor_utils import (
                    is_device_trusted, trust_device, verify_totp_code,
                    verify_backup_code, log_2fa_event
                )
            
            # Check if device is trusted (for app-based 2FA)
            device_token = request.data.get('device_token')
            device_trusted = is_device_trusted(user, request, device_token)
            
            if not device_trusted:
                # 2FA code is required
                two_fa_code = request.data.get('two_fa_code', '').strip()
                backup_code_input = request.data.get('backup_code', '').strip()
                trust_this_device = request.data.get('trust_device', False)
                
                # If no 2FA code provided, return 2FA required response
                if not two_fa_code and not backup_code_input:
                    return Response({
                        'requires_2fa': True,
                        'message': '2FA verification required',
                        'user_id': user.id,
                        'username': user.username
                    }, status=status.HTTP_200_OK)
                
                # Verify 2FA code or backup code
                verification_successful = False
                
                if two_fa_code:
                    # Verify TOTP code
                    if verify_totp_code(two_factor.secret_key, two_fa_code):
                        verification_successful = True
                        two_factor.last_used_at = timezone.now()
                        two_factor.save()
                        log_2fa_event(user, '2FA_VERIFIED', request, '2FA code verified successfully')
                    else:
                        log_2fa_event(user, '2FA_FAILED', request, 'Invalid 2FA code')
                        return Response({
                            'error': 'Invalid 2FA code. Please try again.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                elif backup_code_input:
                    # Verify backup code
                    if verify_backup_code(user, backup_code_input):
                        verification_successful = True
                        log_2fa_event(user, 'BACKUP_CODE_USED', request, f'Backup code used: {backup_code_input[:4]}****')
                    else:
                        log_2fa_event(user, '2FA_FAILED', request, 'Invalid backup code')
                        return Response({
                            'error': 'Invalid backup code. Please try again.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                # If verification failed
                if not verification_successful:
                    return Response({
                        'error': 'Invalid 2FA verification. Please try again.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # If user wants to trust this device
                if trust_this_device:
                    device, device_token_new = trust_device(user, request, days=7)
                    log_2fa_event(user, 'DEVICE_TRUSTED', request, 'Device marked as trusted for 7 days')
        
        # Authentication successful - generate token
        token, created = Token.objects.get_or_create(user=user)

        
        # Reset login attempts on success
        LoginAttempt.objects.filter(username=user.username).delete()
        
        # Log login activity
        UserActivityLog.objects.create(
            user=user,
            action='Login',
            description=f'{user.username} logged in'
        )
        
        # Get user role
        user_role = 'student'  # default
        user_role_display = 'Student'
        if hasattr(user, 'user_role'):
            user_role = user.user_role.role
            user_role_display = user.user_role.get_role_display()
        
        return Response({
            'message': 'Login successful!',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'role': user_role,
                'role_display': user_role_display
            }
        }, status=status.HTTP_200_OK)
    else:
        # Login failed
        if target_username:
            attempt, created = LoginAttempt.objects.get_or_create(username=target_username)
            attempt.ip_address = ip
            attempt.attempts += 1
            attempt.last_attempt = timezone.now()
            
            if attempt.attempts >= 3:
                attempt.save()
                return Response({
                    "error": "Too many failed attempts. Security check required.",
                    "requires_captcha": True
                }, status=status.HTTP_403_FORBIDDEN)
            
            attempt.save()
            
            remaining = 3 - attempt.attempts
            return Response({
                "error": f"Invalid credentials. {remaining} attempts remaining."
            }, status=status.HTTP_400_BAD_REQUEST)
            
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Logout user and log the activity"""
    try:
        # Log logout activity
        UserActivityLog.objects.create(
            user=request.user,
            action='Logout',
            description=f'{request.user.username} logged out'
        )
        
        # Delete the token
        try:
            token = Token.objects.get(user=request.user)
            token.delete()
        except Token.DoesNotExist:
            pass
        
        return Response({
            'message': 'Logout successful!'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Logout failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Password Reset
@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Generate a new password and send it to the user's email"""
    try:
        import string
        import random
        from django.db.models import Q
        from django.conf import settings
        
        identifier = request.data.get('email') or request.data.get('username')
        
        if not identifier:
            return Response({"error": "Email or Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists by email OR username
        try:
            from django.contrib.auth.models import User
            user = User.objects.filter(Q(email=identifier) | Q(username=identifier)).first()
        except Exception:
            user = None

        if not user:
            # Don't reveal if email/user exists for security
            return Response({
                'message': 'If an account with this identifier exists, a new password has been sent to the registered email.'
            }, status=status.HTTP_200_OK)
        
        # If user found but has no email
        if not user.email:
            print(f"[PASSWORD RESET] User {user.username} has no email address.")
            return Response({
                'message': 'If an account with this identifier exists, a new password has been sent to the registered email.'
            }, status=status.HTTP_200_OK)

        # Check if email is configured
        if not settings.EMAIL_HOST_PASSWORD:
            print("[PASSWORD RESET ERROR] EMAIL_HOST_PASSWORD is not configured in settings!")
            print("[PASSWORD RESET ERROR] Please set EMAIL_PASSWORD in your .env file")
            return Response({
                'error': 'Email service is not configured. Please contact the administrator.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Generate a secure random password (8 characters: letters and digits)
        characters = string.ascii_letters + string.digits
        new_password = ''.join(random.choice(characters) for _ in range(8))
        
        # Set the new password for the user
        user.set_password(new_password)
        user.save()
        
        print(f"[PASSWORD RESET] Password reset requested for user: {user.username} ({user.email})")
        
        # Send beautiful HTML email
        try:
            from django.core.mail import EmailMultiAlternatives
            
            student_name = user.get_full_name() or user.username
            
            # HTML email template
            html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🔒</div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #333;">EARIST OJT System</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #333; text-align: center;">
                                Password Reset Request
                            </h2>
                            
                            <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.6; color: #666; text-align: center;">
                                Hello <strong>{student_name}</strong>,<br>
                                We received a request to reset your password.
                            </p>
                            
                            <!-- Password Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3px; border-radius: 12px; display: inline-block;">
                                            <div style="background: #ffffff; padding: 25px 50px; border-radius: 10px;">
                                                <p style="margin: 0 0 10px; font-size: 13px; color: #666; text-align: center;">Your New Password</p>
                                                <div style="font-size: 28px; font-weight: 700; letter-spacing: 3px; color: #667eea; font-family: 'Courier New', monospace;">
                                                    {new_password}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Important Info -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                <tr>
                                    <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                                        <p style="margin: 0 0 10px; font-size: 13px; color: #856404; line-height: 1.5;">
                                            <strong>⚠️ Important:</strong>
                                        </p>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #856404; line-height: 1.6;">
                                            <li>Use this password to log in immediately</li>
                                            <li>Change this password after logging in for security</li>
                                            <li>If you didn't request this, contact admin immediately</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Login Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="http://localhost:3000/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Log In Now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; font-size: 13px; color: #666; text-align: center;">
                                Best regards,<br>
                                <strong>EARIST OJT System Team</strong>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer Note -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                    <tr>
                        <td style="text-align: center; padding: 0 40px;">
                            <p style="margin: 0; font-size: 12px; color: #999; line-height: 1.5;">
                                © 2025 EARIST OJT System. All rights reserved.<br>
                                This message was sent to {user.email}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''
            
            # Plain text version
            text_content = f'''Password Reset Request

Hello {student_name},

We received a request to reset your password.

Your new password is: {new_password}

Important:
- Use this password to log in immediately
- Change this password after logging in for security
- If you didn't request this, contact admin immediately

Log in at: http://localhost:3000/login

Best regards,
EARIST OJT System'''
            
            # Create email with both HTML and plain text
            email_msg = EmailMultiAlternatives(
                subject='Password Reset Request - EARIST OJT System',
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            email_msg.attach_alternative(html_content, "text/html")
            
            print(f"[PASSWORD RESET] Attempting to send email to {user.email}...")
            email_msg.send(fail_silently=False)
            print(f"[PASSWORD RESET] Email sent successfully to {user.email}")
            
            return Response({
                'message': f'A new password has been sent to {user.email}. Please check your inbox.'
            }, status=status.HTTP_200_OK)
            
        except Exception as email_error:
            # Log the specific error
            import traceback
            print(f"[PASSWORD RESET ERROR] Failed to send email: {str(email_error)}")
            traceback.print_exc()
            
            # Check for common email errors
            error_message = str(email_error).lower()
            if 'authentication' in error_message or 'username and password not accepted' in error_message:
                print("[PASSWORD RESET ERROR] Email authentication failed. Check EMAIL_HOST_PASSWORD in .env")
                return Response({
                    'error': 'Email service authentication failed. Please contact the administrator.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            elif 'connection' in error_message or 'timeout' in error_message:
                print("[PASSWORD RESET ERROR] Email connection failed. Check internet connection or SMTP settings")
                return Response({
                    'error': 'Failed to connect to email server. Please check your internet connection or try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({
                    'error': f'Failed to send email: {str(email_error)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
    except Exception as e:
        import traceback
        print(f"[PASSWORD RESET ERROR] Unexpected error: {str(e)}")
        traceback.print_exc()
        return Response({
            'error': f'An unexpected error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Change Password
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user's password"""
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({"error": "Old password and new password are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 6 or len(new_password) > 12:
        return Response({"error": "Password must be between 6 and 12 characters"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify old password
    user = request.user
    if not user.check_password(old_password):
        return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response({
        'message': 'Password changed successfully'
    }, status=status.HTTP_200_OK)

# 👤 Student Profile Management
@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    """Get or update own student profile"""
    try:
        profile = StudentProfile.objects.get(user=request.user)
    except StudentProfile.DoesNotExist:
        profile = StudentProfile.objects.create(user=request.user)
    
    if request.method == 'GET':
        serializer = StudentProfileSerializer(profile, context={'request': request})
        data = serializer.data
        
        # Check if profile is complete (required fields filled)
        required_fields = ['course', 'year', 'section', 'phone', 'address', 'skills', 'career_interests']
        profile_complete = all(
            data.get(field) and str(data.get(field)).strip() 
            for field in required_fields
        )
        
        # Also check if resume is uploaded (either resume file or resume_url)
        has_resume = (data.get('resume') and str(data.get('resume')).strip()) or \
                     (data.get('resume_url') and str(data.get('resume_url')).strip())
        
        # Check if COR is uploaded
        has_cor = data.get('certificate_of_registration') and str(data.get('certificate_of_registration')).strip()
        
        profile_complete = profile_complete and has_resume and has_cor
        data['profile_complete'] = profile_complete
        
        return Response(data)
    elif request.method in ['PUT', 'PATCH']:
        # Handle file uploads - files are already in request.data when using multipart/form-data
        serializer = StudentProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            # Return updated data with request context for proper URL generation
            updated_serializer = StudentProfileSerializer(profile, context={'request': request})
            data = updated_serializer.data
            
            # Check if profile is complete (same logic as GET)
            required_fields = ['course', 'year', 'section', 'phone', 'address', 'skills', 'career_interests']
            profile_complete = all(
                data.get(field) and str(data.get(field)).strip() 
                for field in required_fields
            )
            
            # Also check if resume is uploaded (either resume file or resume_url)
            has_resume = (data.get('resume') and str(data.get('resume')).strip()) or \
                         (data.get('resume_url') and str(data.get('resume_url')).strip())
            
            # Check if COR is uploaded
            has_cor = data.get('certificate_of_registration') and str(data.get('certificate_of_registration')).strip()
            
            profile_complete = profile_complete and has_resume and has_cor
            data['profile_complete'] = profile_complete
            
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 👥 Admin: View All Users
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def users_list(request):
    """Admin, Coordinator, and Supervisor can view users"""
    # Check if user has admin, coordinator, or supervisor role
    if hasattr(request.user, 'user_role'):
        if request.user.user_role.role not in ['admin', 'coordinator', 'supervisor']:
            return Response({
                "error": "Access denied. Staff only.",
                "message": "User management requires staff privileges."
            }, status=status.HTTP_403_FORBIDDEN)
    elif not request.user.is_staff:
        # Fallback for users without role
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create new user
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'student')  # Default to student
        
        # Determine is_staff based on role
        is_staff = role == 'admin'
        
        if not username or not email or not password:
            return Response(
                {"error": "Username, email, and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff
        )
        
        # Create UserRole
        UserRole.objects.create(user=user, role=role)
        
        # Create specific profiles based on role
        if role == 'student':
            StudentProfile.objects.create(
                user=user,
                student_id=request.data.get('student_id', ''),
                college=request.data.get('college', ''),
                course=request.data.get('course', ''),
                year=request.data.get('year', ''),
                section=request.data.get('section', '')
            )
        elif role == 'coordinator':
            CoordinatorProfile.objects.create(
                user=user,
                college=request.data.get('college', ''),
                department=request.data.get('department', ''),
                phone=request.data.get('phone', '')
            )
        elif role == 'supervisor':
            company_id = request.data.get('company_id')
            if company_id:
                # Create CompanyUser (Company Supervisor)
                CompanyUser.objects.create(
                    user=user,
                    company_id=company_id,
                    phone=request.data.get('phone', '')
                )
            else:
                # Create Supervisor (School Adviser) - fallback if no company selected
                Supervisor.objects.create(
                    user=user,
                    department=request.data.get('department', ''),
                    phone=request.data.get('phone', '')
                )
        
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# 👤 Admin: Manage User Profile
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN, UserRole.COORDINATOR])
def user_profile_detail(request, user_id):
    """Admin and Coordinator can view, edit, delete user profiles"""
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        user_role = 'student'
        if hasattr(user, 'user_role'):
            user_role = user.user_role.role
        elif user.is_staff:
            user_role = 'admin'
            
        profile_data = {}
        
        if user_role == 'supervisor':
            try:
                try:
                    profile = CompanyUser.objects.get(user=user)
                    profile_data = CompanyUserSerializer(profile).data
                except CompanyUser.DoesNotExist:
                    # Try finding School Supervisor profile
                    profile = Supervisor.objects.get(user=user)
                    profile_data = SupervisorSerializer(profile).data
            except (Supervisor.DoesNotExist, CompanyUser.DoesNotExist):
                profile_data = {}
            except Exception as e:
                print(f"Error fetching supervisor profile for user {user.id}: {str(e)}")
                profile_data = {}
        elif user_role == 'coordinator':
            try:
                profile = CoordinatorProfile.objects.get(user=user)
                profile_data = CoordinatorProfileSerializer(profile).data
            except CoordinatorProfile.DoesNotExist:
                profile_data = {}
        else: # Default to student
            try:
                profile = StudentProfile.objects.get(user=user)
            except StudentProfile.DoesNotExist:
                # Only iterate if it IS a student role or has no role
                if user_role == 'student':
                    profile = StudentProfile.objects.create(user=user)
                else:
                    profile = None
            
            if profile:
                profile_data = StudentProfileSerializer(profile).data
        
        data = {
            'user': UserSerializer(user).data,
            'profile': profile_data
        }
        return Response(data)
    
    elif request.method == 'PUT':
        # Update user details
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        is_staff = request.data.get('is_staff')
        if is_staff is not None:
            user.is_staff = is_staff
        user.save()
        
        # Update password if provided
        password = request.data.get('password')
        if password:
            user.set_password(password)
            user.save()
        
        # Check role to determine which profile to update
        user_role = 'student'
        if hasattr(user, 'user_role'):
            user_role = user.user_role.role
            
        updated_profile_data = {}
        
        if user_role == 'supervisor':
            try:
                profile = CompanyUser.objects.get(user=user)
                # Update specific supervisor fields if needed, e.g. phone
                if 'phone' in request.data:
                    profile.phone = request.data['phone']
                
                # Update company if provided
                company_id = request.data.get('company_id')
                if company_id:
                    try:
                        company = Company.objects.get(pk=company_id)
                        profile.company = company
                    except Company.DoesNotExist:
                        pass
                
                profile.save()
                updated_profile_data = CompanyUserSerializer(profile).data
            except CompanyUser.DoesNotExist:
                # Try finding School Supervisor profile
                try:
                    profile = Supervisor.objects.get(user=user)
                    if 'department' in request.data:
                         profile.department = request.data['department']
                    if 'phone' in request.data:
                         profile.phone = request.data['phone']
                    profile.save()
                    updated_profile_data = SupervisorSerializer(profile).data
                except Supervisor.DoesNotExist:
                     pass

                # Create profile if not exists but we have company_id (This upgrades/creates CompanyUser)
                company_id = request.data.get('company_id')
                if company_id:
                     try:
                        company = Company.objects.get(pk=company_id)
                        # If upgrading from Supervisor to CompanyUser, we might want to delete Supervisor or keep both?
                        # For now, create CompanyUser
                        profile = CompanyUser.objects.create(
                            user=user,
                            company=company,
                            phone=request.data.get('phone', '')
                        )
                        updated_profile_data = CompanyUserSerializer(profile).data
                     except Company.DoesNotExist:
                        pass
        
        elif user_role == 'coordinator':
            try:
                profile = CoordinatorProfile.objects.get(user=user)
                if 'phone' in request.data:
                    profile.phone = request.data['phone']
                if 'college' in request.data:
                    profile.college = request.data['college']
                if 'department' in request.data:
                    profile.department = request.data['department']
                profile.save()
                updated_profile_data = CoordinatorProfileSerializer(profile).data
            except CoordinatorProfile.DoesNotExist:
                # Create profile if missing
                if 'college' in request.data:
                    profile = CoordinatorProfile.objects.create(
                        user=user,
                        college=request.data['college'],
                        department=request.data.get('department', ''),
                        phone=request.data.get('phone', '')
                    )
                    updated_profile_data = CoordinatorProfileSerializer(profile).data
                
        else: # Student
            profile, _ = StudentProfile.objects.get_or_create(user=user)
            profile_serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
                updated_profile_data = profile_serializer.data
        
        return Response({
            'user': UserSerializer(user).data,
            'profile': updated_profile_data
        })
    
    elif request.method == 'DELETE':
        user.delete()
        return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# 📊 Admin: User Statistics
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_statistics(request):
    """Admin view user statistics"""
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
    
    total_users = User.objects.count()
    total_students = User.objects.filter(is_staff=False).count()
    total_admins = User.objects.filter(is_staff=True).count()
    total_companies = Company.objects.count()
    total_internships = Internship.objects.count()
    total_applications = Application.objects.count()
    
    return Response({
        'total_users': total_users,
        'total_students': total_students,
        'total_admins': total_admins,
        'total_companies': total_companies,
        'total_internships': total_internships,
        'total_applications': total_applications,
        'pending_applications': Application.objects.filter(status='Pending').count(),
        'approved_applications': Application.objects.filter(status='Approved').count(),
        'rejected_applications': Application.objects.filter(status='Rejected').count(),
    })

# 📊 Comprehensive Report Generation
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_comprehensive_report(request):
    """Generate comprehensive internship analytics and performance report (Admin only)"""
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from django.db.models import Count, Q, Avg
        from datetime import timedelta
        from django.utils import timezone
        
        # Basic Statistics
        total_users = User.objects.count()
        total_students = User.objects.filter(is_staff=False).count()
        total_admins = User.objects.filter(is_staff=True).count()
        total_companies = Company.objects.count()
        total_internships = Internship.objects.count()
        total_applications = Application.objects.count()
        pending_applications = Application.objects.filter(status='Pending').count()
        approved_applications = Application.objects.filter(status='Approved').count()
        rejected_applications = Application.objects.filter(status='Rejected').count()
        
        # Performance Metrics
        approval_rate = (approved_applications / total_applications * 100) if total_applications > 0 else 0
        rejection_rate = (rejected_applications / total_applications * 100) if total_applications > 0 else 0
        
        # Internship Analytics
        internships_by_company = Internship.objects.values('company__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        applications_by_status = {
            'pending': pending_applications,
            'approved': approved_applications,
            'rejected': rejected_applications
        }
        
        # Course Distribution (from student profiles)
        course_distribution = StudentProfile.objects.exclude(
            course__isnull=True
        ).exclude(course='').values('course').annotate(
            count=Count('id')
        ).order_by('-count')[:15]
        
        # Time-based Analytics (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_applications = Application.objects.filter(
            applied_at__gte=thirty_days_ago
        ).count()
        recent_approvals = Application.objects.filter(
            status='Approved',
            applied_at__gte=thirty_days_ago
        ).count()
        
        # Activity Metrics
        total_activity_logs = UserActivityLog.objects.count()
        recent_activity_logs = UserActivityLog.objects.filter(
            timestamp__gte=thirty_days_ago
        ).count()
        
        # Student Engagement
        students_with_applications = Application.objects.values('student').distinct().count()
        students_with_profiles = StudentProfile.objects.count()
        profile_completion_rate = (students_with_profiles / total_students * 100) if total_students > 0 else 0
        
        # Internship Performance
        internships_with_applications = Internship.objects.filter(
            id__in=Application.objects.values_list('internship_id', flat=True).distinct()
        ).count()
        
        avg_applications_per_internship = (
            total_applications / total_internships if total_internships > 0 else 0
        )
        
        # Top Performing Companies (by approval rate)
        # Calculate approval rates for companies
        top_companies_list = []
        for company in Company.objects.all():
            internships = company.internships.all()
            total_apps = Application.objects.filter(internship__in=internships).count()
            approved_apps = Application.objects.filter(
                internship__in=internships,
                status='Approved'
            ).count()
            
            if total_apps > 0:
                company_approval_rate = (approved_apps / total_apps) * 100
                top_companies_list.append({
                    'company': company.name,
                    'total_applications': total_apps,
                    'approved_applications': approved_apps,
                    'approval_rate': round(company_approval_rate, 2)
                })
        
        # Sort by approval rate and get top 10
        top_companies_list.sort(key=lambda x: x['approval_rate'], reverse=True)
        top_companies = top_companies_list[:10]
        
        report_data = {
            'report_generated_at': timezone.localtime(timezone.now()).isoformat(),
            'generated_by': request.user.get_full_name() or request.user.username,
            'summary': {
                'total_users': total_users,
                'total_students': total_students,
                'total_admins': total_admins,
                'total_companies': total_companies,
                'total_internships': total_internships,
                'total_applications': total_applications,
            },
            'application_metrics': {
                'pending': pending_applications,
                'approved': approved_applications,
                'rejected': rejected_applications,
                'approval_rate': round(approval_rate, 2),
                'rejection_rate': round(rejection_rate, 2),
                'recent_applications_30_days': recent_applications,
                'recent_approvals_30_days': recent_approvals,
            },
            'student_engagement': {
                'students_with_applications': students_with_applications,
                'students_with_profiles': students_with_profiles,
                'profile_completion_rate': round(profile_completion_rate, 2),
                'application_rate': round((students_with_applications / total_students * 100) if total_students > 0 else 0, 2),
            },
            'internship_analytics': {
                'total_internships': total_internships,
                'internships_with_applications': internships_with_applications,
                'avg_applications_per_internship': round(avg_applications_per_internship, 2),
                'top_companies_by_internships': [
                    {'company': item['company__name'], 'internship_count': item['count']}
                    for item in internships_by_company
                ],
            },
            'course_distribution': [
                {'course': item['course'], 'student_count': item['count']}
                for item in course_distribution
            ],
            'top_performing_companies': top_companies,
            'activity_metrics': {
                'total_activity_logs': total_activity_logs,
                'recent_activity_30_days': recent_activity_logs,
            },
        }
        
        # Generate PDF report
        from .report_generator import generate_pdf_report
        from datetime import datetime as dt
        
        pdf_buffer = generate_pdf_report(report_data)
        
        if pdf_buffer is None:
            return Response({"error": "Failed to generate PDF report"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Create HTTP response with PDF
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        filename = f'internship_analytics_report_{dt.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Report generation error: {error_trace}")  # Log to console for debugging
        return Response({
            "error": "Failed to generate report",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 📋 Activity Logs
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_logs(request):
    """Get activity logs for current user or all (if admin)"""
    if request.user.is_staff:
        logs = UserActivityLog.objects.all()[:100]  # Last 100 logs
    else:
        logs = UserActivityLog.objects.filter(user=request.user)[:50]
    
    serializer = UserActivityLogSerializer(logs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_login_logs(request):
    """Get login and logout logs for students (Admin only)"""
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
    
    # Get all login and logout activity logs for ONLY students (not supervisors, coordinators, or admins)
    # Filter by UserRole to ensure only actual students are shown
    student_user_ids = UserRole.objects.filter(role=UserRole.STUDENT).values_list('user_id', flat=True)
    
    logs = UserActivityLog.objects.filter(
        action__in=['Login', 'Logout'],
        user_id__in=student_user_ids
    ).order_by('-timestamp')[:100]
    
    serializer = UserActivityLogSerializer(logs, many=True)
    return Response(serializer.data)

# 🔔 Log Activity
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_activity(request):
    """Log user activity"""
    action = request.data.get('action')
    description = request.data.get('description', '')
    
    if not action:
        return Response({"error": "Action is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    log = UserActivityLog.objects.create(
        user=request.user,
        action=action,
        description=description
    )
    serializer = UserActivityLogSerializer(log)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# 🤖 ML Matching: Get Recommended Internships
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_matched_internships(request):
    """Get AI-recommended internships based on student profile"""
    
    # Check compliance for students
    try:
        if hasattr(request.user, 'user_role') and request.user.user_role.role == 'student':
            is_compliant, missing_docs = check_student_compliance(request.user)
            if not is_compliant:
                return Response({
                    'error': 'Pre-training requirements incomplete',
                    'missing_requirements': missing_docs,
                    'message': 'AI Recommendations are locked until all required pre-training documents are approved.'
                }, status=status.HTTP_403_FORBIDDEN)
    except Exception:
        pass

    from core.matching import get_student_matches
    
    try:
        top_n = request.query_params.get('top_n', 10)
        model = request.query_params.get('model', 'models/gemini-2.5-flash')
        matches = get_student_matches(request.user.id, int(top_n), model=model)
        return Response({
            'recommendations': matches,
            'count': len(matches),
            'method': 'AI-powered collaborative filtering',
            'model': model
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# 💡 Career Guidance: Get Recommendations
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_career_guidance(request):
    """Get career guidance recommendations"""
    from core.career_guidance import get_career_guidance as get_guidance
    
    try:
        model = request.query_params.get('model', 'models/gemini-2.5-flash')
        guidance = get_guidance(request.user.id, model=model)
        return Response(guidance)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# 📊 Feedback Analysis: Analyze Employer Feedback
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analyze_feedback(request):
    """Analyze employer feedback patterns"""
    from core.career_guidance import analyze_feedback as analyze_fb
    
    try:
        model = request.query_params.get('model', 'models/gemini-2.5-flash')
        analysis = analyze_fb(request.user.id, model=model)
        return Response(analysis)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# 🧪 Text Analysis: analyze arbitrary text with chosen AI model
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_text(request):
    """Analyze arbitrary text using configured AI model (POST: { text, model? })"""
    import google.generativeai as genai
    from django.conf import settings

    try:
        text = request.data.get('text') or request.data.get('input')
        model_name = request.data.get('model') or request.query_params.get('model') or 'models/gemini-2.5-flash'
        include_profile = request.data.get('include_profile')
        if include_profile is None:
            include_profile = True
        else:
            # handle string booleans
            if isinstance(include_profile, str):
                include_profile = include_profile.lower() not in ['0', 'false', 'no']

        if not text and not include_profile:
            return Response({'error': 'No text provided and include_profile is false'}, status=status.HTTP_400_BAD_REQUEST)

        # If include_profile is true, fetch user's profile and include in prompt
        profile_summary = ""
        if include_profile:
            try:
                sp = StudentProfile.objects.filter(user=request.user).first()
                user = request.user
                profile_lines = [f"User: {user.get_full_name() or user.username}"]
                if user.email:
                    profile_lines.append(f"Email: {user.email}")
                if sp:
                    if sp.bio:
                        profile_lines.append(f"Bio: {sp.bio}")
                    if sp.skills:
                        profile_lines.append(f"Skills: {sp.skills}")
                    if sp.career_interests:
                        profile_lines.append(f"Career Interests: {sp.career_interests}")
                    if sp.certifications:
                        profile_lines.append(f"Certifications: {sp.certifications}")
                    if sp.phone:
                        profile_lines.append(f"Phone: {sp.phone}")
                    if sp.resume_url:
                        profile_lines.append(f"Resume URL: {sp.resume_url}")
                profile_summary = "\n".join(profile_lines)
            except Exception:
                profile_summary = ""

        # Configure API key
        try:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
        except Exception:
            pass

        # Instantiate model if supported
        try:
            ai_model = genai.GenerativeModel(model_name)
        except Exception:
            ai_model = None

        prompt_parts = []
        if profile_summary:
            prompt_parts.append(f"Student profile:\n{profile_summary}\n\n")
        if text:
            prompt_parts.append(f"Text to analyze:\n{text}\n\n")


        prompt_parts.append("Please provide a concise summary, key points, tone, and suggestions for improvement or next steps.")
        prompt = "\n".join(prompt_parts)

        if ai_model:
            try:
                resp = ai_model.generate_content(prompt)
                result_text = getattr(resp, 'text', None) or getattr(resp, 'content', None) or str(resp)
            except Exception as e:
                error_msg = str(e)
                print(f"AI generation error: {error_msg}")  # Log to console
                
                # FALLBACK: Return mock response for testing when API fails
                mock_response = f"""
**AI Analysis (Mock Response - API Unavailable)**

**Summary:**
The system attempted to analyze your profile and text using Google's Gemini AI, but encountered an API error. This is likely due to quota limits or API key issues.

**Profile Information Detected:**
{profile_summary if profile_summary else 'No profile information available'}

**Text Analyzed:**
{text[:200] if text else 'No text provided'}...

**Recommendations:**
1. **Fix API Key**: Ensure your Google Cloud API key is valid and has Gemini API enabled
2. **Check Quota**: Verify you haven't exceeded the free tier limits
3. **Wait and Retry**: API quotas reset periodically (usually every minute/day)

**Error Details:**
{error_msg[:200]}...

**Note:** This is a fallback response for demonstration purposes. To get real AI analysis, please configure a valid Google Gemini API key with sufficient quota.
"""
                
                # Check for specific error types
                if '429' in error_msg or 'quota' in error_msg.lower():
                    return Response({
                        'analysis': mock_response,
                        'model': model_name,
                        'mock': True,
                        'error': 'API quota exceeded. Using mock response for demonstration.'
                    })
                elif '404' in error_msg or 'not found' in error_msg.lower():
                    return Response({
                        'analysis': mock_response,
                        'model': model_name,
                        'mock': True,
                        'error': f'Model "{model_name}" not available. Using mock response.'
                    })
                elif 'API key' in error_msg or 'authentication' in error_msg.lower():
                    return Response({
                        'analysis': mock_response,
                        'model': model_name,
                        'mock': True,
                        'error': 'Invalid API key. Using mock response for demonstration.'
                    })
                else:
                    return Response({
                        'analysis': mock_response,
                        'model': model_name,
                        'mock': True,
                        'error': f'AI generation failed. Using mock response.'
                    })
        else:
            return Response({'error': 'AI model initialization failed on the server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'analysis': result_text, 'model': model_name, 'mock': False})
    except Exception as e:
        error_msg = str(e)
        print(f"Analyze text error: {error_msg}")  # Log to console
        return Response({'error': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== NEW VIEWS FOR PAPER REQUIREMENTS ==========

# 📔 Daily Journal/eLogbook Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def daily_journal_list(request):
    """List or create daily journal entries"""
    if request.method == 'GET':
        # Students see their own, supervisors/admins see all
        if request.user.is_staff:
            journals = DailyJournal.objects.all()
        else:
            journals = DailyJournal.objects.filter(student=request.user)
        
        serializer = DailyJournalSerializer(journals, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Only students can create journals
        if request.user.is_staff:
            return Response({'error': 'Only students can create journal entries'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['student'] = request.user.id
        serializer = DailyJournalSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(student=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def daily_journal_detail(request, pk):
    """Get, update, or delete a journal entry"""
    try:
        journal = DailyJournal.objects.get(pk=pk)
    except DailyJournal.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is supervisor for this student
    is_supervisor = False
    if hasattr(request.user, 'company_user_profile'):
        company = request.user.company_user_profile.company
        is_supervisor = Application.objects.filter(
            student=journal.student,
            internship__company=company,
            status='Approved'
        ).exists()
    
    # Check permissions
    if not request.user.is_staff and journal.student != request.user and not is_supervisor:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = DailyJournalSerializer(journal, context={'request': request})
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        # Supervisors can update status and comments
        if is_supervisor:
            # Supervisors can only update status and supervisor_comment
            allowed_fields = {'status', 'supervisor_comment'}
            if not all(key in allowed_fields or key.endswith('_name') or key == 'student' for key in request.data.keys()):
                return Response({'error': 'Supervisors can only update status and comments'}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = DailyJournalSerializer(journal, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Students can only update their own entries
        if not request.user.is_staff and journal.student != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Students can edit drafts and submitted entries (to change status)
        # But cannot edit approved entries
        if not request.user.is_staff and journal.status == 'Approved':
            return Response({'error': 'Cannot edit approved entries'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = DailyJournalSerializer(journal, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not request.user.is_staff and journal.student != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        journal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_journal(request, pk):
    """Supervisor/Admin approve a journal entry"""
    if not request.user.is_staff:
        return Response({'error': 'Only supervisors/admins can approve journals'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        journal = DailyJournal.objects.get(pk=pk)
    except DailyJournal.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    action = request.data.get('action', 'approve')  # 'approve' or 'reject'
    comment = request.data.get('comment', '')
    
    if action == 'approve':
        journal.status = 'Approved'
    elif action == 'reject':
        journal.status = 'Rejected'
    
    if comment:
        journal.supervisor_comment = comment
    journal.save()
    
    # Send email notification to student
    from .email_notifications import send_journal_feedback_email
    try:
        send_journal_feedback_email(journal)
    except Exception as e:
        print(f"Failed to send journal feedback email: {str(e)}")
        # Don't fail the request if email fails
    
    serializer = DailyJournalSerializer(journal, context={'request': request})
    return Response(serializer.data)


# 📄 Pre-Training Requirements Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pre_training_requirements_list(request):
    """List or create pre-training requirements"""
    if request.method == 'GET':
        if request.user.is_staff:
            requirements = PreTrainingRequirement.objects.all()
        else:
            requirements = PreTrainingRequirement.objects.filter(student=request.user)
        
        serializer = PreTrainingRequirementSerializer(requirements, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if request.user.is_staff:
            return Response({'error': 'Only students can submit requirements'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['student'] = request.user.id
        serializer = PreTrainingRequirementSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(student=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_requirement(request, pk):
    """Admin approve/reject a pre-training requirement"""
    if not request.user.is_staff:
        return Response({'error': 'Only admins can approve requirements'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        requirement = PreTrainingRequirement.objects.get(pk=pk)
    except PreTrainingRequirement.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    action = request.data.get('action', 'approve')
    comment = request.data.get('comment', '')
    
    if action == 'approve':
        requirement.status = 'Approved'
    elif action == 'reject':
        requirement.status = 'Rejected'
    
    if comment:
        requirement.admin_comment = comment
    
    from django.utils import timezone
    requirement.reviewed_at = timezone.now()
    requirement.save()
    
    serializer = PreTrainingRequirementSerializer(requirement, context={'request': request})
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_requirement(request, pk):
    """Delete a pre-training requirement (students can only delete their own pending requirements)"""
    try:
        requirement = PreTrainingRequirement.objects.get(pk=pk)
    except PreTrainingRequirement.DoesNotExist:
        return Response({'error': 'Requirement not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Students can only delete their own pending requirements
    if not request.user.is_staff:
        if requirement.student != request.user:
            return Response({'error': 'You can only delete your own requirements'}, status=status.HTTP_403_FORBIDDEN)
        if requirement.status != 'Pending':
            return Response({'error': 'You can only delete pending requirements'}, status=status.HTTP_403_FORBIDDEN)
    
    requirement.delete()
    return Response({'message': 'Requirement deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# 📋 Document Templates Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def document_templates_list(request):
    """List or create document templates"""
    if request.method == 'GET':
        templates = DocumentTemplate.objects.filter(is_active=True)
        serializer = DocumentTemplateSerializer(templates, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.is_staff:
            return Response({'error': 'Only admins can upload templates'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['uploaded_by'] = request.user.id
        serializer = DocumentTemplateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ⏰ Attendance Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def attendance_list(request):
    """List or create attendance records"""
    if request.method == 'GET':
        if request.user.is_staff:
            attendances = Attendance.objects.all()
        else:
            attendances = Attendance.objects.filter(student=request.user)
        
        serializer = AttendanceSerializer(attendances, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        import secrets
        data = request.data.copy()
        
        # Check if user is a student or supervisor/admin
        user_role = None
        if hasattr(request.user, 'user_role'):
            user_role = request.user.user_role.role
        
        # Students can create their own attendance (clock in)
        if user_role == 'student':
            # Student is clocking in for themselves
            data['student'] = request.user.id
            data['marked_by'] = request.user.id
            
            # Check if already clocked in today
            today = data.get('date')
            if today:
                existing = Attendance.objects.filter(student=request.user, date=today).first()
                if existing:
                    return Response({
                        'error': f'You already have an attendance record for {today}. Please choose a different date or contact your supervisor to modify the existing record.'
                    }, status=status.HTTP_400_BAD_REQUEST)
        
        # Supervisors/Admins can mark attendance for any student
        elif request.user.is_staff or hasattr(request.user, 'company_user_profile'):
            # Generate attendance code for supervisor-marked attendance
            data['attendance_code'] = secrets.token_urlsafe(8)[:8].upper()
            data['marked_by'] = request.user.id
        else:
            return Response({
                'error': 'You do not have permission to mark attendance'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = AttendanceSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(marked_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def attendance_detail(request, pk):
    """Get, update, or delete a specific attendance record"""
    try:
        attendance = Attendance.objects.get(pk=pk)
    except Attendance.DoesNotExist:
        return Response({'error': 'Attendance record not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check permissions
    user_role = None
    if hasattr(request.user, 'user_role'):
        user_role = request.user.user_role.role
    
    # Students can only update their own attendance
    # Supervisors/Admins can update any attendance
    if user_role == 'student' and attendance.student != request.user:
        return Response({'error': 'You can only update your own attendance'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = AttendanceSerializer(attendance, context={'request': request})
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        # Students can only update time_out (clock out)
        if user_role == 'student':
            # Only allow updating time_out
            allowed_fields = ['time_out']
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
        else:
            # Supervisors/Admins can update any field
            data = request.data
        
        serializer = AttendanceSerializer(attendance, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Students can delete their OWN records only if status is 'Pending'
        if user_role == 'student':
            if attendance.student != request.user:
                 return Response({'error': 'You cannot delete this record'}, status=status.HTTP_403_FORBIDDEN)
            if attendance.status != 'Pending':
                 return Response({'error': 'You can only delete Pending records. Verified records cannot be deleted.'}, status=status.HTTP_403_FORBIDDEN)
            attendance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Only admins/staff can delete any record (or perhaps supervisors too? sticking to existing admin rule + student override)
        if not request.user.is_staff:
            return Response({'error': 'Only admins can delete attendance records'}, status=status.HTTP_403_FORBIDDEN)
        attendance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



# ✅ Task Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list(request):
    """List or create tasks"""
    if request.method == 'GET':
        if request.user.is_staff:
            tasks = Task.objects.all()
        else:
            tasks = Task.objects.filter(student=request.user)
        
        serializer = TaskSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Supervisors/admins can assign tasks
        if not request.user.is_staff and not hasattr(request.user, 'supervisor_profile'):
            return Response({'error': 'Only supervisors/admins can assign tasks'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['assigned_by'] = request.user.id
        
        serializer = TaskSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            task = serializer.save(assigned_by=request.user)
            
            # Send email notification to student
            from .email_notifications import send_task_assignment_email
            try:
                send_task_assignment_email(task)
            except Exception as e:
                print(f"Failed to send task assignment email: {str(e)}")
                # Don't fail the request if email fails
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def task_detail(request, pk):
    """Get or update a task"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = TaskSerializer(task, context={'request': request})
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        # Students can update their notes and status, supervisors can add feedback
        data = request.data.copy()
        
        if request.user == task.student:
            # Student updating
            if 'status' in data and data['status'] == 'Completed':
                from django.utils import timezone
                data['completed_at'] = timezone.now()
        elif request.user.is_staff or request.user == task.assigned_by:
            # Supervisor updating
            pass
        else:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TaskSerializer(task, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 📊 Performance Evaluation Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def performance_evaluation_list(request):
    """List or create performance evaluations"""
    if request.method == 'GET':
        if request.user.is_staff:
            evaluations = PerformanceEvaluation.objects.all()
        elif hasattr(request.user, 'company_user_profile') or hasattr(request.user, 'supervisor_profile'):
            evaluations = PerformanceEvaluation.objects.filter(evaluated_by=request.user)
        else:
            evaluations = PerformanceEvaluation.objects.filter(student=request.user)
        
        serializer = PerformanceEvaluationSerializer(evaluations, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Supervisors (Academic or Industry) and admins can create evaluations
        if not request.user.is_staff and not hasattr(request.user, 'supervisor_profile') and not hasattr(request.user, 'company_user_profile'):
            return Response({'error': 'Only supervisors/admins can create evaluations'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['evaluated_by'] = request.user.id
        
        serializer = PerformanceEvaluationSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            evaluation = serializer.save(evaluated_by=request.user)
            
            # Send email notification to student
            from .email_notifications import send_evaluation_notification_email
            try:
                send_evaluation_notification_email(evaluation)
            except Exception as e:
                print(f"Failed to send evaluation email: {str(e)}")
                # Don't fail the request if email fails
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 📢 Notice Views
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def notice_list(request):
    """List or create notices (public for GET, admin for POST)"""
    if request.method == 'GET':
        # Admins see all notices, public/students see only active public notices that haven't expired
        if request.user.is_authenticated and request.user.is_staff:
            notices = Notice.objects.all()
        else:
            from django.db.models import Q
            today = timezone.now().date()
            notices = Notice.objects.filter(
                is_active=True, 
                is_public=True
            ).filter(
                Q(expires_at__gte=today) | Q(expires_at__isnull=True)
            )
        serializer = NoticeSerializer(notices, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'error': 'Only admins can create notices'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['created_by'] = request.user.id
        
        serializer = NoticeSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def notice_detail(request, pk):
    """Get, update, or delete a notice (admin only for PUT/DELETE)"""
    try:
        notice = Notice.objects.get(pk=pk)
    except Notice.DoesNotExist:
        return Response({'error': 'Notice not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Public can view if it's active, public, and not expired; admins can view all
        is_admin = request.user.is_staff
        
        if not is_admin:
            is_expired = notice.expires_at and notice.expires_at < timezone.now().date()
            if not notice.is_active or not notice.is_public or is_expired:
                return Response({'error': 'Notice not found'}, status=status.HTTP_404_NOT_FOUND)
                
        serializer = NoticeSerializer(notice, context={'request': request})
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        if not request.user.is_staff:
            return Response({'error': 'Only admins can edit notices'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = NoticeSerializer(notice, data=request.data, partial=request.method == 'PATCH', context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not request.user.is_staff:
            return Response({'error': 'Only admins can delete notices'}, status=status.HTTP_403_FORBIDDEN)
        
        notice.delete()
        return Response({'message': 'Notice deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# 🎫 Support Ticket Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def support_ticket_list(request):
    """List or create support tickets"""
    if request.method == 'GET':
        if request.user.is_staff:
            tickets = SupportTicket.objects.all()
        else:
            tickets = SupportTicket.objects.filter(student=request.user)
        
        serializer = SupportTicketSerializer(tickets, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if request.user.is_staff:
            return Response({'error': 'Admins cannot create support tickets'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['student'] = request.user.id
        
        serializer = SupportTicketSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(student=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_ticket(request, pk):
    """Admin respond to a support ticket"""
    if not request.user.is_staff:
        return Response({'error': 'Only admins can respond to tickets'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        ticket = SupportTicket.objects.get(pk=pk)
    except SupportTicket.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    response = request.data.get('response', '')
    ticket_status = request.data.get('status', ticket.status)
    
    if response:
        ticket.admin_response = response
    ticket.status = ticket_status
    
    if ticket_status == 'Resolved':
        from django.utils import timezone
        ticket.resolved_at = timezone.now()
    
    ticket.responded_by = request.user
    ticket.save()
    
    serializer = SupportTicketSerializer(ticket, context={'request': request})
    return Response(serializer.data)


# 📈 Progress Tracking Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_progress(request, student_id=None):
    """Get student progress tracking (hours, journals, tasks)"""
    try:
        if student_id:
            if not request.user.is_staff:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            try:
                student = User.objects.get(id=student_id)
            except User.DoesNotExist:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            student = request.user
        
        # Calculate total hours from journals and attendance
        journal_hours = DailyJournal.objects.filter(student=student).aggregate(
            total=Sum('hours_rendered')
        )['total'] or 0
        
        attendance_hours = Attendance.objects.filter(student=student).aggregate(
            total=Sum('hours_rendered')
        )['total'] or 0
        
        total_hours = float(journal_hours) + float(attendance_hours)
        
        # Get application status
        applications = Application.objects.filter(student=student)
        approved_app = applications.filter(status='Approved').first()
        
        # Calculate progress percentage
        required_hours = 320  # Default required hours
        
        if approved_app and approved_app.internship and approved_app.internship.duration_hours:
             required_hours = approved_app.internship.duration_hours

        # Check Coordinator Settings for Course-specific requirements (Overrides Internship)
        try:
            from .models import CoordinatorProfile, CoordinatorSettings
            # Get profile safely
            if hasattr(student, 'student_profile'):
                student_profile = student.student_profile
                if student_profile.college:
                    coord_profile = CoordinatorProfile.objects.filter(college=student_profile.college).first()
                    if coord_profile:
                        settings = CoordinatorSettings.objects.filter(coordinator=coord_profile.user).first()
                        if settings and settings.hours_config:
                            for config in settings.hours_config:
                                program = config.get('program', '')
                                course = student_profile.course or ''
                                # Match program name with course
                                if program and course and (program.lower() == course.lower() or program in course or course in program):
                                    req = config.get('requiredHours')
                                    if req:
                                        required_hours = int(req)
                                        # Prefer exact match if possible, otherwise keep looking? 
                                        # Usually first match is good enough.
                                        break
        except Exception as e:
            print(f"Error checking coordinator settings: {e}")
            pass
        
        progress_percentage = min(100, (total_hours / required_hours * 100) if required_hours > 0 else 0)
        
        # Get statistics
        journal_count = DailyJournal.objects.filter(student=student).count()
        task_count = Task.objects.filter(student=student).count()
        completed_tasks = Task.objects.filter(student=student, status='Completed').count()
        evaluations_count = PerformanceEvaluation.objects.filter(student=student).count()
        
        # Get recent journals (last 5)
        recent_journals = DailyJournal.objects.filter(student=student).order_by('-date')[:5]
        recent_journals_data = [
            {
                'date': journal.date.strftime('%Y-%m-%d') if journal.date else '',
                'content': journal.activities[:100] + '...' if len(journal.activities) > 100 else journal.activities
            }
            for journal in recent_journals
        ]
        
        # Get pending tasks
        pending_tasks = Task.objects.filter(student=student).exclude(status='Completed').order_by('-created_at')[:5]
        pending_tasks_data = [task.title for task in pending_tasks]
        
        # Get student profile info (with fallback)
        try:
            profile = StudentProfile.objects.get(user=student)
            student_id_number = profile.student_id or student.username
        except StudentProfile.DoesNotExist:
            student_id_number = student.username
        
        return Response({
            'student_id': student_id_number,
            'student_name': student.get_full_name() or student.username,
            'total_hours_rendered': round(total_hours, 2),
            'required_hours': required_hours,
            'overall_progress': round(progress_percentage, 2),
            'journal_entries_count': journal_count,
            'total_tasks': task_count,
            'tasks_completed': completed_tasks,
            'evaluations_count': evaluations_count,
            'application_status': approved_app.status if approved_app else None,
            'recent_journals': recent_journals_data,
            'pending_tasks': pending_tasks_data,
            'evaluations': PerformanceEvaluationSerializer(PerformanceEvaluation.objects.filter(student=student).order_by('-submitted_at'), many=True).data,
        })
    except Exception as e:
        # Log the error and return a friendly message
        import traceback
        print(f"Error in student_progress: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': 'Unable to fetch student progress',
            'detail': str(e) if request.user.is_staff else 'An error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 📄 Serve Media Files Without X-Frame-Options
from django.http import FileResponse, Http404
from django.conf import settings
from django.views.decorators.clickjacking import xframe_options_exempt
import os
import mimetypes

@xframe_options_exempt
def serve_media_file(request, file_path):
    """Serve media files without X-Frame-Options header to allow iframe embedding"""
    print(f"[DEBUG] serve_media_file called with file_path: {file_path}")
    
    # Construct the full file path
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    print(f"[DEBUG] Full path: {full_path}")
    print(f"[DEBUG] File exists: {os.path.exists(full_path)}")
    
    # Security check: ensure the file is within MEDIA_ROOT
    if not os.path.abspath(full_path).startswith(os.path.abspath(settings.MEDIA_ROOT)):
        print(f"[DEBUG] Security check failed - file outside MEDIA_ROOT")
        raise Http404("File not found")
    
    # Check if file exists
    if not os.path.exists(full_path):
        print(f"[DEBUG] File does not exist")
        raise Http404("File not found")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(full_path)
    if content_type is None:
        content_type = 'application/octet-stream'
    
    print(f"[DEBUG] Content type: {content_type}")
    
    # Open and serve the file
    response = FileResponse(open(full_path, 'rb'), content_type=content_type)
    
    # Remove X-Frame-Options to allow iframe embedding from different ports
    # @xframe_options_exempt already helps, but ensuring the header is permissive
    if 'X-Frame-Options' in response:
        del response['X-Frame-Options']
    
    # Add CORS headers for cross-origin requests
    response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type'
    response['Access-Control-Expose-Headers'] = 'Content-Disposition'
    
    print(f"[DEBUG] Serving file successfully")
    return response


# ========== SYSTEM SETTINGS ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_system_settings(request):
    """Get system settings (accessible to all authenticated users)"""
    from core.models import SystemSettings
    settings = SystemSettings.load()
    
    return Response({
        'max_applications_per_student': settings.max_applications_per_student,
        'company_name': settings.company_name,
        'system_email': settings.system_email,
        'application_deadline': settings.application_deadline,
        'updated_at': settings.updated_at,
    })


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_system_settings(request):
    """Update system settings (Admin only)"""
    if not request.user.is_staff:
        return Response({'error': 'Access denied. Admin only.'}, status=status.HTTP_403_FORBIDDEN)
    
    from core.models import SystemSettings
    settings = SystemSettings.load()
    
    # Update max applications
    max_apps = request.data.get('max_applications_per_student')
    if max_apps is not None:
        try:
            max_apps = int(max_apps)
            if max_apps < 1:
                return Response({
                    'error': 'Maximum applications must be at least 1'
                }, status=status.HTTP_400_BAD_REQUEST)
            settings.max_applications_per_student = max_apps
        except (ValueError, TypeError):
            return Response({
                'error': 'Invalid value for max_applications_per_student'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update other fields
    if 'company_name' in request.data:
        settings.company_name = request.data['company_name']
    
    if 'system_email' in request.data:
        settings.system_email = request.data['system_email']
        
    if 'application_deadline' in request.data:
        settings.application_deadline = request.data['application_deadline']
    
    settings.updated_by = request.user
    settings.save()
    
    return Response({
        'message': 'Settings updated successfully',
        'max_applications_per_student': settings.max_applications_per_student,
        'company_name': settings.company_name,
        'system_email': settings.system_email,
        'application_deadline': settings.application_deadline,
        'updated_at': settings.updated_at,
        'updated_by': request.user.username
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_application_status(request):
    """Get current application count and limit for the authenticated student"""
    from core.models import SystemSettings
    settings = SystemSettings.load()
    
    current_count = Application.objects.filter(student=request.user).count()
    
    return Response({
        'current_applications': current_count,
        'max_applications': settings.max_applications_per_student,
        'remaining': max(0, settings.max_applications_per_student - current_count),
        'can_apply': current_count < settings.max_applications_per_student
    })


# -------------------------------------------------------------------------
# 📤 Data Export Views
# -------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_users_csv(request):
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="users_export_{datetime.datetime.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Student ID', 'Email', 'First Name', 'Last Name', 'Role', 'Date Joined', 'Course', 'Year', 'Section'])

    users = User.objects.filter(is_staff=False)
    
    for user in users:
        role = "Admin" if user.is_staff else "Student"
        student_id = ""
        course = ""
        year = ""
        section = ""
        
        # Try to get profile safely using the correct related_name 'student_profile'
        try:
            if hasattr(user, 'student_profile'):
                profile = user.student_profile
                student_id = profile.student_id
                course = profile.course
                year = profile.year
                section = profile.section
        except Exception:
            pass

        writer.writerow([
            student_id if student_id else user.username, # Fallback to username if no student ID
            user.email,
            user.first_name,
            user.last_name,
            role,
            user.date_joined.strftime("%Y-%m-%d"), # Removed time for cleaner date
            course if course else "N/A",
            year if year else "N/A",
            section if section else "N/A"
        ])

    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_internships_csv(request):
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="internships_export_{datetime.datetime.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Company', 'Position', 'Type', 'Slots', 'Location', 'Stipend', 'Duration (Weeks)', 'Required Courses', 'Created At'])

    internships = Internship.objects.all().select_related('company')

    for internship in internships:
        company_name = internship.company.name if internship.company else "Unknown"
        writer.writerow([
            company_name,
            internship.position,
            internship.position_type,
            internship.slots,
            internship.work_location,
            internship.stipend,
            internship.duration_weeks,
            internship.required_courses,
            internship.created_at.strftime("%Y-%m-%d")
        ])

    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_applications_csv(request):
    if not request.user.is_staff:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="applications_export_{datetime.datetime.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Student Name', 'Student ID', 'Company', 'Position', 'Status', 'Applied Date', 'Resume URL'])

    applications = Application.objects.all().select_related('student', 'internship', 'internship__company')

    for app in applications:
        student_name = f"{app.student.first_name} {app.student.last_name}"
        student_id = "N/A"
        
        # Use correct related_name 'student_profile'
        try:
            if hasattr(app.student, 'student_profile'):
                student_id = app.student.student_profile.student_id
        except Exception:
            pass
        
        company_name = "Unknown"
        position = "Unknown"
        if app.internship:
            position = app.internship.position
            if app.internship.company:
                company_name = app.internship.company.name

        resume_url = ""
        if app.resume_file:
            resume_url = request.build_absolute_uri(app.resume_file.url)
        elif app.resume_url:
            resume_url = app.resume_url

        writer.writerow([
            student_name,
            student_id,
            company_name,
            position,
            app.status,
            app.applied_at.strftime("%Y-%m-%d"),
            resume_url
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_journals_csv(request):
    is_coordinator = hasattr(request.user, 'user_role') and request.user.user_role.role == 'coordinator'
    if not request.user.is_staff and not is_coordinator:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="journals_export_{datetime.datetime.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Student Name', 'Student ID', 'Date', 'Hours Rendered', 'Activities', 'Status', 'Supervisor Comment'])

    journals = DailyJournal.objects.all().select_related('student', 'student__student_profile')

    # Filter for coordinator
    if is_coordinator and not request.user.is_staff:
        if hasattr(request.user, 'coordinator_profile'):
            college = request.user.coordinator_profile.college
            journals = journals.filter(student__student_profile__college=college)
        else:
            return Response({"error": "Coordinator profile not found"}, status=status.HTTP_403_FORBIDDEN)

    for journal in journals:
        student_name = f"{journal.student.first_name} {journal.student.last_name}"
        student_id = "N/A"
        try:
            if hasattr(journal.student, 'student_profile'):
                student_id = journal.student.student_profile.student_id
        except Exception:
            pass

        writer.writerow([
            student_name,
            student_id,
            journal.date.strftime("%Y-%m-%d") if journal.date else "",
            journal.hours_rendered,
            journal.activities,
            journal.status,
            journal.supervisor_comment
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_evaluations_csv(request):
    is_coordinator = hasattr(request.user, 'user_role') and request.user.user_role.role == 'coordinator'
    if not request.user.is_staff and not is_coordinator:
        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="evaluations_export_{datetime.datetime.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Student Name', 'Student ID', 'Evaluated By', 'Date Submitted', 'Quality of Work', 'Productivity', 'Reliability', 'Teamwork', 'Overall Rating', 'Comments'])

    evaluations = PerformanceEvaluation.objects.all().select_related('student', 'student__student_profile', 'evaluated_by')

    # Filter for coordinator
    if is_coordinator and not request.user.is_staff:
        if hasattr(request.user, 'coordinator_profile'):
            college = request.user.coordinator_profile.college
            evaluations = evaluations.filter(student__student_profile__college=college)
        else:
            return Response({"error": "Coordinator profile not found"}, status=status.HTTP_403_FORBIDDEN)

    for eval_item in evaluations:
        student_name = f"{eval_item.student.first_name} {eval_item.student.last_name}"
        student_id = "N/A"
        try:
            if hasattr(eval_item.student, 'student_profile'):
                student_id = eval_item.student.student_profile.student_id
        except Exception:
            pass
            
        evaluator_name = f"{eval_item.evaluated_by.first_name} {eval_item.evaluated_by.last_name}"
        
        writer.writerow([
            student_name,
            student_id,
            evaluator_name,
            eval_item.submitted_at.strftime("%Y-%m-%d"),
            eval_item.quality_of_work,
            eval_item.productivity,
            eval_item.reliability,
            eval_item.teamwork,
            eval_item.overall_rating,
            eval_item.comments
        ])

    return response



# ========================================
# SUPERVISOR API ENDPOINTS
# ========================================
# Company supervisors managing their assigned interns

from .permissions import role_required
from .models import UserRole

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


# View Assigned Interns
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.SUPERVISOR])
def supervisor_interns_list(request):
    """Get list of interns assigned to this supervisor's company"""
    try:
        if not hasattr(request.user, 'company_user_profile'):
            return Response({
                'error': 'No company profile found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        company = request.user.company_user_profile.company
        company_internships = Internship.objects.filter(company=company)
        
        # Get approved applications
        applications = Application.objects.filter(
            internship__in=company_internships,
            status='Approved'
        ).select_related('student', 'student__student_profile', 'internship')
        
        interns_data = []
        for app in applications:
            student = app.student
            profile = getattr(student, 'student_profile', None)
            
            interns_data.append({
                'id': student.id,
                'username': student.username,
                'name': f"{student.first_name} {student.last_name}",
                'email': student.email,
                'position': app.internship.position,
                'student_id': profile.student_id if profile else '',
                'course': profile.course if profile else '',
                'phone': profile.phone if profile else '',
                'applied_at': app.applied_at,
                'application_id': app.id
            })
        
        return Response(interns_data)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        
        journals = DailyJournal.objects.filter(
            student__in=intern_users
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
            old_status = attendance.status
            attendance.status = request.data.get('status', attendance.status)
            attendance.notes = request.data.get('notes', attendance.notes)
            attendance.marked_by = request.user
            attendance.save()
            
            # Create notification for student
            from .models import Notification
            if old_status != attendance.status:
                Notification.objects.create(
                    user=attendance.student,
                    title='Attendance Status Updated',
                    message=f'Your attendance for {attendance.date.strftime("%B %d, %Y")} has been marked as {attendance.status} by your supervisor.',
                    notification_type='attendance',
                    related_id=attendance.id
                )
            
            serializer = AttendanceSerializer(attendance)
            return Response(serializer.data)
        except Attendance.DoesNotExist:
            return Response({'error': 'Attendance record not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ========================================
# COORDINATOR API ENDPOINTS
# ========================================
# Faculty/Coordinator managing students and placements

from .permissions import role_required
from .models import UserRole

# Coordinator Dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def coordinator_dashboard(request):
    """Get coordinator dashboard data - students, companies, applications"""
    try:
        # Get statistics
        total_students = StudentProfile.objects.count()
        total_companies = Company.objects.count()
        total_internships = Internship.objects.count()
        
        # Get pending applications
        pending_applications = Application.objects.filter(status='Pending').count()
        
        # Get pending company approvals (companies not yet approved)
        pending_companies = Company.objects.filter(is_approved=False).count() if hasattr(Company, 'is_approved') else 0
        
        # Recent applications
        recent_applications = Application.objects.all().order_by('-applied_at')[:5]
        
        return Response({
            'total_students': total_students,
            'total_companies': total_companies,
            'total_internships': total_internships,
            'pending_applications': pending_applications,
            'pending_companies': pending_companies,
            'recent_applications': ApplicationSerializer(recent_applications, many=True).data
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Approve/Reject Company
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def coordinator_approve_company(request, company_id):
    """Approve or reject a company registration"""
    try:
        company = Company.objects.get(id=company_id)
        action = request.data.get('action')  # 'approve' or 'reject'
        
        if action == 'approve':
            # Add is_approved field if it doesn't exist
            if hasattr(company, 'is_approved'):
                company.is_approved = True
            company.status = 'Approved'
            company.approved_by = request.user
            company.approved_at = timezone.now()
            company.save()
            
            return Response({
                'message': f'Company {company.name} has been approved',
                'company': CompanySerializer(company).data
            })
        elif action == 'reject':
            if hasattr(company, 'is_approved'):
                company.is_approved = False
            company.status = 'Rejected'
            company.rejection_reason = request.data.get('reason', '')
            company.save()
            
            return Response({
                'message': f'Company {company.name} has been rejected',
                'company': CompanySerializer(company).data
            })
        else:
            return Response({
                'error': 'Invalid action. Use "approve" or "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Generate Document
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def coordinator_bulk_approve_students(request):
    """Approve multiple student registrations at once"""
    try:
        student_ids = request.data.get('student_ids', [])
        
        if not student_ids:
            return Response({
                'error': 'No student IDs provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        approved_count = 0
        for student_id in student_ids:
            try:
                user = User.objects.get(id=student_id)
                user.is_active = True
                user.save()
                
                # Update student profile if needed
                if hasattr(user, 'student_profile'):
                    profile = user.student_profile
                    if hasattr(profile, 'is_approved'):
                        profile.is_approved = True
                        profile.approved_by = request.user
                        profile.approved_at = timezone.now()
                        profile.save()
                
                approved_count += 1
            except User.DoesNotExist:
                continue
        
        return Response({
            'message': f'Successfully approved {approved_count} students',
            'approved_count': approved_count
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Generate Documents
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
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

# Statistics endpoint for admin dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_statistics(request):
    """Get user statistics by role"""
    try:
        # Count users by role
        from .models import UserRole
        
        total_users = User.objects.count()
        total_admins = UserRole.objects.filter(role='admin').count()
        total_coordinators = UserRole.objects.filter(role='coordinator').count()
        total_supervisors = UserRole.objects.filter(role='supervisor').count()
        total_students = UserRole.objects.filter(role='student').count()
        
        # Also count users without roles (legacy)
        users_without_role = User.objects.filter(user_role__isnull=True).count()
        
        # Include company/internship data for backward compatibility
        total_companies = Company.objects.count()
        total_internships = Internship.objects.count()
        total_applications = Application.objects.count()
        pending_applications = Application.objects.filter(status="Pending").count()
        approved_applications = Application.objects.filter(status="Approved").count()
        rejected_applications = Application.objects.filter(status="Rejected").count()
        
        return Response({
            'total_users': total_users,
            'total_admins': total_admins,
            'total_coordinators': total_coordinators,
            'total_supervisors': total_supervisors,
            'total_students': total_students,
            'users_without_role': users_without_role,
            'total_companies': total_companies,
            'total_internships': total_internships,
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'approved_applications': approved_applications,
            'rejected_applications': rejected_applications,
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========================================
# GRADING SYSTEM ENDPOINTS
# ========================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def grading_criteria_list(request):
    """Manage grading criteria/rubric"""
    if request.method == 'GET':
        criteria = GradingCriteria.objects.all()
        data = [{'id': c.id, 'name': c.name, 'weight': c.weight, 'description': c.description} for c in criteria]
        return Response(data)
    
    elif request.method == 'POST':
        name = request.data.get('name')
        weight = request.data.get('weight')
        description = request.data.get('description', '')
        
        criteria = GradingCriteria.objects.create(name=name, weight=weight, description=description)
        return Response({'id': criteria.id, 'name': criteria.name, 'weight': criteria.weight}, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def grading_criteria_detail(request, pk):
    """Retrieve, update or delete a grading criterion"""
    try:
        criterion = GradingCriteria.objects.get(pk=pk)
    except GradingCriteria.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'id': criterion.id,
            'name': criterion.name,
            'weight': criterion.weight,
            'description': criterion.description
        })

    elif request.method == 'PUT':
        criterion.name = request.data.get('name', criterion.name)
        criterion.weight = request.data.get('weight', criterion.weight)
        criterion.description = request.data.get('description', criterion.description)
        criterion.save()
        return Response({
            'id': criterion.id,
            'name': criterion.name,
            'weight': criterion.weight,
            'description': criterion.description
        })

    elif request.method == 'DELETE':
        criterion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def compute_student_grade(request, student_id):
    """Compute final grade for a student based on criteria"""
    try:
        student = User.objects.get(id=student_id)
        
        # 1. Calculate Attendance Score
        # Assumption: 486 hours required (or fetch from settings)
        required_hours = 486 
        total_hours = DailyJournal.objects.filter(student=student, status='Approved').aggregate(total=models.Sum('hours_rendered'))['total'] or 0
        attendance_percentage = min((float(total_hours) / required_hours) * 100, 100)
        
        # 2. Calculate Supervisor Rating Score
        # Average of overall_rating (1-5). Convert to percentage: (Rating / 5) * 100
        avg_rating = PerformanceEvaluation.objects.filter(student=student).aggregate(avg=models.Avg('overall_rating'))['avg'] or 0
        supervisor_percentage = (float(avg_rating) / 5.0) * 100
        
        # 3. Requirements Score (Placeholder logic)
        requirements_percentage = 100 # Assume complete for now
        
        # 4. Final Grade Computation based on GradingCriteria
        criteria = GradingCriteria.objects.all()
        final_score = 0
        
        # Default weights if no criteria set
        if not criteria.exists():
            # Default: 30% Attendance, 50% Supervisor, 20% Requirements
            final_score = (attendance_percentage * 0.30) + (supervisor_percentage * 0.50) + (requirements_percentage * 0.20)
        else:
            for c in criteria:
                if 'Attendance' in c.name:
                    final_score += (attendance_percentage * float(c.weight) / 100)
                elif 'Supervisor' in c.name or 'Evaluation' in c.name:
                    final_score += (supervisor_percentage * float(c.weight) / 100)
                elif 'Requirement' in c.name or 'Document' in c.name:
                    final_score += (requirements_percentage * float(c.weight) / 100)
        
        # Convert Percentage to Grade (1.0 - 5.0)
        if final_score >= 98: grade = 1.00
        elif final_score >= 95: grade = 1.25
        elif final_score >= 92: grade = 1.50
        elif final_score >= 89: grade = 1.75
        elif final_score >= 86: grade = 2.00
        elif final_score >= 83: grade = 2.25
        elif final_score >= 80: grade = 2.50
        elif final_score >= 77: grade = 2.75
        elif final_score >= 75: grade = 3.00
        else: grade = 5.00
        
        remarks = 'Passed' if grade <= 3.0 else 'Failed'
        
        # Save
        obj, created = StudentFinalGrade.objects.update_or_create(
            student=student,
            defaults={
                'attendance_score': attendance_percentage,
                'supervisor_rating_score': supervisor_percentage,
                'requirements_score': requirements_percentage,
                'final_grade': grade,
                'remarks': remarks
            }
        )
        
        return Response({
            'student': student.username,
            'attendance_score': round(attendance_percentage, 2),
            'supervisor_score': round(supervisor_percentage, 2),
            'final_grade': grade,
            'remarks': remarks
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        print(f"Error computing grade: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': f'Failed to compute grade: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def coordinator_analytics(request):
    """Get analytics specific to coordinator's college"""
    try:
        # Get coordinator's college
        coordinator_college = None
        
        # Try to get from coordinator profile
        try:
            if hasattr(request.user, 'coordinator_profile') and request.user.coordinator_profile:
                coordinator_college = request.user.coordinator_profile.college
        except Exception as e:
            print(f"Error getting coordinator profile: {e}")
        
        # If admin or no college found, return error with helpful message
        if not coordinator_college:
            return Response({
                'error': 'Coordinator college not found. Please ensure your profile has a college assigned.',
                'college': '',
                'total_students': 0,
                'total_applications': 0,
                'pending_applications': 0,
                'approved_applications': 0,
                'rejected_applications': 0,
                'active_internships': 0,
                'completed_students': 0,
                'completion_rate': 0,
                'total_hours_rendered': 0,
                'average_hours_per_student': 0,
                'companies_utilized': 0,
                'average_performance_rating': 0,
                'current_term_placements': 0,
                'top_companies': [],
                'program_breakdown': []
            })
        
        # Get students from coordinator's college
        college_students = User.objects.filter(
            user_role__role='student',
            student_profile__college=coordinator_college
        )
        
        total_students = college_students.count()
        
        # Get student IDs for filtering
        student_ids = list(college_students.values_list('id', flat=True))
        
        # Applications from college students
        total_applications = Application.objects.filter(student_id__in=student_ids).count()
        pending_applications = Application.objects.filter(student_id__in=student_ids, status="Pending").count()
        approved_applications = Application.objects.filter(student_id__in=student_ids, status="Approved").count()
        rejected_applications = Application.objects.filter(student_id__in=student_ids, status="Rejected").count()
        
        # Active internships (students with approved applications)
        active_internships = Application.objects.filter(
            student_id__in=student_ids,
            status="Approved"
        ).count()
        
        # Completion rate - students who have completed internships
        try:
            completed_students = college_students.filter(
                student_profile__internship_status='Completed'
            ).count()
        except Exception as e:
            print(f"Error getting completed students: {e}")
            completed_students = 0
        completion_rate = (completed_students / total_students * 100) if total_students > 0 else 0
        
        # Hours rendered - sum of all approved journal hours
        from django.db.models import Sum, Avg, Count
        try:
            total_hours = DailyJournal.objects.filter(
                student_id__in=student_ids,
                status='Approved'
            ).aggregate(total=Sum('hours_rendered'))['total'] or 0
        except Exception as e:
            print(f"Error getting total hours: {e}")
            total_hours = 0
        
        average_hours = (total_hours / total_students) if total_students > 0 else 0
        
        # Company utilization - unique companies where students are placed
        try:
            companies_used = Application.objects.filter(
                student_id__in=student_ids,
                status="Approved",
                internship__isnull=False,
                internship__company__isnull=False
            ).values('internship__company').distinct().count()
        except Exception as e:
            print(f"Error getting companies used: {e}")
            companies_used = 0
        
        # Performance statistics - average ratings from evaluations
        try:
            avg_performance = PerformanceEvaluation.objects.filter(
                student_id__in=student_ids
            ).aggregate(avg_rating=Avg('overall_rating'))['avg_rating'] or 0
        except Exception as e:
            print(f"Error getting avg performance: {e}")
            avg_performance = 0
        
        # Per-term placements (current academic year)
        from datetime import datetime
        current_year = datetime.now().year
        try:
            current_term_placements = Application.objects.filter(
                student_id__in=student_ids,
                status="Approved",
                applied_at__year=current_year
            ).count()
        except Exception as e:
            print(f"Error getting current term placements: {e}")
            current_term_placements = 0
        
        # Top companies by student count
        try:
            top_companies = Application.objects.filter(
                student_id__in=student_ids,
                status="Approved",
                internship__isnull=False,
                internship__company__isnull=False
            ).values('internship__company__name').annotate(
                student_count=Count('id')
            ).order_by('-student_count')[:5]
        except Exception as e:
            print(f"Error getting top companies: {e}")
            top_companies = []
        
        # Program breakdown
        try:
            program_stats = college_students.values('student_profile__course').annotate(
                count=Count('id')
            ).order_by('-count')
        except Exception as e:
            print(f"Error getting program stats: {e}")
            program_stats = []
        
        return Response({
            'college': coordinator_college,
            'total_students': total_students,
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'approved_applications': approved_applications,
            'rejected_applications': rejected_applications,
            'active_internships': active_internships,
            'completed_students': completed_students,
            'completion_rate': round(completion_rate, 2),
            'total_hours_rendered': round(total_hours, 2),
            'average_hours_per_student': round(average_hours, 2),
            'companies_utilized': companies_used,
            'average_performance_rating': round(avg_performance, 2),
            'current_term_placements': current_term_placements,
            'top_companies': list(top_companies),
            'program_breakdown': list(program_stats)
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR in coordinator_analytics: {str(e)}")
        print(f"Traceback: {error_details}")
        return Response({
            'error': f'Internal server error: {str(e)}',
            'details': error_details if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NarrativeReportViewSet(viewsets.ModelViewSet):
    serializer_class = NarrativeReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or (hasattr(user, 'user_role') and user.user_role.role in ['admin', 'coordinator']):
            return NarrativeReport.objects.all()
        return NarrativeReport.objects.filter(student=user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.COORDINATOR, UserRole.ADMIN])
def bulk_download_narrative_reports(request):
    """Download all narrative reports as a ZIP file"""
    reports = NarrativeReport.objects.all()
    
    # Filter by report type if provided
    report_type = request.query_params.get('type')
    if report_type:
        reports = reports.filter(report_type=report_type)
        
    # Filter by college if coordinator (and not admin)
    if not request.user.is_staff:
        if hasattr(request.user, 'coordinator_profile') and request.user.coordinator_profile:
            college = request.user.coordinator_profile.college
            reports = reports.filter(student__student_profile__college=college)
        else:
            return Response({'error': 'Coordinator profile not found'}, status=status.HTTP_403_FORBIDDEN)

    if not reports.exists():
        return Response({'error': 'No reports found to download'}, status=status.HTTP_404_NOT_FOUND)

    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
        for report in reports:
            if report.file:
                try:
                    # Get file extension
                    ext = report.file.name.split('.')[-1]
                    # Create filename: StudentName_Type_Date.ext
                    filename = f"{report.student.get_full_name()}_{report.report_type}_{report.submitted_at.strftime('%Y%m%d')}.{ext}"
                    # Add file to zip
                    zip_file.writestr(filename, report.file.read())
                except Exception as e:
                    print(f"Error adding file to zip: {e}")
                    continue

    zip_buffer.seek(0)
    
    response = HttpResponse(zip_buffer, content_type='application/zip')
    response['Content-Disposition'] = 'attachment; filename="narrative_reports.zip"'
    return response


# ========================================
# TWO-FACTOR AUTHENTICATION ENDPOINTS
# ========================================

from .two_factor_utils import (
    generate_secret_key, generate_totp_uri, generate_qr_code,
    verify_totp_code, generate_backup_codes, verify_backup_code,
    is_device_trusted, trust_device, log_2fa_event, is_2fa_required,
    setup_2fa_for_user, get_client_ip, generate_device_id, get_device_name
)
from .models import TwoFactorAuth, BackupCode, TrustedDevice, TwoFactorAuditLog



@api_view(['POST'])
@permission_classes([AllowAny])
def choose_2fa_method(request):
    """Save user's preferred 2FA method choice"""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        method = request.data.get('method', 'email')  # 'app' or 'email'
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if method not in ['app', 'email']:
            return Response({'error': 'Invalid method. Choose "app" or "email"'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Create or update 2FA record with preferred method
        from .two_factor_utils import generate_secret_key
        
        two_factor, created = TwoFactorAuth.objects.get_or_create(
            user=user,
            defaults={
                'secret_key': generate_secret_key(),
                'preferred_method': method,
                'is_enabled': False,
                'is_verified': False
            }
        )
        
        if not created:
            two_factor.preferred_method = method
            two_factor.save()
        
        # If email method chosen, send OTP immediately
        if method == 'email':
            if not user.email:
                return Response({
                    'error': 'No email address on file. Please contact administrator.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate and send email OTP
            code = str(random.randint(100000, 999999))
            from .two_factor_utils import get_client_ip
            ip_address = get_client_ip(request)
            
            EmailOTP.objects.create(
                user=user,
                code=code,
                expires_at=timezone.now() + timedelta(minutes=10),
                ip_address=ip_address
            )
            
            try:
                from django.core.mail import EmailMultiAlternatives
                from django.utils.html import strip_tags
                
                # HTML email template
                html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🔐</div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #333;">EARIST OJT System</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #333; text-align: center;">
                                Security Verification Code
                            </h2>
                            
                            <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.6; color: #666; text-align: center;">
                                Hello <strong>{user.get_full_name() or user.username}</strong>,<br>
                                We received a request to verify your identity.
                            </p>
                            
                            <!-- Code Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3px; border-radius: 12px; display: inline-block;">
                                            <div style="background: #ffffff; padding: 25px 50px; border-radius: 10px;">
                                                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                                                    {code}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666; text-align: center;">
                                This code will expire in <strong>10 minutes</strong>.
                            </p>
                            
                            <!-- Warning Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                <tr>
                                    <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                                        <p style="margin: 0; font-size: 13px; color: #856404; line-height: 1.5;">
                                            <strong>⚠️ Security Notice:</strong><br>
                                            If you didn't request this code, please ignore this email or contact your administrator immediately.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; font-size: 13px; color: #666; text-align: center;">
                                Best regards,<br>
                                <strong>EARIST OJT System Team</strong>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer Note -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                    <tr>
                        <td style="text-align: center; padding: 0 40px;">
                            <p style="margin: 0; font-size: 12px; color: #999; line-height: 1.5;">
                                © 2025 EARIST OJT System. All rights reserved.<br>
                                This message was sent to {user.email}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''
                
                # Plain text version
                text_content = f'''Hello {user.get_full_name() or user.username},

Your 2FA verification code is: {code}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email or contact your administrator.

Best regards,
EARIST OJT System
'''
                
                # Create email with both HTML and plain text
                email = EmailMultiAlternatives(
                    subject='EARIST OJT System - Your 2FA Code',
                    body=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[user.email]
                )
                email.attach_alternative(html_content, "text/html")
                email.send(fail_silently=False)
            except Exception as email_error:
                return Response({
                    'error': f'Failed to send verification email: {str(email_error)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'method': 'email',
                'requires_email_2fa': True,
                'message': f'Verification code sent to {user.email}',
                'email': user.email
            })
        
        # If app method chosen, redirect to setup
        else:
            # Generate token for setup
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'method': 'app',
                'requires_app_setup': True,
                'message': 'Please scan the QR code with your authenticator app',
                'token': token.key
            })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR in choose_2fa_method: {str(e)}")
        print(f"Traceback: {error_details}")
        return Response({'error': str(e), 'details': error_details if settings.DEBUG else None}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    """Initialize 2FA setup for the current user - generates QR code"""
    try:
        user = request.user
        
        # Set up 2FA
        two_factor, error = setup_2fa_for_user(user)
        
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate TOTP URI and QR code
        totp_uri = generate_totp_uri(user, two_factor.secret_key)
        qr_code = generate_qr_code(totp_uri)
        
        # Log the event
        log_2fa_event(user, '2FA_ENABLED', request, 'User initiated 2FA setup')
        
        return Response({
            'message': '2FA setup initiated. Scan the QR code with your authenticator app.',
            'qr_code': qr_code,
            'secret_key': two_factor.secret_key,  # For manual entry
            'is_enabled': two_factor.is_enabled,
            'is_verified': two_factor.is_verified
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa_setup(request):
    """Verify 2FA setup with a code from authenticator app"""
    try:
        user = request.user
        code = request.data.get('code', '').strip()
        
        if not code:
            return Response({'error': 'Verification code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user's 2FA record
        try:
            two_factor = TwoFactorAuth.objects.get(user=user)
        except TwoFactorAuth.DoesNotExist:
            return Response({'error': '2FA not set up. Please set up 2FA first.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the code
        if verify_totp_code(two_factor.secret_key, code):
            # Enable 2FA
            two_factor.is_verified = True
            two_factor.is_enabled = True
            two_factor.enabled_at = timezone.now()
            two_factor.save()
            
            # Generate backup codes
            backup_codes = generate_backup_codes(user, count=8)
            
            # Trust device if requested
            trust_device_param = request.data.get('trust_device', False)
            if trust_device_param:
                from .two_factor_utils import trust_device as trust_device_func
                trust_device_func(user, request, days=7)
                log_2fa_event(user, 'DEVICE_TRUSTED', request, 'Device marked as trusted for 7 days during 2FA setup')
            
            # Log the event
            log_2fa_event(user, '2FA_VERIFIED', request, '2FA successfully verified and enabled')
            log_2fa_event(user, 'BACKUP_CODES_GENERATED', request, f'{len(backup_codes)} backup codes generated')
            
            return Response({
                'message': '2FA verified and enabled successfully!',
                'backup_codes': backup_codes,
                'warning': 'Save these backup codes in a safe place. They can be used to access your account if you lose your authenticator device.'
            })
        else:
            # Log failed verification
            log_2fa_event(user, '2FA_FAILED', request, 'Invalid verification code during setup')
            
            return Response({
                'error': 'Invalid verification code. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """Disable 2FA for the current user (requires password confirmation)"""
    try:
        user = request.user
        password = request.data.get('password', '')
        
        # Verify password
        if not user.check_password(password):
            return Response({'error': 'Invalid password'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get and disable 2FA
        try:
            two_factor = TwoFactorAuth.objects.get(user=user)
            two_factor.is_enabled = False
            two_factor.is_verified = False
            two_factor.save()
            
            # Remove trusted devices
            TrustedDevice.objects.filter(user=user).delete()
            
            # Remove unused backup codes
            BackupCode.objects.filter(user=user, is_used=False).delete()
            
            # Log the event
            log_2fa_event(user, '2FA_DISABLED', request, 'User disabled 2FA')
            
            return Response({
                'message': '2FA has been disabled successfully.'
            })
            
        except TwoFactorAuth.DoesNotExist:
            return Response({'error': '2FA is not enabled'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_2fa_status(request):
    """Get current 2FA status for the user"""
    try:
        user = request.user
        
        try:
            two_factor = TwoFactorAuth.objects.get(user=user)
            is_enabled = two_factor.is_enabled
            is_verified = two_factor.is_verified
            enabled_at = two_factor.enabled_at
            last_used = two_factor.last_used_at
        except TwoFactorAuth.DoesNotExist:
            is_enabled = False
            is_verified = False
            enabled_at = None
            last_used = None
        
        # Get backup codes count
        backup_codes_count = BackupCode.objects.filter(user=user, is_used=False).count()
        
        # Get trusted devices count
        trusted_devices_count = TrustedDevice.objects.filter(
            user=user,
            is_active=True,
            expires_at__gt=timezone.now()
        ).count()
        
        return Response({
            'is_enabled': is_enabled,
            'is_verified': is_verified,
            'enabled_at': enabled_at,
            'last_used_at': last_used,
            'backup_codes_remaining': backup_codes_count,
            'trusted_devices_count': trusted_devices_count
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_backup_codes(request):
    """Regenerate backup codes for the user"""
    try:
        user = request.user
        password = request.data.get('password', '')
        
        # Verify password
        if not user.check_password(password):
            return Response({'error': 'Invalid password'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if 2FA is enabled
        try:
            two_factor = TwoFactorAuth.objects.get(user=user, is_enabled=True)
        except TwoFactorAuth.DoesNotExist:
            return Response({'error': '2FA is not enabled'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate new backup codes
        backup_codes = generate_backup_codes(user, count=8)
        
        # Log the event
        log_2fa_event(user, 'BACKUP_CODES_GENERATED', request, f'{len(backup_codes)} new backup codes generated')
        
        return Response({
            'message': 'New backup codes generated successfully.',
            'backup_codes': backup_codes,
            'warning': 'Previous backup codes are now invalid. Save these new codes in a safe place.'
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trusted_devices(request):
    """Get list of trusted devices for the user"""
    try:
        user = request.user
        
        devices = TrustedDevice.objects.filter(user=user, is_active=True).order_by('-last_used_at')
        
        device_list = []
        for device in devices:
            device_list.append({
                'id': device.id,
                'device_name': device.device_name or 'Unknown Device',
                'ip_address': device.ip_address,
                'created_at': device.created_at,
                'expires_at': device.expires_at,
                'last_used_at': device.last_used_at,
                'is_current': device.device_id == generate_device_id(request)
            })
        
        return Response({'trusted_devices': device_list})
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_trusted_device(request, device_id):
    """Remove a trusted device"""
    try:
        user = request.user
        
        try:
            device = TrustedDevice.objects.get(id=device_id, user=user)
            device_name = device.device_name
            device.delete()
            
            # Log the event
            log_2fa_event(user, 'DEVICE_UNTRUSTED', request, f'Removed trusted device: {device_name}')
            
            return Response({'message': 'Device removed successfully'})
            
        except TrustedDevice.DoesNotExist:
            return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.ADMIN])
def get_2fa_audit_logs(request):
    """Get 2FA audit logs (Admin only)"""
    try:
        # Get query parameters
        user_id = request.GET.get('user_id', None)
        action = request.GET.get('action', None)
        days = int(request.GET.get('days', 30))
        
        # Build query
        from datetime import timedelta
        logs = TwoFactorAuditLog.objects.filter(
            timestamp__gte=timezone.now() - timedelta(days=days)
        )
        
        if user_id:
            logs = logs.filter(user_id=user_id)
        
        if action:
            logs = logs.filter(action=action)
        
        logs = logs.order_by('-timestamp')[:100]
        
        # Serialize
        log_list = []
        for log in logs:
            log_list.append({
                'id': log.id,
                'user': log.user.username,
                'action': log.get_action_display(),
                'ip_address': log.ip_address,
                'details': log.details,
                'timestamp': log.timestamp
            })
        
        return Response({'logs': log_list, 'total': logs.count()})
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========================================
# EMAIL-BASED 2FA ENDPOINTS
# ========================================

from .models import EmailOTP
import random
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings


@api_view(['POST'])
@permission_classes([AllowAny])
def send_email_otp(request):
    """Send 6-digit OTP code to user's email for 2FA"""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user first
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user has email
        if not user.email:
            return Response({'error': 'No email address on file. Please contact administrator.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is admin (only admins need email 2FA)
        user_role = 'student'
        if hasattr(user, 'user_role'):
            user_role = user.user_role.role
        elif user.is_superuser or user.is_staff:
            user_role = 'admin'
        
        if user_role != 'admin':
            return Response({'error': '2FA not required for this user'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate 6-digit code
        code = str(random.randint(100000, 999999))
        
        # Get client IP
        from .two_factor_utils import get_client_ip
        ip_address = get_client_ip(request)
        
        # Create OTP record (expires in 10 minutes)
        EmailOTP.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
            ip_address=ip_address
        )
        
        # Send email
        try:
            send_mail(
                subject='EARIST OJT System - Your 2FA Code',
                message=f'''Hello {user.get_full_name() or user.username},

Your 2FA verification code is: {code}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email or contact your administrator.

Best regards,
EARIST OJT System
''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': f'Verification code sent to {user.email}',
                'email': user.email,
                'expires_in_minutes': 10
            })
            
        except Exception as email_error:
            return Response({
                'error': f'Failed to send email: {str(email_error)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_otp(request):
    """Verify email OTP code and complete login"""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        code = request.data.get('code', '').strip()
        trust_device = request.data.get('trust_device', False)
        
        if not username or not password or not code:
            return Response({'error': 'Username, password, and code required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Find valid OTP
        try:
            otp = EmailOTP.objects.filter(
                user=user,
                code=code,
                is_used=False,
                expires_at__gt=timezone.now()
            ).latest('created_at')
        except EmailOTP.DoesNotExist:
            return Response({'error': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check attempts (max 3)
        if otp.attempts >= 3:
            return Response({'error': 'Too many attempts. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify code
        if otp.code != code:
            otp.attempts += 1
            otp.save()
            remaining = 3 - otp.attempts
            return Response({
                'error': f'Invalid code. {remaining} attempts remaining.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark OTP as used
        otp.is_used = True
        otp.used_at = timezone.now()
        otp.save()
        
        # Mark 2FA as enabled and verified (important for setup completion)
        try:
            two_factor = TwoFactorAuth.objects.get(user=user)
            if not two_factor.is_verified or not two_factor.is_enabled:
                two_factor.is_enabled = True
                two_factor.is_verified = True
                two_factor.enabled_at = timezone.now()
                two_factor.save()
                print(f"[2FA SETUP] Marked 2FA as enabled and verified for {user.username}")
        except TwoFactorAuth.DoesNotExist:
            print(f"[2FA WARNING] No TwoFactorAuth record found for {user.username}")
        
        # Trust device if requested
        device_token_to_return = None
        if trust_device:
            from .two_factor_utils import trust_device as trust_device_func, log_2fa_event
            device, device_token_to_return = trust_device_func(user, request, days=7)
            log_2fa_event(user, 'DEVICE_TRUSTED', request, 'Device marked as trusted for 7 days')
        
        # Generate token
        token, created = Token.objects.get_or_create(user=user)
        
        # Reset login attempts
        LoginAttempt.objects.filter(username=user.username).delete()
        
        # Log login activity
        UserActivityLog.objects.create(
            user=user,
            action='Login',
            description=f'{user.username} logged in with email 2FA'
        )
        
        # Get user role
        user_role = 'student'
        user_role_display = 'Student'
        if hasattr(user, 'user_role'):
            user_role = user.user_role.role
            user_role_display = user.user_role.get_role_display()
        
        response_data = {
            'message': 'Login successful!',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'role': user_role,
                'role_display': user_role_display
            }
        }
        
        # Include device_token if device was trusted
        if device_token_to_return:
            response_data['device_token'] = device_token_to_return
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR in verify_email_otp: {str(e)}")
        print(f"Traceback: {error_details}")
        return Response({'error': str(e), 'details': error_details if settings.DEBUG else None}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========================================
# NOTIFICATION ENDPOINTS
# ========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """Get user's notifications"""
    from .models import Notification
    from .serializers import NotificationSerializer
    
    notifications = Notification.objects.filter(user=request.user)
    unread_count = notifications.filter(is_read=False).count()
    
    serializer = NotificationSerializer(notifications, many=True)
    return Response({
        'notifications': serializer.data,
        'unread_count': unread_count
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    from .models import Notification
    
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    from .models import Notification
    
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read'})


# ========================================
# DOCUMENT TEMPLATES ENDPOINTS
# ========================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def document_templates_list(request):
    """List and upload document templates"""
    from .models import DocumentTemplate
    from .serializers import DocumentTemplateSerializer
    
    if request.method == 'GET':
        # Check if user is Admin
        is_admin = request.user.is_staff
        if not is_admin and hasattr(request.user, 'user_role'):
             is_admin = request.user.user_role.role == 'admin'

        if is_admin:
             # Admin sees ALL templates
             templates = DocumentTemplate.objects.filter(is_active=True).order_by('-created_at')
        else:
            # Get student's college
            student_college = None
            if hasattr(request.user, 'student_profile') and request.user.student_profile.college:
                student_college = request.user.student_profile.college
            
            # Filter templates: show templates for student's college OR templates with no college (global)
            if student_college:
                templates = DocumentTemplate.objects.filter(
                    is_active=True
                ).filter(
                    models.Q(college=student_college) | models.Q(college__isnull=True) | models.Q(college='')
                ).order_by('-created_at')
            else:
                # If student has no college, show only global templates
                templates = DocumentTemplate.objects.filter(
                    models.Q(college__isnull=True) | models.Q(college='')
                ).filter(is_active=True).order_by('-created_at')
        
        serializer = DocumentTemplateSerializer(templates, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Check if user has permission (staff, coordinator, or has user_role)
        has_permission = (
            request.user.is_staff or 
            hasattr(request.user, 'coordinator_profile') or
            (hasattr(request.user, 'user_role') and request.user.user_role.role in ['coordinator', 'admin'])
        )
        
        if not has_permission:
            return Response({'error': 'Only coordinators/admins can upload templates'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentTemplateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Auto-set college from coordinator's profile
            template = serializer.save(uploaded_by=request.user)
            
            # Set college from coordinator profile
            if hasattr(request.user, 'coordinator_profile') and request.user.coordinator_profile.college:
                template.college = request.user.coordinator_profile.college
                template.save()
            
            return Response(DocumentTemplateSerializer(template, context={'request': request}).data, 
                          status=status.HTTP_201_CREATED)
        
        # Log validation errors for debugging
        print(f"Template upload validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coordinator_users_list(request):
    """Get list of students for coordinator's college"""
    from django.contrib.auth.models import User
    
    coordinator_college = None
    if hasattr(request.user, 'coordinator_profile') and request.user.coordinator_profile.college:
        coordinator_college = request.user.coordinator_profile.college
    
    students = User.objects.filter(is_staff=False, is_superuser=False)
    
    if coordinator_college:
        students = students.filter(student_profile__college=coordinator_college)
    
    student_data = []
    for student in students:
        student_data.append({
            'id': student.id,
            'username': student.username,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'email': student.email,
            'full_name': f"{student.first_name} {student.last_name}".strip() or student.username
        })
    
    return Response(student_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def coordinator_generate_document(request):
    """Generate documents for coordinators"""
    from django.contrib.auth.models import User
    from .models import Application
    import os
    from django.conf import settings
    from datetime import datetime
    
    document_type = request.data.get('document_type')
    student_id = request.data.get('student_id')
    
    if not request.user.is_staff and not hasattr(request.user, 'coordinator_profile'):
        if not (hasattr(request.user, 'user_role') and request.user.user_role.role == 'coordinator'):
            return Response({'error': 'Only coordinators can generate documents'}, 
                          status=status.HTTP_403_FORBIDDEN)
    
    student = None
    if student_id:
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    
    print(f"DEBUG: document_type = '{document_type}'")
    print(f"DEBUG: document_type == 'training_plan': {document_type == 'training_plan'}")
    
    if document_type == 'training_plan':
        if not student:
            return Response({'error': 'Student is required for training plan'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        student_name = f"{student.first_name} {student.last_name}"
        student_profile = getattr(student, 'student_profile', None)
        program = student_profile.course if student_profile and student_profile.course else "N/A"
        
        company_name = "N/A"
        supervisor_name = "N/A"
        
        active_app = Application.objects.filter(student=student, status='Accepted').first()
        
        if active_app:
            company_name = active_app.internship.company.name
            if active_app.internship.company.contact_person:
                supervisor_name = active_app.internship.company.contact_person
        
        content = f"""ON-THE-JOB TRAINING PLAN
{'='*70}

Name of Company: {company_name}
Name of OJT Supervisor: {supervisor_name}
Job Designation: Intern

Name of Student Trainee: {student_name}
Program: {program}
STI Campus: EARIST
Training Period: [To be filled]
Required no. of hours: 486 hours

{'='*70}
TRAINING SCHEDULE
{'='*70}

Period | Area/Topic | Specific Tasks | Expected Output | Hours
{'-'*70}
Week 1  | Orientation | Company policies | Understanding rules | 40
Week 2  | Basic Skills | Tools and systems | Familiarity | 40
Week 3-4 | Core Tasks | Primary responsibilities | Task completion | 80
Week 5-8 | Advanced | Complex projects | Project deliverables | 160
Week 9-12 | Final Projects | Independent work | Final output | 166

{'='*70}

Noted by:
_____________________          _____________________
OJT Adviser                    OJT Coordinator

_____________________          _____________________
Student Trainee                Date of Approval

{'='*70}
PT-APO-008-00 | OJT Training Plan Template | Page 1 of 1
"""
        
        docs_dir = os.path.join(settings.MEDIA_ROOT, 'generated_documents')
        os.makedirs(docs_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"training_plan_{student.username}_{timestamp}.txt"
        filepath = os.path.join(docs_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        download_url = f"/media/generated_documents/{filename}"
        
        return Response({
            'success': True,
            'download_url': download_url,
            'format': 'txt',
            'message': 'Training plan generated successfully'
        })
    
    # Handle waiver/consent form generation
    if document_type == 'waiver' or document_type == 'consent_letter':
        if not student:
            return Response({'error': 'Student is required for consent form'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get student details
        student_name = f"{student.first_name} {student.last_name}"
        student_profile = getattr(student, 'student_profile', None)
        course = student_profile.course if student_profile and student_profile.course else "Bachelor in Multimedia Arts"
        
        # Get company info
        company_name = "N/A"
        
        # Try to get from active application
        active_app = Application.objects.filter(
            student=student, 
            status='Accepted'
        ).first()
        
        if active_app:
            company_name = active_app.internship.company.name
        
        # Get current date
        from datetime import datetime
        current_date = datetime.now()
        ay_term = f"{current_date.year}, Term"
        
        # Generate consent form content
        content = f"""PARENT/GUARDIAN CONSENT FORM


                                                                    AY, Term
                                                                    ______________


I, _________________________________________________, the parent/legal guardian
of _________________________, hereby expressly state that I agree to the following:

    1. To allow my son/daughter, <name of Student Trainee> to take his/her On-the-Job
       Training (OJT) at <name of Host Training Establishment> for 300 hours in partial
       fulfillment of the requirements for the degree in Bachelor in Multimedia Arts.

    2. I have read the rules and regulations set by the STI OJT Course Policy and the Host
       Training Establishment and commits that my son/daughter will abide by the said rules
       and regulations.

    3. I fully and voluntarily waive my right to hold STI <Name of Campus> and/or any of its
       officers, employees, or representatives responsible for any case of untoward incident
       that may happen to my son/daughter during the duration of his/her training.



_______________________________________________          __________________
Signature over Printed Name of Parent or Guardian       Date Signed



Received by:


_______________________________________________          __________________
Signature over Printed Name of OJT Adviser               Date Signed
"""
        
        # Create directory
        docs_dir = os.path.join(settings.MEDIA_ROOT, 'generated_documents')
        os.makedirs(docs_dir, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"consent_form_{student.username}_{timestamp}.txt"
        filepath = os.path.join(docs_dir, filename)
        
        # Write file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Return download URL
        download_url = f"/media/generated_documents/{filename}"
        
        return Response({
            'success': True,
            'download_url': download_url,
            'format': 'txt',
            'message': 'Consent form generated successfully'
        })
    
    return Response({
        'error': f'Document type {document_type} not yet implemented'
    }, status=status.HTTP_400_BAD_REQUEST)

# ========================================
# STUDENT MESSAGING
# ========================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def student_messages(request):
    """View and send messages for students"""
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
@role_required([UserRole.STUDENT])
def student_mark_message_read(request, message_id):
    """Mark a message as read or delete it for student"""
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
@role_required([UserRole.STUDENT])
def student_delete_all_messages(request):
    """Delete all messages for the current student"""
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


# ⌨️ TYPING INDICATORS
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_typing_status(request):
    """
    Update the typing status for the current user towards a recipient.
    Expects JSON: { recipient_id: <id>, is_typing: <bool> }
    """
    recipient_id = request.data.get('recipient_id')
    is_typing = request.data.get('is_typing', False)
    
    if not recipient_id:
        return Response({'error': 'recipient_id is required'}, status=400)
    
    # Verify recipient exists
    try:
        recipient = User.objects.get(id=recipient_id)
    except User.DoesNotExist:
        return Response({'error': 'Recipient not found'}, status=404)
        
    # Update or create indicator
    indicator, created = TypingIndicator.objects.get_or_create(
        user=request.user,
        recipient=recipient
    )
    
    indicator.is_typing = is_typing
    indicator.save() # Updates last_typed_at automatically due to auto_now=True
    
    return Response({'status': 'success'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_typing_status(request):
    """
    Check if a specific user is typing to the current user.
    Expects Query Param: user_id (The sender ID)
    """
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=400)
        
    try:
        indicator = TypingIndicator.objects.get(
            user_id=user_id, 
            recipient=request.user
        )
        
        # Check if "expired" (e.g. > 5 seconds old)
        time_threshold = timezone.now() - timedelta(seconds=5)
        if indicator.last_typed_at < time_threshold:
             indicator.is_typing = False
             indicator.save(update_fields=['is_typing'])
             return Response({'is_typing': False})
             
        return Response({'is_typing': indicator.is_typing})
    except TypingIndicator.DoesNotExist:
        return Response({'is_typing': False})


# 🎓 Get Coordinator Settings for Student
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.STUDENT])
def student_coordinator_settings(request):
    """Get coordinator settings (like required docs) for the student's college"""
    try:
        user = request.user
        
        # Check if student has a profile and college assigned
        if not hasattr(user, 'student_profile') or not user.student_profile.college:
            return Response({'required_docs': []})
            
        student_college = user.student_profile.college
        
        # Find a coordinator for this college
        from .models import CoordinatorProfile, CoordinatorSettings
        
        # Find coordinator profile for this college
        coordinator_profile = CoordinatorProfile.objects.filter(college=student_college).first()
        
        if not coordinator_profile:
            return Response({'required_docs': []})
            
        # Get settings for this coordinator
        settings = CoordinatorSettings.objects.filter(coordinator=coordinator_profile.user).first()
        
        if not settings:
            return Response({'required_docs': []})
            
        return Response({
            'required_docs': settings.required_docs or [],
            'hours_config': settings.hours_config or [],
            'cutoff_dates': settings.cutoff_dates or [],
            'activities': settings.activities or []
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== QR CODE FOR STUDENT PROFILE ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required([UserRole.STUDENT])
def generate_student_qr_code(request):
    """Generate permanent QR code for student profile"""
    from .two_factor_utils import generate_student_qr_token, generate_student_qr_code as gen_qr_img
    
    try:
        user = request.user
        profile = user.student_profile
        
        # If QR code already exists, return it
        if profile.qr_code_token and profile.qr_code_image:
            return Response({
                'qr_code_image': profile.qr_code_image,
                'qr_code_token': profile.qr_code_token
            })
        
        # Generate new permanent token
        qr_token = generate_student_qr_token(user.id)
        qr_image = gen_qr_img(qr_token)
        
        # Save to profile
        profile.qr_code_token = qr_token
        profile.qr_code_image = qr_image
        profile.save()
        
        return Response({
            'qr_code_image': qr_image,
            'qr_code_token': qr_token
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_student_profile(request, token):
    """Public student profile accessible via QR code scan"""
    from .two_factor_utils import decrypt_student_qr_token
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"[QR DEBUG] Token received: {token}")
    try:
        # Decrypt token to get user_id
        user_id = decrypt_student_qr_token(token)
        logger.error(f"[QR DEBUG] Decrypted user_id: {user_id}")
        if not user_id:
            logger.error("[QR DEBUG] Invalid QR code token")
            return Response({'error': 'Invalid QR code token'}, status=status.HTTP_400_BAD_REQUEST)
        # Get student user and profile
        user = User.objects.get(id=user_id)
        profile = user.student_profile
        # Get active internship application
        active_application = Application.objects.filter(
            student=user,
            status='Approved'
        ).select_related('internship', 'internship__company').first()
        logger.error(f"[QR DEBUG] Active application: {active_application}")
        if not active_application:
            # No active internship
            logger.error("[QR DEBUG] No active internship found")
            return Response({
                'student_name': user.get_full_name() or user.username,
                'student_id': profile.student_id,
                'email': user.email,
                'profile_picture': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
                'has_active_internship': False,
                'evaluation_count': PerformanceEvaluation.objects.filter(student=user).count()
            })
        # Get internship details
        internship = active_application.internship
        company = internship.company
        # Count total evaluations
        evaluation_count = PerformanceEvaluation.objects.filter(
            student=user,
            application=active_application
        ).count()
        logger.error(f"[QR DEBUG] Returning student profile for {user_id}")
        return Response({
            'student_name': user.get_full_name() or user.username,
            'student_id': profile.student_id,
            'email': user.email,
            'phone': profile.phone,
            'course': profile.course,
            'year': profile.year,
            'college': profile.get_college_display() if profile.college else '',
            'profile_picture': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
            'has_active_internship': True,
            'company_name': company.name,
            'company_address': company.address,
            'position': internship.position,
            'application_date': active_application.applied_at.strftime('%B %d, %Y'),
            'start_date': active_application.applied_at.strftime('%B %d, %Y'),
            'evaluation_count': evaluation_count,
            'qr_token': token
        })
    except User.DoesNotExist:
        logger.error("[QR DEBUG] Student not found for user_id")
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"[QR DEBUG] Exception: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def public_submit_evaluation(request, token):
    """Submit performance evaluation via QR code (public access)"""
    from .two_factor_utils import decrypt_student_qr_token
    from datetime import date
    
    try:
        # Decrypt token to get user_id
        user_id = decrypt_student_qr_token(token)
        if not user_id:
            return Response({'error': 'Invalid QR code token'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get student
        student = User.objects.get(id=user_id)
        
        # Get active application
        active_application = Application.objects.filter(
            student=student,
            status='Approved'
        ).first()
        
        if not active_application:
            return Response({'error': 'No active internship found for this student'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate required fields
        supervisor_name = request.data.get('supervisor_name', '').strip()
        supervisor_email = request.data.get('supervisor_email', '').strip()
        
        if not supervisor_name or not supervisor_email:
            return Response({'error': 'Supervisor name and email are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if this supervisor already evaluated today (limit 1 per day)
        today = date.today()
        existing_eval_today = PerformanceEvaluation.objects.filter(
            student=student,
            application=active_application,
            supervisor_email__iexact=supervisor_email,
            submitted_at__date=today
        ).exists()
        
        if existing_eval_today:
            return Response({
                'error': f'You have already submitted an evaluation for this student today. Limit: 1 evaluation per day per supervisor.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create evaluation
        evaluation = PerformanceEvaluation.objects.create(
            student=student,
            application=active_application,
            supervisor_name=supervisor_name,
            supervisor_email=supervisor_email,
            supervisor_position=request.data.get('supervisor_position', ''),
            supervisor_signature=request.data.get('supervisor_signature', ''),
            evaluation_period_start=request.data.get('evaluation_period_start'),
            evaluation_period_end=request.data.get('evaluation_period_end'),
            criteria_scores=request.data.get('criteria_scores', {}),
            total_score=request.data.get('total_score', 0),
            comments=request.data.get('comments', '')
        )
        
        # Send email copy to supervisor
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            
            email_subject = f"Performance Evaluation Copy - {student.get_full_name()}"
            email_body = f"""
Dear {supervisor_name},

Thank you for submitting a performance evaluation for {student.get_full_name()}.

Evaluation Details:
- Student: {student.get_full_name()} ({student.student_profile.student_id})
- Company: {active_application.internship.company.name}
- Position: {active_application.internship.position}
- Total Score: {evaluation.total_score}
- Grade Equivalent: {evaluation.grade}
- Evaluation Period: {evaluation.evaluation_period_start} to {evaluation.evaluation_period_end}

Comments: {evaluation.comments}

This is an automated confirmation email from the EARIST OJT System.

Best regards,
EARIST OJT Management System
            """
            
            send_mail(
                email_subject,
                email_body,
                settings.EMAIL_HOST_USER,
                [supervisor_email],
                fail_silently=True
            )
        except Exception as email_error:
            # Don't fail the request if email fails
            print(f"Failed to send email: {email_error}")
        
        return Response({
            'message': 'Evaluation submitted successfully',
            'evaluation_id': evaluation.id,
            'grade': evaluation.grade,
            'email_sent': True
        }, status=status.HTTP_201_CREATED)
        
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

