import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.email_notifications import get_email_template, send_html_email

def send_test_email():
    try:
        # Get student
        student = User.objects.get(username='234-03828M')
        print(f"Sending test email to: {student.email}")
        
        # Create dummy content for test
        student_name = student.get_full_name() or student.username
        position = "Software Engineer Intern"
        company = "Tech Solutions Inc."
        
        subject = "🎉 TEST: Application Approved"
        
        content = f"""
        <p><strong>NOTE: This is a TEST email to verify the new design.</strong></p>
        
        <p>Great news! Your application for <strong>{position}</strong> at <strong>{company}</strong> has been approved.</p>
        
        <div class="highlight-box">
            <div class="info-row"><span class="info-label">Position:</span> {position}</div>
            <div class="info-row"><span class="info-label">Company:</span> {company}</div>
            <div class="info-row"><span class="info-label">Status:</span> <span class="status-badge status-approved">Approved</span></div>
        </div>
        
        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Log in to your account to view the full details.</li>
            <li>Upload any required pre-training documents.</li>
            <li>Wait for your coordinator's final go-signal.</li>
        </ul>
        """
        
        # Generate HTML
        html_email = get_email_template(
            recipient_name=student_name,
            title=subject,
            content_html=content,
            action_url="http://localhost:3000/student/dashboard",
            action_text="Go to Dashboard"
        )
        
        # Send
        success = send_html_email(subject, student.email, html_email)
        
        if success:
            print("✅ Test email sent successfully!")
        else:
            print("❌ Failed to send test email.")
            
    except User.DoesNotExist:
        print("❌ User 234-03828M not found.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    send_test_email()
