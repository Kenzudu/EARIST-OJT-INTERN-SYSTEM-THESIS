from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import IntegrityError
from .models import (
    Company, Internship, Application, StudentProfile, UserActivityLog,
    Supervisor, CompanyUser, DailyJournal, PreTrainingRequirement,
    DocumentTemplate, Attendance, Task, PerformanceEvaluation,
    Notice, SupportTicket, CoordinatorProfile, NarrativeReport, SupervisorDocument, Notification,
    TypingIndicator
)

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    college = serializers.SerializerMethodField()
    student_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined', 'role', 'role_display', 'college', 'student_profile']
    
    def get_role(self, obj):
        if hasattr(obj, 'user_role'):
            return obj.user_role.role
        return 'admin' if obj.is_staff else 'student'
    
    def get_role_display(self, obj):
        if hasattr(obj, 'user_role'):
            return obj.user_role.get_role_display()
        return 'Administrator' if obj.is_staff else 'Student'

    def get_college(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.college
        elif hasattr(obj, 'coordinator_profile'):
            return obj.coordinator_profile.college
        return None
    
    def get_student_profile(self, obj):
        """Include student_profile data if it exists"""
        if hasattr(obj, 'student_profile'):
            return {
                'student_id': obj.student_profile.student_id,
                'course': obj.student_profile.course,
                'year': obj.student_profile.year,
                'section': obj.student_profile.section,
            }
        return None

class CoordinatorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CoordinatorProfile
        fields = ['id', 'user', 'college', 'department', 'phone']

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    first_name = serializers.CharField(source='user.first_name', write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', write_only=True, required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', write_only=True, required=False)
    
    resume = serializers.FileField(required=False, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    certificate_of_registration = serializers.FileField(required=False, allow_null=True, read_only=False)
    certification_file = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'bio', 'phone', 'address', 'skills', 'certifications', 'certification_file', 'career_interests', 'resume_url', 'resume', 'profile_picture', 'course', 'college', 'year', 'section', 'student_id', 'birth_date', 'sex', 'certificate_of_registration', 'cor_verified', 'created_at', 'updated_at', 'first_name', 'last_name', 'email']
    
    def to_representation(self, instance):
        """Custom representation to handle null file fields properly"""
        representation = super().to_representation(instance)
        # Ensure cor_verified is always a boolean, not None
        if representation.get('cor_verified') is None:
            representation['cor_verified'] = False
        
        # Ensure certificate_of_registration URL is properly generated
        if instance.certificate_of_registration:
            request = self.context.get('request')
            if request:
                representation['certificate_of_registration'] = request.build_absolute_uri(instance.certificate_of_registration.url)
            else:
                # Fallback if no request context
                representation['certificate_of_registration'] = instance.certificate_of_registration.url
        
        # Ensure certification_file URL is properly generated
        if instance.certification_file:
            request = self.context.get('request')
            if request:
                representation['certification_file'] = request.build_absolute_uri(instance.certification_file.url)
            else:
                representation['certification_file'] = instance.certification_file.url
        
        return representation
    
    def update(self, instance, validated_data):
        # Handle user first_name, last_name, and email
        # Since they use source='user.first_name', they come nested in validated_data
        user = instance.user
        user_updated = False
        
        # Check if user data is in validated_data
        if 'user' in validated_data:
            user_data = validated_data.pop('user', {})
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
                user_updated = True
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
                user_updated = True
            if 'email' in user_data:
                user.email = user_data['email']
                user_updated = True
        else:
            # Handle direct fields if they come directly (less common with source=)
            if 'first_name' in validated_data:
                user.first_name = validated_data.pop('first_name')
                user_updated = True
            if 'last_name' in validated_data:
                user.last_name = validated_data.pop('last_name')
                user_updated = True
            if 'email' in validated_data:
                user.email = validated_data.pop('email')
                user_updated = True
        
        if user_updated:
            user.save()
        
        # Handle file uploads
        resume = validated_data.pop('resume', None)
        if resume is not None:
            instance.resume = resume
        
        profile_picture = validated_data.pop('profile_picture', None)
        if profile_picture is not None:
            instance.profile_picture = profile_picture
        
        certification_file = validated_data.pop('certification_file', None)
        if certification_file is not None:
            instance.certification_file = certification_file
        
        certificate_of_registration = validated_data.pop('certificate_of_registration', None)
        if certificate_of_registration is not None:
            instance.certificate_of_registration = certificate_of_registration
            # Reset verification when a new COR is uploaded
            if certificate_of_registration:
                instance.cor_verified = False
        
        # Handle cor_verified separately (convert string to boolean if needed)
        cor_verified = validated_data.pop('cor_verified', None)
        if cor_verified is not None:
            # Convert string "true"/"false" to boolean if needed
            if isinstance(cor_verified, str):
                instance.cor_verified = cor_verified.lower() == 'true'
            else:
                instance.cor_verified = bool(cor_verified)
        
        # Update StudentProfile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    student_id = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    birth_date = serializers.DateField(write_only=True, required=True)
    course = serializers.CharField(write_only=True, required=False, allow_blank=True)
    college = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'student_id', 'birth_date', 'course', 'college']

    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_student_id(self, value):
        """Check if student ID already exists"""
        if value and value.strip():  # Only check if student_id is provided
            if StudentProfile.objects.filter(student_id=value).exists():
                raise serializers.ValidationError("A user with this student ID already exists.")
        return value

    def create(self, validated_data):
        student_id = validated_data.pop('student_id', '')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        birth_date = validated_data.pop('birth_date', None)
        course = validated_data.pop('course', '')
        college = validated_data.pop('college', '')
        
        # Generate username from student_id (use student_id as username)
        username = student_id.strip()
        
        # Check if username already exists, if so, append a number
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        
        try:
            user = User.objects.create_user(
                username=username,
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=first_name.strip(),
                last_name=last_name.strip()
            )
            # Create student profile with details
            student_profile, created = StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'student_id': student_id,
                    'birth_date': birth_date,
                    'course': course,
                    'college': college
                }
            )
            if not created:
                student_profile.student_id = student_id
                student_profile.birth_date = birth_date
                if course: student_profile.course = course
                if college: student_profile.college = college
                student_profile.save()
            return user
        except IntegrityError as e:
            # If user creation fails due to integrity error (e.g., duplicate username/email),
            # re-raise with a more specific message
            if 'username' in str(e):
                raise serializers.ValidationError({'username': 'A user with that username already exists.'})
            elif 'email' in str(e):
                raise serializers.ValidationError({'email': 'A user with that email already exists.'})
            raise serializers.ValidationError({'detail': 'Database integrity error during user creation.'})
        except Exception as e:
            # If StudentProfile creation fails, delete the user to prevent orphaned records
            if 'user' in locals() and user.pk:
                user.delete()
            raise serializers.ValidationError({'detail': f'Error creating student profile: {str(e)}'})

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user is None:
            raise serializers.ValidationError("Invalid username or password")
        return user
    
class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class InternshipSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), source='company', required=True)
    compatibility_score = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Internship
        fields = [
            'id',
            'company',
            'company_id',
            'company_name',
            'position',
            'description',
            'slots',
            'required_skills',
            'required_courses',
            'work_location',
            'duration_hours',
            'stipend',
            'position_type',
            'compatibility_score',
            'created_at',
            'updated_at',
        ]

class InternshipNestedSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company = CompanySerializer(read_only=True)
    
    class Meta:
        model = Internship
        fields = [
            'id',
            'position',
            'company',
            'company_name',
            'work_location',
            'required_skills',
            'required_courses',
            'duration_hours',
            'stipend',
            'position_type',
            'description',
        ]

class ApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.SerializerMethodField()
    internship = InternshipNestedSerializer(read_only=True)
    internship_id = serializers.IntegerField(write_only=True, required=False)
    resume_file = serializers.FileField(required=False, allow_null=True)
    parents_consent = serializers.FileField(required=False, allow_null=True)
    internship_contract = serializers.FileField(required=False, allow_null=True)
    student_health_record = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Application
        fields = ['id', 'student_name', 'student_id', 'internship', 'internship_id', 'status', 'applied_at', 'feedback', 'cover_letter', 'resume_url', 'resume_file', 'parents_consent', 'internship_contract', 'student_health_record']
    
    def get_student_id(self, obj):
        """Get student_id from StudentProfile if it exists"""
        try:
            if hasattr(obj.student, 'student_profile'):
                return obj.student.student_profile.student_id or None
        except:
            pass
        return None
    
    def to_representation(self, instance):
        """Custom representation to ensure file URLs are properly generated"""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        if request:
            if instance.resume_file:
                representation['resume_file'] = request.build_absolute_uri(instance.resume_file.url)
            if instance.parents_consent:
                representation['parents_consent'] = request.build_absolute_uri(instance.parents_consent.url)
            if instance.internship_contract:
                representation['internship_contract'] = request.build_absolute_uri(instance.internship_contract.url)
            if instance.student_health_record:
                representation['student_health_record'] = request.build_absolute_uri(instance.student_health_record.url)
        else:
            # Fallback if no request context (e.g. scripts)
            if instance.resume_file:
                representation['resume_file'] = instance.resume_file.url
            if instance.parents_consent:
                representation['parents_consent'] = instance.parents_consent.url
            if instance.internship_contract:
                representation['internship_contract'] = instance.internship_contract.url
            if instance.student_health_record:
                representation['student_health_record'] = instance.student_health_record.url
                
        return representation

class UserActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = UserActivityLog
        fields = ['id', 'username', 'full_name', 'student_id', 'user_role', 'action', 'description', 'timestamp']
    
    def get_full_name(self, obj):
        """Get full name (first_name + last_name) from user"""
        first_name = obj.user.first_name or ""
        last_name = obj.user.last_name or ""
        full_name = f"{first_name} {last_name}".strip()
        return full_name if full_name else obj.user.username
    
    def get_student_id(self, obj):
        """Get student_id from StudentProfile if it exists"""
        try:
            if hasattr(obj.user, 'student_profile'):
                return obj.user.student_profile.student_id or None
        except:
            pass
        return None
    
    def get_user_role(self, obj):
        """Get user role from UserRole model"""
        try:
            if hasattr(obj.user, 'user_role'):
                return obj.user.user_role.role
            elif obj.user.is_staff:
                return 'admin'
        except:
            pass
        return 'student'  # Default to student if no role found


# ========== NEW SERIALIZERS FOR PAPER REQUIREMENTS ==========

class SupervisorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Supervisor
        fields = ['id', 'user', 'employee_id', 'department', 'phone', 'created_at']


class CompanyUserSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = CompanyUser
        fields = ['id', 'user', 'company', 'company_name', 'position', 'phone', 'created_at']


class DailyJournalSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    application_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = DailyJournal
        fields = [
            'id', 'student', 'student_name', 'application', 'application_id',
            'date', 'activities', 'learning_outcomes', 'hours_rendered',
            'status', 'supervisor_comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['student', 'supervisor_comment']


class PreTrainingRequirementSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    document_file = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = PreTrainingRequirement
        fields = [
            'id', 'student', 'student_name', 'requirement_type',
            'document_file', 'document_url', 'status', 'admin_comment',
            'submitted_at', 'reviewed_at'
        ]
        read_only_fields = ['student', 'status', 'admin_comment', 'reviewed_at']


class DocumentTemplateSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file = serializers.FileField(required=False)
    
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'template_type', 'file', 'description',
            'uploaded_by', 'uploaded_by_name', 'created_at', 'is_active'
        ]
        read_only_fields = ['uploaded_by']


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)
    application_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'application', 'application_id',
            'date', 'time_in', 'time_out', 'hours_rendered', 'attendance_code',
            'status', 'marked_by', 'marked_by_name', 'notes', 'created_at'
        ]
        read_only_fields = ['attendance_code', 'hours_rendered']  # Auto-calculated


class TaskSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    application_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'student', 'student_name',
            'application', 'application_id', 'assigned_by', 'assigned_by_name',
            'deadline', 'status', 'priority', 'student_notes',
            'supervisor_feedback', 'created_at', 'updated_at', 'completed_at',
            'submission_file', 'submission_link', 'submitted_at'
        ]
        read_only_fields = ['assigned_by', 'supervisor_feedback', 'completed_at']


class PerformanceEvaluationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    evaluated_by_name = serializers.SerializerMethodField()
    evaluator_company = serializers.SerializerMethodField()
    application_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    evaluation_file = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = PerformanceEvaluation
        fields = [
            'id', 'student', 'student_name', 'application', 'application_id',
            'evaluated_by', 'evaluated_by_name', 'evaluator_company', 'evaluation_period_start',
            'evaluation_period_end', 'criteria_scores', 'total_score',
            'comments', 'grade', 'supervisor_name', 'supervisor_email', 
            'supervisor_position', 'supervisor_signature',
            'evaluation_file', 'is_official', 'submitted_at', 'updated_at'
        ]
        read_only_fields = ['evaluated_by']

    def get_evaluated_by_name(self, obj):
        if obj.evaluated_by:
            full_name = obj.evaluated_by.get_full_name()
            if full_name and full_name.strip():
                return full_name
            return obj.evaluated_by.username
        return "Unknown Supervisor"

    def get_evaluator_company(self, obj):
        # 1. Try fetching from Company User Profile (Industry Supervisor)
        if obj.evaluated_by and hasattr(obj.evaluated_by, 'company_user_profile') and obj.evaluated_by.company_user_profile.company:
            return obj.evaluated_by.company_user_profile.company.name
            
        # 2. Try fetching from Supervisor Profile (Academic/OJT Coordinator)
        if obj.evaluated_by and hasattr(obj.evaluated_by, 'supervisor_profile'):
             # Academic supervisors belong to the University, return their Department or "Earist Faculty"
             dep = obj.evaluated_by.supervisor_profile.department
             return f"Earist - {dep}" if dep else "Earist Faculty"

        # 3. Try fetching from the linked Application (Project/Internship)
        if obj.application and obj.application.internship and obj.application.internship.company:
            return obj.application.internship.company.name

        # 4. Fallbacks for Admin/Staff
        if obj.evaluated_by and (obj.evaluated_by.is_staff or obj.evaluated_by.is_superuser):
            return "Earist Administration"
            
        return "Independent Evaluator"


class NoticeSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    attachment = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'notice_type', 'is_public',
            'is_active', 'expires_at', 'attachment', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by']


class SupportTicketSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.get_full_name', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'student', 'student_name', 'subject', 'message',
            'category', 'status', 'admin_response', 'responded_by',
            'responded_by_name', 'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['student', 'admin_response', 'responded_by', 'resolved_at']

class NarrativeReportSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    file = serializers.FileField(required=True)
    
    class Meta:
        model = NarrativeReport
        fields = [
            'id', 'student', 'student_name', 'report_type',
            'file', 'submitted_at', 'status', 'feedback'
        ]
        read_only_fields = ['student', 'status', 'feedback', 'submitted_at']

class SupervisorDocumentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    document_file = serializers.FileField(required=True)
    application_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = SupervisorDocument
        fields = [
            'id', 'student', 'student_name', 'uploaded_by', 'uploaded_by_name',
            'application', 'application_id', 'document_type', 'title',
            'description', 'document_file', 'is_official',
            'uploaded_at', 'updated_at'
        ]
        read_only_fields = ['uploaded_by', 'uploaded_at', 'updated_at']
    
    def to_representation(self, instance):
        """Custom representation to ensure document_file URL is properly generated"""
        representation = super().to_representation(instance)
        if instance.document_file:
            request = self.context.get('request')
            if request:
                representation['document_file'] = request.build_absolute_uri(instance.document_file.url)
            else:
                representation['document_file'] = instance.document_file.url
        return representation


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at', 'related_id']
        read_only_fields = ['created_at']


class DocumentTemplateSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    is_active = serializers.BooleanField(default=True, read_only=False)
    
    class Meta:
        model = DocumentTemplate
        fields = ['id', 'name', 'template_type', 'file', 'description', 'uploaded_by', 'uploaded_by_name', 'created_at', 'is_active']
        read_only_fields = ['uploaded_by', 'created_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.file:
            request = self.context.get('request')
            if request:
                representation['file'] = request.build_absolute_uri(instance.file.url)
            else:
                representation['file'] = instance.file.url
        return representation


class TypingIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypingIndicator
        fields = ['user', 'recipient', 'is_typing', 'last_typed_at']
        read_only_fields = ['user', 'last_typed_at']
