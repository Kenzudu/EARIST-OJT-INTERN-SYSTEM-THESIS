from django.db import models
from django.contrib.auth.models import User

# Role-based Access Control
class UserRole(models.Model):
    """
    Defines user roles for the internship management system.
    Based on adviser requirements document.
    """
    ADMIN = 'admin'
    COORDINATOR = 'coordinator'
    SUPERVISOR = 'supervisor'
    STUDENT = 'student'
    
    ROLE_CHOICES = [
        (ADMIN, 'Administrator'),
        (COORDINATOR, 'Coordinator'),
        (SUPERVISOR, 'Supervisor'),
        (STUDENT, 'Student'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_role')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default=STUDENT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
    
    def is_admin(self):
        return self.role == self.ADMIN
    
    def is_coordinator(self):
        return self.role == self.COORDINATOR
    
    def is_supervisor(self):
        return self.role == self.SUPERVISOR
    
    def is_student(self):
        return self.role == self.STUDENT


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated skills")
    certifications = models.TextField(blank=True, help_text="Comma-separated certifications")
    certification_file = models.FileField(upload_to='certifications/', blank=True, null=True)
    career_interests = models.TextField(blank=True)
    resume_url = models.URLField(blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    course = models.CharField(max_length=255, blank=True)
    year = models.CharField(max_length=255, blank=True)
    section = models.CharField(max_length=255, blank=True)
    student_id = models.CharField(max_length=255, blank=True)
    birth_date = models.DateField(null=True, blank=True, help_text="Student's date of birth")
    sex = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female')], blank=True)
    certificate_of_registration = models.FileField(upload_to='certificates_of_registration/', blank=True, null=True, help_text="Certificate of Registration (COR) document")
    cor_verified = models.BooleanField(default=False, help_text="Whether the COR has been verified by the student")
    qr_code_token = models.CharField(max_length=255, blank=True, null=True, unique=True, help_text="Permanent encrypted token for QR code")
    qr_code_image = models.TextField(blank=True, null=True, help_text="Base64-encoded QR code image")
    
    COLLEGE_CHOICES = [
        ('CAS', 'College of Arts and Sciences'),
        ('CBA', 'College of Business Administration'),
        ('CED', 'College of Education'),
        ('CEN', 'College of Engineering'),
        ('CHM', 'College of Hospitality Management'),
        ('CIT', 'College of Industrial Technology'),
        ('CPAC', 'College of Public Administration and Criminology'),
        ('CAFA', 'College of Architecture and Fine Arts'),
        ('CCS', 'College of Computer Studies'),
        ('GS', 'Graduate School'),
    ]
    college = models.CharField(max_length=10, choices=COLLEGE_CHOICES, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} Profile"


class CoordinatorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coordinator_profile')
    college = models.CharField(max_length=10, choices=StudentProfile.COLLEGE_CHOICES)
    department = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    office_location = models.CharField(max_length=255, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_college_display()}"


class CoordinatorSettings(models.Model):
    """Store coordinator-specific settings for their college"""
    coordinator = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coordinator_settings')
    hours_config = models.JSONField(default=list, blank=True)  # List of {program, requiredHours}
    required_docs = models.JSONField(default=list, blank=True)  # List of required documents
    cutoff_dates = models.JSONField(default=list, blank=True)  # List of cutoff dates
    activities = models.JSONField(default=list, blank=True)  # List of calendar activities
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Coordinator Settings"
    
    def __str__(self):
        return f"Settings for {self.coordinator.username}"

class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    contact_person = models.CharField(max_length=255)
    contact_email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Archived', 'Archived'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    # MOA Details
    moa_file = models.FileField(upload_to='moa_documents/', blank=True, null=True, help_text="Memorandum of Agreement document")
    moa_start_date = models.DateField(null=True, blank=True, help_text="Start date of the MOA")
    moa_expiration_date = models.DateField(null=True, blank=True, help_text="Expiration date of the MOA")
    
    # Target colleges - which colleges this company is recruiting from
    COLLEGE_CHOICES = [
        ('CAS', 'College of Arts and Sciences'),
        ('CBA', 'College of Business Administration'),
        ('CED', 'College of Education'),
        ('CEN', 'College of Engineering'),
        ('CHM', 'College of Hospitality Management'),
        ('CIT', 'College of Industrial Technology'),
        ('CPAC', 'College of Public Administration and Criminology'),
        ('CAFA', 'College of Architecture and Fine Arts'),
        ('CCS', 'College of Computer Studies'),
    ]
    target_colleges = models.JSONField(default=list, blank=True, help_text="Colleges this company is targeting for recruitment")

    def __str__(self):
        return self.name

class Internship(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='internships')
    position = models.CharField(max_length=100)
    description = models.TextField()
    slots = models.PositiveIntegerField(default=1)
    required_skills = models.TextField(blank=True, help_text="Comma-separated required skills")
    required_courses = models.TextField(blank=True, help_text="Comma-separated required/preferred courses (e.g., BSCS, BS INFO TECH)")
    work_location = models.CharField(max_length=255, blank=True)
    duration_hours = models.PositiveIntegerField(null=True, blank=True, help_text="Total hours required")
    stipend = models.CharField(max_length=100, blank=True)
    position_type = models.CharField(
        max_length=50,
        default='Full-time',
        choices=[
            ('Full-time', 'Full-time'),
            ('Part-time', 'Part-time'),
            ('Contract', 'Contract'),
            ('Freelance', 'Freelance'),
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return f"{self.position} at {self.company.name}"

class Application(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="core_applications")
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, default="Pending", choices=[
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Completed', 'Completed'),
        ('Terminated', 'Terminated'),
    ])
    applied_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True, help_text="Date when internship was completed")
    terminated_at = models.DateTimeField(null=True, blank=True, help_text="Date when internship was terminated")
    termination_reason = models.TextField(blank=True, help_text="Reason for termination by supervisor")
    feedback = models.TextField(blank=True)
    cover_letter = models.TextField(blank=True)
    resume_url = models.URLField(blank=True, help_text="URL to student's resume (e.g., Google Drive, Dropbox link)")
    resume_file = models.FileField(upload_to='application_resumes/', blank=True, null=True)
    parents_consent = models.FileField(upload_to='application_consents/', blank=True, null=True, help_text="Parent's consent letter (PDF, Doc, Image)")
    internship_contract = models.FileField(upload_to='application_contracts/', blank=True, null=True, help_text="Internship Contract (PDF, Doc, Image)")
    student_health_record = models.FileField(upload_to='application_health_records/', blank=True, null=True, help_text="Student health record (PDF, Doc, Image)")

    def __str__(self):
        return f"{self.student.username} - {self.internship.position}"

    class Meta:
        ordering = ['-applied_at']

class UserActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activity_logs")
    action = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']


# ========== NEW MODELS FOR PAPER REQUIREMENTS ==========

class Supervisor(models.Model):
    """OJT Adviser/Supervisor Model"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='supervisor_profile')
    employee_id = models.CharField(max_length=50, blank=True)
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - Supervisor"


class CompanyUser(models.Model):
    """Company/Host Organization Representative Model"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_user_profile')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='company_users')
    position = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    target_colleges = models.JSONField(default=list, blank=True, help_text="Colleges this supervisor is targeting")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.company.name}"


class DailyJournal(models.Model):
    """Daily Reporting/eLogbook Model"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_journals')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='journals', null=True, blank=True)
    date = models.DateField()
    activities = models.TextField(help_text="Daily activities and tasks performed")
    learning_outcomes = models.TextField(blank=True, help_text="What was learned today")
    hours_rendered = models.DecimalField(max_digits=4, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, default='Draft', choices=[
        ('Draft', 'Draft'),
        ('Submitted', 'Submitted'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ])
    supervisor_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        unique_together = ['student', 'date', 'application']

    def __str__(self):
        return f"{self.student.username} - {self.date}"


class PreTrainingRequirement(models.Model):
    """Pre-Training Requirements Documents"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pre_training_requirements')
    requirement_type = models.CharField(max_length=50, choices=[
        ('Resume/CV', 'Resume/CV'),
        ('Application Letter', 'Application Letter'),
        ('Endorsement Letter', 'Endorsement Letter'),
        ('Recommendation Letter', 'Recommendation Letter'),
        ('Waiver', 'Waiver'),
        ('Consent Letter', 'Consent Letter'),
        ('Contract', 'Contract'),
        ('Medical Certificate', 'Medical Certificate'),
        ('NBI Clearance', 'NBI Clearance'),
        ('Barangay Clearance', 'Barangay Clearance'),
        ('Other', 'Other'),
    ])
    document_file = models.FileField(upload_to='pre_training_docs/', blank=True, null=True)
    document_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, default='Pending', choices=[
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ])
    admin_comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.username} - {self.requirement_type}"


class DocumentTemplate(models.Model):
    """Document Templates for Download"""
    name = models.CharField(max_length=200)
    template_type = models.CharField(max_length=50, choices=[
        ('Endorsement Letter', 'Endorsement Letter'),
        ('Acceptance Letter', 'Acceptance Letter'),
        ('Evaluation Form', 'Evaluation Form'),
        ('Waiver', 'Waiver'),
        ('Consent Letter', 'Consent Letter'),
        ('Training Plan', 'Training Plan'),
        ('Contract', 'Contract'),
        ('Medical Certificate', 'Medical Certificate'),
        ('Other', 'Other'),
    ])
    file = models.FileField(upload_to='document_templates/')
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_templates')
    college = models.CharField(max_length=10, blank=True, null=True, help_text="College this template is for (leave blank for all colleges)")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class DocumentTypeConfig(models.Model):
    """Configurable Document Types for Generation"""
    CATEGORY_CHOICES = [
        ('Letters', 'Letters'),
        ('Certificates', 'Certificates'),
        ('Legal Documents', 'Legal Documents'),
        ('Reports', 'Reports'),
    ]
    
    name = models.CharField(max_length=200, help_text="Display name (e.g., 'Endorsement Letter')")
    code = models.CharField(max_length=100, unique=True, help_text="Internal code (e.g., 'endorsement_letter')")
    description = models.TextField(blank=True, help_text="Description of what this document is for")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Letters')
    
    # Requirements
    requires_student = models.BooleanField(default=False, help_text="Does this document require student selection?")
    requires_company = models.BooleanField(default=False, help_text="Does this document require company selection?")
    
    # Status and filtering
    is_enabled = models.BooleanField(default=True, help_text="Is this document type available for generation?")
    college = models.CharField(max_length=10, choices=StudentProfile.COLLEGE_CHOICES, blank=True, null=True, 
                               help_text="College this document type is for (leave blank for all colleges)")
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_document_types')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Template files
    template_file = models.FileField(upload_to='document_type_templates/', blank=True, null=True, 
                                     help_text="Custom template file (DOCX) for this document type")
    template_file_pdf = models.FileField(upload_to='document_type_templates/', blank=True, null=True, 
                                         help_text="Custom template file (PDF) for this document type - used for PDF output consistency")
    
    class Meta:
        ordering = ['category', 'name']
        verbose_name = "Document Type Configuration"
        verbose_name_plural = "Document Type Configurations"
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Attendance(models.Model):
    """Attendance Marking for Interns"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='attendances', null=True, blank=True)
    date = models.DateField()
    time_in = models.TimeField(null=True, blank=True)
    time_out = models.TimeField(null=True, blank=True)
    hours_rendered = models.DecimalField(max_digits=4, decimal_places=2, default=0.0)
    attendance_code = models.CharField(max_length=20, blank=True, help_text="Generated attendance code")
    status = models.CharField(max_length=20, default='Present', choices=[
        ('Pending', 'Pending'),
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
        ('Excused', 'Excused'),
    ])
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['student', 'date', 'application']

    def save(self, *args, **kwargs):
        """Calculate hours_rendered automatically when time_out is set"""
        if self.time_in and self.time_out:
            from datetime import datetime, timedelta
            
            # Convert time to datetime for calculation
            time_in_dt = datetime.combine(self.date, self.time_in)
            time_out_dt = datetime.combine(self.date, self.time_out)
            
            # Handle overnight shifts (time_out < time_in)
            if time_out_dt < time_in_dt:
                time_out_dt += timedelta(days=1)
            
            # Calculate hours
            time_diff = time_out_dt - time_in_dt
            hours = time_diff.total_seconds() / 3600
            self.hours_rendered = round(hours, 2)
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.username} - {self.date} - {self.status}"


class Task(models.Model):
    """Task Assignment for Interns"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_tasks')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='supervisor_assigned_tasks')
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='Pending', choices=[
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Submitted', 'Submitted'),
        ('Completed', 'Completed'),
        ('Overdue', 'Overdue'),
    ])
    submission_file = models.FileField(upload_to='task_submissions/', blank=True, null=True)
    submission_link = models.URLField(blank=True, null=True, help_text="External link (e.g., Google Drive, GitHub)")
    submitted_at = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=20, default='Medium', choices=[
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ])
    student_notes = models.TextField(blank=True)
    supervisor_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.student.username}"


class PerformanceEvaluation(models.Model):
    """Performance Evaluation by Supervisors"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_evaluations')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='evaluations', null=True, blank=True)
    evaluated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='given_evaluations')
    supervisor_name = models.CharField(max_length=255, blank=True, help_text="Name of company supervisor who evaluated")
    supervisor_email = models.EmailField(blank=True, help_text="Email of company supervisor who evaluated")
    supervisor_position = models.CharField(max_length=255, blank=True, help_text="Position/Title of supervisor")
    supervisor_signature = models.TextField(blank=True, help_text="Base64 encoded signature image")
    evaluation_period_start = models.DateField()
    evaluation_period_end = models.DateField()
    
    # New JSON Field for detailed area scores
    criteria_scores = models.JSONField(default=dict, blank=True, help_text="Structured scores for Areas 1-4")
    
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    comments = models.TextField(blank=True, help_text="Comments / Suggestions")
    
    grade = models.CharField(max_length=10, blank=True, help_text="Grade Equivalent (e.g. 1.0, 1.25)")
    
    evaluation_file = models.FileField(upload_to='evaluations/', blank=True, null=True)
    is_official = models.BooleanField(default=False, help_text="Official evaluation with organizational seal/signature")
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']

    def calculate_grade(self):
        """Calculate Grade Equivalent based on Total Score"""
        try:
            score = float(self.total_score or 0)
        except (ValueError, TypeError):
            return ''
            
        if score >= 97: return '1.0'
        elif score >= 94: return '1.25'
        elif score >= 91: return '1.5'
        elif score >= 88: return '1.75'
        elif score >= 85: return '2.0'
        elif score >= 82: return '2.25'
        elif score >= 79: return '2.5'
        elif score >= 76: return '2.75'
        elif score >= 73: return '3.0'
        else: return '5.0'

    def save(self, *args, **kwargs):
        if not self.grade:
            self.grade = self.calculate_grade()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Evaluation for {self.student.username} - {self.evaluation_period_start} to {self.evaluation_period_end}"


class Notice(models.Model):
    """Internship Notices and Announcements"""
    title = models.CharField(max_length=200)
    content = models.TextField()
    notice_type = models.CharField(max_length=50, choices=[
        ('General', 'General'),
        ('Important', 'Important'),
        ('Urgent', 'Urgent'),
        ('Announcement', 'Announcement'),
    ])
    is_public = models.BooleanField(default=True, help_text="Visible to public/students")
    is_active = models.BooleanField(default=True)
    expires_at = models.DateField(null=True, blank=True, help_text="Date when this notice expires")
    attachment = models.FileField(upload_to='notices/', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_notices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class SupportTicket(models.Model):
    """Help Desk/Support System"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    subject = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=50, choices=[
        ('Technical', 'Technical'),
        ('Account', 'Account'),
        ('Application', 'Application'),
        ('General', 'General'),
    ])
    status = models.CharField(max_length=20, default='Open', choices=[
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
        ('Closed', 'Closed'),
    ])
    admin_response = models.TextField(blank=True)
    responded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='responded_tickets', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} - {self.student.username}"

class EmailVerification(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} - {self.code}"


class SystemSettings(models.Model):
    """System-wide configuration settings (Singleton pattern)"""
    max_applications_per_student = models.PositiveIntegerField(
        default=5,
        help_text="Maximum number of internship applications a student can submit"
    )
    company_name = models.CharField(max_length=255, default="EARIST Internship System")
    system_email = models.EmailField(default="earistojtsys@gmail.com")
    application_deadline = models.DateField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='settings_updates')
    
    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists (singleton pattern)
        self.pk = 1
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Prevent deletion
        pass
    
    @classmethod
    def load(cls):
        """Load or create the singleton settings instance"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    def __str__(self):
        return "System Settings"

class LoginAttempt(models.Model):
    username = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    attempts = models.PositiveIntegerField(default=0)
    last_attempt = models.DateTimeField(auto_now=True)
    locked_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.username} - {self.attempts} attempts"



class GradingCriteria(models.Model):
    """Criteria for academic grading (e.g., Attendance 30%, Evaluation 50%)"""
    name = models.CharField(max_length=100)
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage weight (0-100)")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.weight}%)"

class StudentFinalGrade(models.Model):
    """Computed final grade for a student"""
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='final_grade')
    attendance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    supervisor_rating_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    requirements_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_grade = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    remarks = models.CharField(max_length=50, choices=[('Passed', 'Passed'), ('Failed', 'Failed'), ('Incomplete', 'Incomplete')], default='Incomplete')
    computed_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.username} - {self.final_grade}"

class NarrativeReport(models.Model):
    """Midterm and Final Narrative Reports"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='narrative_reports')
    report_type = models.CharField(max_length=50, choices=[
        ('Midterm', 'Midterm Narrative Report'),
        ('Final', 'Final Narrative Report'),
    ])
    file = models.FileField(upload_to='narrative_reports/')
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Submitted', choices=[
        ('Submitted', 'Submitted'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ])
    feedback = models.TextField(blank=True)

    class Meta:
        ordering = ['-submitted_at']
        unique_together = ['student', 'report_type']

    def __str__(self):
        return f"{self.student.username} - {self.report_type}"


# Message Model for Communication
class Message(models.Model):
    """Messages between supervisors, students, and coordinators"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=200)
    message = models.TextField()
    attachment = models.FileField(upload_to='message_attachments/', blank=True, null=True, help_text="Attach images or documents (jpg, png, pdf, docx)")
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # New fields for enhanced features
    delivered_at = models.DateTimeField(null=True, blank=True, help_text="When message was delivered to recipient")
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies', help_text="Message this is replying to")
    
    # Soft delete flags
    deleted_by_sender = models.BooleanField(default=False)
    deleted_by_recipient = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender.username} to {self.recipient.username}: {self.subject}"


class TypingIndicator(models.Model):
    """Track when users are typing messages"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='typing_indicators')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='typing_to')
    is_typing = models.BooleanField(default=False)
    last_typed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'recipient')
        verbose_name = "Typing Indicator"
        verbose_name_plural = "Typing Indicators"
    
    def __str__(self):
        return f"{self.user.username} typing to {self.recipient.username}"


# ========== TWO-FACTOR AUTHENTICATION MODELS ==========

class TwoFactorAuth(models.Model):
    """Two-Factor Authentication (2FA) configuration for users"""
    
    METHOD_CHOICES = [
        ('app', 'Authenticator App (Google Authenticator, Authy, etc.)'),
        ('email', 'Email OTP'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='two_factor_auth')
    secret_key = models.CharField(max_length=32, help_text="TOTP secret key")
    is_enabled = models.BooleanField(default=False, help_text="Whether 2FA is enabled for this user")
    is_verified = models.BooleanField(default=False, help_text="Whether the user has verified their 2FA setup")
    preferred_method = models.CharField(
        max_length=10, 
        choices=METHOD_CHOICES, 
        default='email',
        help_text="User's preferred 2FA method"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    enabled_at = models.DateTimeField(null=True, blank=True, help_text="When 2FA was enabled")
    last_used_at = models.DateTimeField(null=True, blank=True, help_text="Last time 2FA was used")
    
    class Meta:
        verbose_name = "Two-Factor Authentication"
        verbose_name_plural = "Two-Factor Authentications"
    
    def __str__(self):
        return f"{self.user.username} - 2FA {'Enabled' if self.is_enabled else 'Disabled'}"


class BackupCode(models.Model):
    """Backup codes for 2FA recovery"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='backup_codes')
    code = models.CharField(max_length=10, unique=True, help_text="Backup recovery code")
    is_used = models.BooleanField(default=False, help_text="Whether this code has been used")
    used_at = models.DateTimeField(null=True, blank=True, help_text="When this code was used")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        status = "Used" if self.is_used else "Active"
        return f"{self.user.username} - {self.code[:4]}**** ({status})"


class TrustedDevice(models.Model):
    """Trusted devices that don't require 2FA for a period of time"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trusted_devices')
    device_id = models.CharField(max_length=255, unique=True, help_text="Unique device identifier")
    device_name = models.CharField(max_length=255, blank=True, help_text="User-friendly device name (e.g., Chrome on Windows)")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="When this trust expires")
    last_used_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-last_used_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.device_name or self.device_id[:20]}"


class TwoFactorAuditLog(models.Model):
    """Audit log for 2FA-related events"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='two_factor_logs')
    action = models.CharField(max_length=50, choices=[
        ('2FA_ENABLED', '2FA Enabled'),
        ('2FA_DISABLED', '2FA Disabled'),
        ('2FA_VERIFIED', '2FA Verified Successfully'),
        ('2FA_FAILED', '2FA Verification Failed'),
        ('BACKUP_CODE_USED', 'Backup Code Used'),
        ('BACKUP_CODES_GENERATED', 'Backup Codes Generated'),
        ('DEVICE_TRUSTED', 'Device Marked as Trusted'),
        ('DEVICE_UNTRUSTED', 'Device Removed from Trusted'),
    ])
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.TextField(blank=True, help_text="Additional details about the action")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "2FA Audit Log"
        verbose_name_plural = "2FA Audit Logs"
    
    def __str__(self):
        return f"{self.user.username} - {self.get_action_display()} at {self.timestamp}"


class EmailOTP(models.Model):
    """Email-based One-Time Password for 2FA"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_otps')
    code = models.CharField(max_length=6, help_text="6-digit OTP code")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="When this code expires")
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.IntegerField(default=0, help_text="Number of verification attempts")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Email OTP"
        verbose_name_plural = "Email OTPs"
    
    def __str__(self):
        status = "Used" if self.is_used else "Active"
        return f"{self.user.username} - {self.code} ({status})"
    
    def is_valid(self):
        """Check if OTP is still valid"""
        from django.utils import timezone
        return not self.is_used and timezone.now() < self.expires_at


class SupervisorDocument(models.Model):
    """Documents uploaded by supervisors for interns (certificates, approvals, completion forms)"""
    DOCUMENT_TYPE_CHOICES = [
        ('Approval', 'Approval Document'),
        ('Certificate', 'Certificate'),
        ('Completion', 'Completion Form'),
        ('Evaluation', 'Evaluation Form'),
        ('Recommendation', 'Recommendation Letter'),
        ('Other', 'Other Document'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supervisor_documents')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_supervisor_documents')
    application = models.ForeignKey('Application', on_delete=models.CASCADE, related_name='supervisor_documents', null=True, blank=True)
    
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES, default='Other')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    document_file = models.FileField(upload_to='supervisor_documents/')
    
    is_official = models.BooleanField(default=True, help_text="Official document with signature/seal")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Supervisor Document"
        verbose_name_plural = "Supervisor Documents"
    
    def __str__(self):
        return f"{self.document_type} for {self.student.username} - {self.title}"


class Notification(models.Model):
    """User notifications for various system events"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=[
        ('attendance', 'Attendance Update'),
        ('task', 'Task Assignment'),
        ('evaluation', 'Evaluation'),
        ('application', 'Application Status'),
        ('journal', 'Journal Feedback'),
        ('general', 'General'),
    ], default='general')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional reference to related object
    related_id = models.IntegerField(null=True, blank=True, help_text="ID of related object (attendance, task, etc.)")
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"

