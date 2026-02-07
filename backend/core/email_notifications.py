"""
Email notification utilities for EARIST OJT System
Sends professional HTML notifications to students
"""

from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags

def get_email_template(recipient_name, title, content_html, action_url=None, action_text="View Details"):
    """
    Generates a professional HTML email template similar to Loom's design
    """
    # EARIST Maroon: #800000
    # Gold/Yellow: #FFD700
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
                background-color: #f9f9f9;
            }}
            .wrapper {{
                width: 100%;
                background-color: #f9f9f9;
                padding: 40px 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }}
            .logo {{
                margin-bottom: 30px;
            }}
            .logo-text {{
                font-size: 24px;
                font-weight: 800;
                color: #800000;
                text-decoration: none;
                letter-spacing: -0.5px;
            }}
            .logo-sub {{
                color: #333;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #111;
            }}
            .content {{
                font-size: 16px;
                color: #444;
                margin-bottom: 30px;
            }}
            .highlight-box {{
                background-color: #f8f9fa;
                border-left: 4px solid #800000;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .info-row {{
                margin-bottom: 8px;
            }}
            .info-label {{
                font-weight: 600;
                color: #555;
                min-width: 100px;
                display: inline-block;
            }}
            .status-badge {{
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
            }}
            .status-approved {{ background-color: #e6f4ea; color: #1e7e34; }}
            .status-rejected {{ background-color: #fce8e6; color: #c5221f; }}
            .status-pending {{ background-color: #fef7e0; color: #b06000; }}
            
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background-color: #800000;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin-top: 10px;
                text-align: center;
            }}
            .button:hover {{
                background-color: #600000;
            }}
            ul {{
                padding-left: 20px;
                margin-top: 10px;
            }}
            li {{
                margin-bottom: 8px;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eaeaea;
                font-size: 13px;
                color: #888;
                text-align: center;
            }}
            .footer a {{
                color: #888;
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="logo">
                    <div class="logo-text">EARIST <span class="logo-sub">OJT System</span></div>
                </div>
                
                <div class="greeting">Hi {recipient_name} 👋</div>
                
                <div class="content">
                    {content_html}
                </div>
                
                {f'<a href="{action_url}" class="button">{action_text}</a>' if action_url else ''}
                
                <div class="footer">
                    <p>This email was sent to you by the EARIST OJT Management System.</p>
                    <p>Eulogio "Amang" Rodriguez Institute of Science and Technology<br>
                    Naguahan, Sampaloc, Manila</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

def send_html_email(subject, recipient_email, html_content):
    """Helper to send HTML email with plain text fallback"""
    try:
        plain_message = strip_tags(html_content)
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_content,
            fail_silently=False,
        )
        print(f"✅ HTML Email sent to {recipient_email}: {subject}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {recipient_email}: {str(e)}")
        return False

def send_application_status_email(application, old_status, new_status):
    student = application.student
    if not student.email: return
    
    student_name = student.get_full_name() or student.username
    internship = application.internship
    position = internship.position if internship else "Position"
    company = internship.company.name if internship and internship.company else "Company"
    
    login_url = "http://localhost:3000/login"
    
    if new_status == 'Approved':
        subject = "🎉 Congratulations! Application Approved"
        content = f"""
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
        
    elif new_status == 'Rejected':
        subject = "Application Status Update"
        content = f"""
        <p>We're writing to update you on your application for <strong>{position}</strong> at <strong>{company}</strong>.</p>
        
        <div class="highlight-box">
            <div class="info-row"><span class="info-label">Position:</span> {position}</div>
            <div class="info-row"><span class="info-label">Company:</span> {company}</div>
            <div class="info-row"><span class="info-label">Status:</span> <span class="status-badge status-rejected">Not Approved</span></div>
        </div>
        
        <p>Don't be discouraged! You can browse other available internships in the system that match your skills.</p>
        """
        
    elif new_status == 'Completed':
        subject = "🎓 Internship Completed!"
        content = f"""
        <p>Congratulations! Your internship has been marked as <strong>Completed</strong>.</p>
        
        <div class="highlight-box">
            <div class="info-row"><span class="info-label">Position:</span> {position}</div>
            <div class="info-row"><span class="info-label">Company:</span> {company}</div>
            <div class="info-row"><span class="info-label">Status:</span> <span class="status-badge status-approved">Completed</span></div>
        </div>
        
        <p>You have successfully finished your OJT requirements for this position. Your final grade and completion certificate will be available in your dashboard.</p>
        """
    else:
        subject = "Application Status Update"
        content = f"""
        <p>Your application status has been updated.</p>
        
        <div class="highlight-box">
            <div class="info-row"><span class="info-label">Position:</span> {position}</div>
            <div class="info-row"><span class="info-label">Company:</span> {company}</div>
            <div class="info-row"><span class="info-label">New Status:</span> <strong>{new_status}</strong></div>
        </div>
        """

    html_email = get_email_template(student_name, subject, content, login_url, "Go to Dashboard")
    return send_html_email(subject, student.email, html_email)

def send_task_assignment_email(task):
    student = task.student
    if not student.email: return
    
    student_name = student.get_full_name() or student.username
    deadline = task.deadline.strftime('%B %d, %Y') if task.deadline else 'No deadline'
    
    subject = f"📋 New Task: {task.title}"
    content = f"""
    <p>A new task has been assigned to you by your supervisor.</p>
    
    <div class="highlight-box">
        <div class="info-row"><span class="info-label">Task:</span> {task.title}</div>
        <div class="info-row"><span class="info-label">Priority:</span> {task.priority}</div>
        <div class="info-row"><span class="info-label">Deadline:</span> {deadline}</div>
    </div>
    
    <p><strong>Description:</strong><br>{task.description}</p>
    """
    
    html_email = get_email_template(student_name, subject, content, "http://localhost:3000/student/tasks", "View Task")
    return send_html_email(subject, student.email, html_email)

def send_evaluation_notification_email(evaluation):
    student = evaluation.student
    if not student.email: return
    
    student_name = student.get_full_name() or student.username
    
    subject = "📊 Performance Evaluation Received"
    content = f"""
    <p>Your supervisor has submitted a performance evaluation for you.</p>
    
    <div class="highlight-box">
        <div class="info-row"><span class="info-label">Overall Rating:</span> <strong>{evaluation.overall_rating}/5.0</strong></div>
        <div class="info-row"><span class="info-label">Grade:</span> {evaluation.grade}</div>
    </div>
    
    <p>Log in to your dashboard to view the detailed breakdown of your evaluation and any feedback provided.</p>
    """
    
    html_email = get_email_template(student_name, subject, content, "http://localhost:3000/student/evaluation", "View Evaluation")
    return send_html_email(subject, student.email, html_email)

def send_journal_feedback_email(journal):
    student = journal.student
    if not student.email: return
    
    student_name = student.get_full_name() or student.username
    date_str = journal.date.strftime('%B %d, %Y')
    
    status_class = "status-approved" if journal.status == 'Approved' else "status-rejected"
    
    subject = f"Journal Entry Update - {date_str}"
    content = f"""
    <p>Your daily journal entry for <strong>{date_str}</strong> has been reviewed.</p>
    
    <div class="highlight-box">
        <div class="info-row"><span class="info-label">Date:</span> {date_str}</div>
        <div class="info-row"><span class="info-label">Hours:</span> {journal.hours_rendered}</div>
        <div class="info-row"><span class="info-label">Status:</span> <span class="status-badge {status_class}">{journal.status}</span></div>
    </div>
    """
    
    if journal.supervisor_comment:
        content += f"""
        <p><strong>Supervisor Comments:</strong><br>
        <em>"{journal.supervisor_comment}"</em></p>
        """
    
    html_email = get_email_template(student_name, subject, content, "http://localhost:3000/student/journals", "View Journal")
    return send_html_email(subject, student.email, html_email)
