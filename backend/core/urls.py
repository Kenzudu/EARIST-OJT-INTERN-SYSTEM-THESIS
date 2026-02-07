from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import coordinator_views
from . import admin_views
from . import supervisor_views
from . import document_template_views
from . import database_views
from . import backup_views


router = DefaultRouter()
router.register(r'narrative-reports', views.NarrativeReportViewSet, basename='narrative-report')

# Public QR endpoints should be matched first
urlpatterns = [
    path('public/student/<str:token>/', views.public_student_profile, name='public-student-profile'),
    path('public/evaluate/<str:token>/', views.public_submit_evaluation, name='public-submit-evaluation'),
    path('', include(router.urls)),
    # Authentication
    path('send-verification-code/', views.send_verification_code, name='send-verification-code'),
    path('verify-email-code/', views.verify_email_code, name='verify-email-code'),
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('request-password-reset/', views.request_password_reset, name='request-password-reset'),
    path('change-password/', views.change_password, name='change-password'),
    
    # Dashboard
    path('dashboard/', views.get_dashboard, name='dashboard'),
    path('admin/dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('admin/dashboard/stats/', admin_views.admin_dashboard_stats, name='admin-dashboard-stats'),
    path('student/dashboard/', views.student_dashboard, name='student-dashboard'),

    # Companies
    path('companies/', views.company_list, name='company-list'),
    path('companies/<int:pk>/', views.company_detail, name='company-detail'),
    path('companies/<int:pk>/details/', views.company_full_details, name='company-full-details'),
    path('companies/bulk-import/', views.bulk_import_companies, name='bulk-import-companies'),

    # Internships
    path('internships/', views.internship_list, name='internship-list'),
    path('internships/<int:pk>/', views.internship_detail, name='internship-detail'),

    # Applications
    path('applications/', views.application_list, name='application-list'),
    path('applications/<int:pk>/', views.application_detail, name='application-detail'),
    path('student/applications/', views.application_list, name='student-application-list'),
    path('student/messages/', views.student_messages, name='student-messages'),
    path('student/messages/<int:message_id>/read/', views.student_mark_message_read, name='student-mark-message-read'),
    path('student/messages/<int:message_id>/', views.student_mark_message_read, name='student-message-detail'),
    path('student/messages/delete-all/', views.student_delete_all_messages, name='student-delete-all-messages'),

    # Student Profile
    path('my-profile/', views.my_profile, name='my-profile'),
    path('student/coordinator-settings/', views.student_coordinator_settings, name='student-coordinator-settings'),

    # User Management (Admin only)
    path('users/', views.users_list, name='users-list'),
    path('users/<int:user_id>/', views.user_profile_detail, name='user-profile-detail'),
    path('statistics/', views.user_statistics, name='user-statistics'),
    path('admin/generate-report/', views.generate_comprehensive_report, name='generate-report'),

    # Activity Logs
    path('activity-logs/', views.activity_logs, name='activity-logs'),
    path('student-login-logs/', views.student_login_logs, name='student-login-logs'),
    path('log-activity/', views.log_activity, name='log-activity'),

    # Typing Indicators
    path('typing/update/', views.update_typing_status, name='update-typing-status'),
    path('typing/status/', views.get_typing_status, name='get-typing-status'),

    # AI Matching & Career Guidance
    path('recommendations/matched-internships/', views.get_matched_internships, name='matched-internships'),
    path('recommendations/career-guidance/', views.get_career_guidance, name='career-guidance'),
    path('recommendations/feedback-analysis/', views.analyze_feedback, name='feedback-analysis'),
    path('recommendations/analyze-text/', views.analyze_text, name='analyze-text'),
    path("admin/dashboard/", views.admin_dashboard),
    
    # Daily Journal/eLogbook
    path('journals/', views.daily_journal_list, name='journal-list'),
    path('journals/<int:pk>/', views.daily_journal_detail, name='journal-detail'),
    path('journals/<int:pk>/approve/', views.approve_journal, name='approve-journal'),
    
    # Pre-Training Requirements
    path('pre-training-requirements/', views.pre_training_requirements_list, name='pre-training-list'),
    path('pre-training-requirements/<int:pk>/approve/', views.approve_requirement, name='approve-requirement'),
    path('pre-training-requirements/<int:pk>/', views.delete_requirement, name='delete-requirement'),
    
    # Document Templates
    path('document-templates/', views.document_templates_list, name='template-list'),
    
    # Attendance
    path('attendance/', views.attendance_list, name='attendance-list'),
    path('attendance/<int:pk>/', views.attendance_detail, name='attendance-detail'),
    
    # Tasks
    path('tasks/', views.task_list, name='task-list'),
    path('tasks/<int:pk>/', views.task_detail, name='task-detail'),
    
    # Performance Evaluation
    path('evaluations/', views.performance_evaluation_list, name='evaluation-list'),
    
    # Notices
    path('notices/', views.notice_list, name='notice-list'),
    path('notices/<int:pk>/', views.notice_detail, name='notice-detail'),
    
    # Support Tickets
    path('support-tickets/', views.support_ticket_list, name='support-ticket-list'),
    path('support-tickets/<int:pk>/respond/', views.respond_to_ticket, name='respond-ticket'),
    
    # Progress Tracking
    path('progress/', views.student_progress, name='student-progress'),
    path('progress/<int:student_id>/', views.student_progress, name='student-progress-detail'),
    
    # Media Files (without X-Frame-Options for iframe embedding)
    path('media-view/<path:file_path>', views.serve_media_file, name='serve-media-file'),
    
    # System Settings
    path('settings/', views.get_system_settings, name='get-settings'),
    path('settings/update/', views.update_system_settings, name='update-settings'),
    path('application-status/', views.get_application_status, name='application-status'),
    
    # Statistics
    path('statistics/', views.get_statistics, name='statistics'),
    
    # Data Export
    path('export/users/', views.export_users_csv, name='export-users'),
    path('export/internships/', views.export_internships_csv, name='export-internships'),
    path('export/applications/', views.export_applications_csv, name='export-applications'),
    path('export/journals/', views.export_journals_csv, name='export-journals'),
    path('export/evaluations/', views.export_evaluations_csv, name='export-evaluations'),
    path('export/narrative-reports/', views.bulk_download_narrative_reports, name='export-narrative-reports'),
    
    # Supervisor API Endpoints
    path('supervisor/dashboard/', supervisor_views.supervisor_dashboard, name='supervisor-dashboard'),
    path('supervisor/profile/', supervisor_views.supervisor_profile, name='supervisor-profile'),
    path('supervisor/interns/', supervisor_views.supervisor_interns_list, name='supervisor-interns'),
    path('supervisor/interns/<int:intern_id>/', supervisor_views.supervisor_intern_detail, name='supervisor-intern-detail'),
    path('supervisor/applications/<int:application_id>/status/', supervisor_views.supervisor_update_application_status, name='supervisor-update-application-status'),
    path('supervisor/tasks/', supervisor_views.supervisor_tasks, name='supervisor-tasks'),
    path('supervisor/journals/', supervisor_views.supervisor_journals, name='supervisor-journals'),
    path('supervisor/evaluations/', supervisor_views.supervisor_submit_evaluation, name='supervisor-evaluations'),
    path('supervisor/attendance/', supervisor_views.supervisor_attendance, name='supervisor-attendance'),
    path('supervisor/students/<int:student_id>/attendance/', supervisor_views.supervisor_student_attendance, name='supervisor-student-attendance'),
    path('supervisor/messages/', supervisor_views.supervisor_messages, name='supervisor-messages'),
    path('supervisor/messages/<int:message_id>/', supervisor_views.supervisor_mark_message_read, name='supervisor-message-detail'),
    path('supervisor/messages/<int:message_id>/read/', supervisor_views.supervisor_mark_message_read, name='supervisor-mark-message-read'),
    path('supervisor/messages/delete-all/', supervisor_views.supervisor_delete_all_messages, name='supervisor-delete-all-messages'),
    path('supervisor/students/<int:student_id>/progress/', supervisor_views.supervisor_student_progress, name='supervisor-student-progress'),
    path('supervisor/documents/', supervisor_views.supervisor_documents, name='supervisor-documents'),
    path('supervisor/documents/<int:document_id>/delete/', supervisor_views.supervisor_document_delete, name='supervisor-document-delete'),
    path('supervisor/students/<int:student_id>/terminate/', supervisor_views.supervisor_terminate_internship, name='supervisor-terminate-internship'),
    
    # Coordinator API Endpoints
    path('coordinator/dashboard/', coordinator_views.coordinator_dashboard, name='coordinator-dashboard'),
    path('coordinator/companies/<int:company_id>/approve/', coordinator_views.coordinator_approve_company, name='coordinator-approve-company'),
    path('coordinator/documents/generate/', coordinator_views.coordinator_generate_document, name='coordinator-generate-document'),
    path('coordinator/document-types/', coordinator_views.coordinator_document_types, name='coordinator-document-types'),
    path('coordinator/document-types/<int:doc_type_id>/', coordinator_views.coordinator_document_type_detail, name='coordinator-document-type-detail'),
    path('coordinator/document-types/<int:doc_type_id>/upload-template/', coordinator_views.coordinator_upload_document_template, name='coordinator-upload-template'),
    path('coordinator/document-types/<int:doc_type_id>/preview-template/', coordinator_views.coordinator_preview_code_template, name='coordinator-preview-template'),
    path('coordinator/document-types/<int:doc_type_id>/preview-pdf/', coordinator_views.coordinator_preview_template_pdf, name='coordinator-preview-pdf'),
    path('coordinator/students/bulk-approve/', coordinator_views.coordinator_bulk_approve_students, name='coordinator-bulk-approve'),
    path('coordinator/students/', coordinator_views.coordinator_users_list, name='coordinator-students-list'),
    path('coordinator/users/', coordinator_views.coordinator_users_list, name='coordinator-users-list'),
    path('coordinator/profile/', coordinator_views.coordinator_settings, name='coordinator-profile'),
    path('coordinator/settings/', coordinator_views.coordinator_settings, name='coordinator-settings'),
    path('coordinator/messages/', coordinator_views.coordinator_messages, name='coordinator-messages'),
    path('coordinator/messages/<int:message_id>/read/', coordinator_views.coordinator_mark_message_read, name='coordinator-mark-message-read'),
    path('coordinator/messages/<int:message_id>/', coordinator_views.coordinator_mark_message_read, name='coordinator-message-detail'),
    path('coordinator/messages/delete-all/', coordinator_views.coordinator_delete_all_messages, name='coordinator-delete-all-messages'),
    path('coordinator/journals/', coordinator_views.coordinator_journals, name='coordinator-journals'),
    
    # Grading System
    path('coordinator/grading/criteria/', views.grading_criteria_list, name='grading-criteria'),
    path('coordinator/grading/criteria/<int:pk>/', views.grading_criteria_detail, name='grading-criteria-detail'),
    path('coordinator/grading/compute/<int:student_id>/', views.compute_student_grade, name='compute-student-grade'),
    path('coordinator/grading/grades/', coordinator_views.coordinator_student_grades, name='coordinator-student-grades'),
    
    # Coordinator Analytics
    path('coordinator/analytics/', views.coordinator_analytics, name='coordinator-analytics'),
    
    # Admin API Endpoints
    path('admin/messages/', admin_views.admin_messages, name='admin-messages'),
    path('admin/messages/<int:message_id>/read/', admin_views.admin_mark_message_read, name='admin-mark-message-read'),
    path('admin/messages/<int:message_id>/', admin_views.admin_mark_message_read, name='admin-message-detail'),
    path('admin/messages/delete-all/', admin_views.admin_delete_all_messages, name='admin-delete-all-messages'),
    path('admin/users/<int:user_id>/assign-role/', views.admin_assign_role, name='admin-assign-role'),
    path('admin/backup/', views.admin_backup_database, name='admin-backup'),
    path('admin/backups/', views.admin_list_backups, name='admin-list-backups'),
    path('admin/audit-logs/', views.admin_audit_logs, name='admin-audit-logs'),
    path('admin/system-config/', views.admin_system_config, name='admin-system-config'),
    
    # Two-Factor Authentication
    path('2fa/choose-method/', views.choose_2fa_method, name='2fa-choose-method'),
    path('2fa/setup/', views.setup_2fa, name='2fa-setup'),
    path('2fa/verify-setup/', views.verify_2fa_setup, name='2fa-verify-setup'),
    path('2fa/disable/', views.disable_2fa, name='2fa-disable'),
    path('2fa/status/', views.get_2fa_status, name='2fa-status'),
    path('2fa/backup-codes/regenerate/', views.regenerate_backup_codes, name='2fa-regenerate-backup-codes'),
    path('2fa/trusted-devices/', views.get_trusted_devices, name='2fa-trusted-devices'),
    path('2fa/trusted-devices/<int:device_id>/', views.remove_trusted_device, name='2fa-remove-trusted-device'),
    path('2fa/audit-logs/', views.get_2fa_audit_logs, name='2fa-audit-logs'),
    
    # Email-based 2FA
    path('2fa/email/send/', views.send_email_otp, name='2fa-email-send'),
    path('2fa/email/verify/', views.verify_email_otp, name='2fa-email-verify'),
    
    # Notifications
    path('notifications/', views.notification_list, name='notification-list'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    
    # Document Templates
    path('document-templates/', document_template_views.document_templates_list, name='document-templates-list'),
    path('document-templates/<int:pk>/', document_template_views.document_template_detail, name='document-template-detail'),
    


    # Admin Database Management
    path('admin/database/stats/', database_views.database_stats, name='admin-database-stats'),
    path('admin/database/logs/', database_views.get_activity_logs, name='admin-database-logs'),
    path('admin/database/backup/', database_views.backup_database, name='admin-database-backup'),
    path('admin/database/maintenance/', database_views.perform_maintenance, name='admin-database-maintenance'),
    
    # Backup System
    path('admin/backup/status/', backup_views.get_backup_status, name='admin-backup-status'),
    path('admin/backup/trigger/', backup_views.trigger_manual_backup, name='admin-backup-trigger'),
    
    # QR Code Student Profile System
    path('student/generate-qr/', views.generate_student_qr_code, name='student-generate-qr'),
    path('public/student/<str:token>/', views.public_student_profile, name='public-student-profile'),
    path('public/evaluate/<str:token>/', views.public_submit_evaluation, name='public-submit-evaluation'),
]


