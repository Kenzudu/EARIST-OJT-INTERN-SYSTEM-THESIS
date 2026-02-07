"""
Update email verification code email with beautiful HTML template
"""

# Read the file
with open(r'c:\Users\Kenzu\Desktop\Earist OJT\backend\core\views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the send_mail section in send_verification_code function
old_code = '''    # Send email
    try:
        send_mail(
            subject='Email Verification Code - EARIST OJT System',
            message=f'Your verification code is: {code}\\n\\nThis code will expire in 1 hour.\\n\\nIf you did not request this code, please ignore this email.',
            from_email='EARIST OJT System <earistojtsys@gmail.com>',
            recipient_list=[email],
            fail_silently=False,
        )'''

new_code = '''    # Send email
    try:
        from django.core.mail import EmailMultiAlternatives
        
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
\'\'\'
        
        # Plain text version
        text_content = f\'\'\'Your verification code is: {code}

This code will expire in 1 hour.

If you did not request this code, please ignore this email.

Best regards,
EARIST OJT System\'\'\'
        
        # Create email with both HTML and plain text
        email_msg = EmailMultiAlternatives(
            subject='Email Verification Code - EARIST OJT System',
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email]
        )
        email_msg.attach_alternative(html_content, "text/html")
        email_msg.send(fail_silently=False)'''

if old_code in content:
    content = content.replace(old_code, new_code)
    
    # Write back
    with open(r'c:\Users\Kenzu\Desktop\Earist OJT\backend\core\views.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Successfully updated registration email with beautiful HTML template!")
else:
    print("❌ Could not find the code to replace. The function might have changed.")
