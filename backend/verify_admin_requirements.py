"""
Admin Requirements Verification Script
Checks if all required admin features are implemented
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole, TwoFactorAuth, Company, SystemSettings
from django.urls import get_resolver
import json

def check_feature(feature_name, check_function):
    """Helper to check and report feature status"""
    try:
        result = check_function()
        status = "✓ IMPLEMENTED" if result else "✗ MISSING"
        print(f"{status} - {feature_name}")
        return result
    except Exception as e:
        print(f"✗ ERROR - {feature_name}: {str(e)}")
        return False

def check_2fa():
    """Check if 2FA is implemented for admins"""
    # Check if TwoFactorAuth model exists
    try:
        from core.models import TwoFactorAuth
        # Check if there are any 2FA records
        has_2fa_model = True
    except:
        has_2fa_model = False
    
    # Check for 2FA URLs
    resolver = get_resolver()
    urls = [url.pattern._route for url in resolver.url_patterns if hasattr(url.pattern, '_route')]
    has_2fa_urls = any('2fa' in str(url).lower() or 'two-factor' in str(url).lower() for url in urls)
    
    return has_2fa_model and has_2fa_urls

def check_user_management():
    """Check if user management is implemented"""
    resolver = get_resolver()
    urls = [str(url.pattern) for url in resolver.url_patterns if hasattr(url.pattern, '_route')]
    
    # Check for user management endpoints
    has_users_endpoint = any('users' in str(url) for url in urls)
    has_user_role_model = UserRole._meta.db_table in django.db.connection.introspection.table_names()
    
    return has_users_endpoint and has_user_role_model

def check_document_management():
    """Check if document management is implemented"""
    # Check if AdminDocuments page exists
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'src', 'pages')
    admin_docs_exists = os.path.exists(os.path.join(frontend_path, 'AdminDocuments.js'))
    
    # Check for document-related URLs
    resolver = get_resolver()
    urls = [str(url.pattern) for url in resolver.url_patterns if hasattr(url.pattern, '_route')]
    has_document_urls = any('document' in str(url).lower() for url in urls)
    
    return admin_docs_exists or has_document_urls

def check_database_backup():
    """Check if database backup is implemented"""
    # Check for backup function in admin_views
    admin_views_path = os.path.join(os.path.dirname(__file__), 'core', 'admin_views.py')
    if os.path.exists(admin_views_path):
        with open(admin_views_path, 'r', encoding='utf-8') as f:
            content = f.read()
            has_backup_function = 'backup' in content.lower()
    else:
        has_backup_function = False
    
    # Check if backups directory exists
    backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
    has_backup_dir = os.path.exists(backup_dir)
    
    return has_backup_function and has_backup_dir

def check_notice_management():
    """Check if notice management is implemented"""
    # Check if AdminNotices page exists
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'src', 'pages')
    admin_notices_exists = os.path.exists(os.path.join(frontend_path, 'AdminNotices.js'))
    
    # Check for notice-related models
    from django.apps import apps
    has_notice_model = False
    for model in apps.get_models():
        if 'notice' in model.__name__.lower() or 'announcement' in model.__name__.lower():
            has_notice_model = True
            break
    
    return admin_notices_exists or has_notice_model

def check_company_management():
    """Check if company management is implemented"""
    # Check if Company model exists
    has_company_model = Company._meta.db_table in django.db.connection.introspection.table_names()
    
    # Check if AdminCompanies page exists
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'src', 'pages')
    admin_companies_exists = os.path.exists(os.path.join(frontend_path, 'AdminCompanies.js'))
    
    return has_company_model and admin_companies_exists

def check_user_logs():
    """Check if user activity logs monitoring is implemented"""
    from django.apps import apps
    
    # Check for activity log model
    has_log_model = False
    for model in apps.get_models():
        if 'log' in model.__name__.lower() or 'activity' in model.__name__.lower():
            has_log_model = True
            break
    
    # Check for audit/analytics page
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'src', 'pages')
    admin_analytics_exists = os.path.exists(os.path.join(frontend_path, 'AdminAnalytics.js'))
    
    return has_log_model and admin_analytics_exists

def main():
    print("\n" + "="*60)
    print("ADMIN REQUIREMENTS VERIFICATION")
    print("="*60 + "\n")
    
    requirements = {
        "2.1. Two-Factor Authentication (2FA)": check_2fa,
        "2.2. User Management (Create, Update, Manage Accounts)": check_user_management,
        "2.3. Document Management (Upload/Manage Forms & Templates)": check_document_management,
        "2.4. Database Backup": check_database_backup,
        "2.4. User Activity Logs Monitoring": check_user_logs,
        "2.5. Notice Management (Upload Announcements)": check_notice_management,
        "2.6. Company Management (Add/Maintain Partner Companies)": check_company_management,
    }
    
    results = {}
    for requirement, check_func in requirements.items():
        results[requirement] = check_feature(requirement, check_func)
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    implemented = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\nImplemented: {implemented}/{total}")
    print(f"Completion: {(implemented/total)*100:.1f}%")
    
    if implemented == total:
        print("\n✓ All admin requirements are IMPLEMENTED!")
    else:
        print("\n✗ Some requirements are MISSING:")
        for req, status in results.items():
            if not status:
                print(f"  - {req}")
    
    print("\n" + "="*60 + "\n")
    
    # Additional details
    print("ADDITIONAL DETAILS:")
    print("-" * 60)
    
    # Count admins with 2FA
    try:
        admin_users = User.objects.filter(userrole__role='admin')
        admins_with_2fa = sum(1 for admin in admin_users if hasattr(admin, 'two_factor_auth') and admin.two_factor_auth.is_enabled)
        print(f"Admins with 2FA enabled: {admins_with_2fa}/{admin_users.count()}")
    except Exception as e:
        print(f"Could not check 2FA status: {e}")
    
    # Count companies
    try:
        company_count = Company.objects.count()
        print(f"Partner companies in system: {company_count}")
    except Exception as e:
        print(f"Could not count companies: {e}")
    
    # Check system settings
    try:
        settings_exist = SystemSettings.objects.exists()
        print(f"System settings configured: {'Yes' if settings_exist else 'No'}")
    except Exception as e:
        print(f"Could not check system settings: {e}")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
