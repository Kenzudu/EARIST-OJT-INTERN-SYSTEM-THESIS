"""
Email Configuration Test Script for EARIST OJT System
This script helps diagnose and fix email configuration issues.
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

def check_email_configuration():
    """Check if email is properly configured"""
    print("\n" + "="*60)
    print("EMAIL CONFIGURATION CHECK")
    print("="*60 + "\n")
    
    print(f"📧 Email Backend: {settings.EMAIL_BACKEND}")
    print(f"🌐 SMTP Host: {settings.EMAIL_HOST}")
    print(f"🔌 SMTP Port: {settings.EMAIL_PORT}")
    print(f"🔒 Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"👤 Email User: {settings.EMAIL_HOST_USER}")
    print(f"🔑 Email Password: {'✅ SET' if settings.EMAIL_HOST_PASSWORD else '❌ NOT SET'}")
    print(f"📨 Default From Email: {settings.DEFAULT_FROM_EMAIL}")
    
    if not settings.EMAIL_HOST_PASSWORD:
        print("\n" + "⚠️ "*20)
        print("❌ EMAIL PASSWORD IS NOT CONFIGURED!")
        print("⚠️ "*20)
        print("\n📋 TO FIX THIS ISSUE:")
        print("\n1. Go to your Google Account: https://myaccount.google.com/")
        print("2. Navigate to Security → 2-Step Verification (enable if not enabled)")
        print("3. Go to Security → App Passwords")
        print("4. Generate a new app password for 'Mail'")
        print("5. Copy the 16-character password")
        print("\n6. Open the .env file in the backend directory:")
        print(f"   Location: {os.path.join(os.path.dirname(__file__), '.env')}")
        print("\n7. Add or update this line:")
        print("   EMAIL_PASSWORD=your_16_character_app_password_here")
        print("\n8. Restart the Django server")
        print("\n" + "="*60 + "\n")
        return False
    
    print("\n✅ Email configuration looks good!\n")
    return True

def send_test_email(recipient_email=None):
    """Send a test email to verify configuration"""
    if not recipient_email:
        recipient_email = input("\n📧 Enter recipient email address for test: ").strip()
    
    if not recipient_email:
        print("❌ No email address provided. Test cancelled.")
        return False
    
    print(f"\n📤 Sending test email to {recipient_email}...")
    
    try:
        html_content = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #667eea;">✅ Email Test Successful!</h2>
        <p>This is a test email from the EARIST OJT System.</p>
        <p>If you received this email, your email configuration is working correctly!</p>
        <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
            EARIST OJT System - Email Configuration Test<br>
            Sent at: {timestamp}
        </p>
    </div>
</body>
</html>
'''.format(timestamp=__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        text_content = '''
Email Test Successful!

This is a test email from the EARIST OJT System.
If you received this email, your email configuration is working correctly!

EARIST OJT System - Email Configuration Test
'''
        
        email_msg = EmailMultiAlternatives(
            subject='✅ EARIST OJT System - Email Test',
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email_msg.attach_alternative(html_content, "text/html")
        email_msg.send(fail_silently=False)
        
        print(f"✅ Test email sent successfully to {recipient_email}!")
        print("📬 Please check your inbox (and spam folder)")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to send test email!")
        print(f"Error: {str(e)}\n")
        
        error_message = str(e).lower()
        if 'authentication' in error_message or 'username and password not accepted' in error_message:
            print("🔍 Diagnosis: Email authentication failed")
            print("💡 Solution: Check your EMAIL_PASSWORD in the .env file")
            print("   Make sure you're using a Gmail App Password, not your regular password")
        elif 'connection' in error_message or 'timeout' in error_message:
            print("🔍 Diagnosis: Connection to email server failed")
            print("💡 Solution: Check your internet connection and firewall settings")
        else:
            print("🔍 Diagnosis: Unknown error")
            print("💡 Solution: Check the error message above for details")
        
        return False

def main():
    """Main function"""
    print("\n🔧 EARIST OJT System - Email Configuration Tool")
    
    # Check configuration
    config_ok = check_email_configuration()
    
    if not config_ok:
        print("⚠️  Please fix the email configuration before testing.")
        return
    
    # Ask if user wants to send test email
    choice = input("\n📧 Would you like to send a test email? (y/n): ").strip().lower()
    
    if choice == 'y':
        send_test_email()
    else:
        print("\n✅ Configuration check complete!")
    
    print("\n" + "="*60)
    print("For password reset to work, make sure:")
    print("1. ✅ EMAIL_PASSWORD is set in .env file")
    print("2. ✅ Users have valid email addresses in the database")
    print("3. ✅ Internet connection is working")
    print("4. ✅ Gmail allows 'Less secure app access' or use App Password")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
