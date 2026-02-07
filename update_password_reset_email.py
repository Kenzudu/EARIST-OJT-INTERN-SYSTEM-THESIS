"""
Update password reset email with beautiful HTML template matching 2FA design
"""

# Read the file
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\backend\core\views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the password reset email section
old_section = '''        # Prepare HTML email
        student_name = user.get_full_name() or user.username
        subject = "🔒 Password Reset Request"
        
        content = f"""
        <p>We received a request to reset the password for your EARIST OJT System account.</p>
        
        <div class="highlight-box">
            <div class="info-row"><span class="info-label">New Password:</span> <strong style="font-size: 18px; letter-spacing: 1px;">{new_password}</strong></div>
        </div>
        
        <p><strong>Important:</strong></p>
        <ul>
            <li>Use this password to log in immediately.</li>
            <li>For security, please change this password after logging in.</li>
            <li>If you did not request this change, please contact the administrator immediately.</li>
        </ul>
        """
        
        html_email = get_email_template(student_name, subject, content, "http://localhost:3000/login", "Log In Now")
        
        # Send email
        success = send_html_email(subject, user.email, html_email)
        
        if success:
            return Response({
                'message': f'A new password has been sent to {user.email}. Please check your inbox.'
            }, status=status.HTTP_200_OK)
        else:
            # If email fails, return error
            return Response({
                'error': 'Failed to send email. Please check your internet connection or try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)'''

new_section = '''        # Send beautiful HTML email
        try:
            from django.core.mail import EmailMultiAlternatives
            
            student_name = user.get_full_name() or user.username
            
            # HTML email template
            html_content = f\'\'\'
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
\'\'\'
            
            # Plain text version
            text_content = f\'\'\'Password Reset Request

Hello {student_name},

We received a request to reset your password.

Your new password is: {new_password}

Important:
- Use this password to log in immediately
- Change this password after logging in for security
- If you didn't request this, contact admin immediately

Log in at: http://localhost:3000/login

Best regards,
EARIST OJT System\'\'\'
            
            # Create email with both HTML and plain text
            email_msg = EmailMultiAlternatives(
                subject='Password Reset Request - EARIST OJT System',
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            email_msg.attach_alternative(html_content, "text/html")
            email_msg.send(fail_silently=False)
            
            return Response({
                'message': f'A new password has been sent to {user.email}. Please check your inbox.'
            }, status=status.HTTP_200_OK)
            
        except Exception as email_error:
            # If email fails, return error
            return Response({
                'error': 'Failed to send email. Please check your internet connection or try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)'''

if old_section in content:
    content = content.replace(old_section, new_section)
    
    # Write back
    with open(r'c:\Users\Kenzu\Desktop\Earist OJT\backend\core\views.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Successfully updated password reset email with beautiful HTML template!")
else:
    print("❌ Could not find the code to replace.")
    print("The function might have changed or the formatting is different.")
