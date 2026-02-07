"""
Two-Factor Authentication Utility Functions
Handles TOTP generation, QR code creation, and verification
"""
import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import TwoFactorAuth, BackupCode, TrustedDevice, TwoFactorAuditLog


def generate_secret_key():
    """Generate a random secret key for TOTP"""
    return pyotp.random_base32()


def generate_totp_uri(user, secret_key):
    """Generate TOTP URI for QR code"""
    # Use email if available, otherwise use username
    account_name = user.email if user.email else user.username
    issuer_name = "EARIST OJT System"
    
    totp = pyotp.TOTP(secret_key)
    return totp.provisioning_uri(
        name=account_name,
        issuer_name=issuer_name
    )


def generate_qr_code(totp_uri):
    """Generate QR code image from TOTP URI and return as base64"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def verify_totp_code(secret_key, code):
    """Verify a TOTP code"""
    totp = pyotp.TOTP(secret_key)
    # Allow a window of 1 interval (30 seconds) before and after
    return totp.verify(code, valid_window=1)


def generate_backup_codes(user, count=8):
    """Generate backup codes for a user"""
    codes = []
    
    # Delete existing unused backup codes
    BackupCode.objects.filter(user=user, is_used=False).delete()
    
    for _ in range(count):
        # Generate a random 8-character alphanumeric code
        code = secrets.token_hex(4).upper()  # 8 characters
        BackupCode.objects.create(user=user, code=code)
        codes.append(code)
    
    return codes


def verify_backup_code(user, code):
    """Verify and consume a backup code"""
    try:
        backup_code = BackupCode.objects.get(
            user=user,
            code=code.upper(),
            is_used=False
        )
        backup_code.is_used = True
        backup_code.used_at = timezone.now()
        backup_code.save()
        return True
    except BackupCode.DoesNotExist:
        return False


def generate_device_id(request, device_token=None):
    """Generate a unique device identifier from request metadata and optional device token"""
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    ip_address = get_client_ip(request)
    
    # If device_token is provided (from localStorage), use it for more accurate device identification
    if device_token:
        device_string = f"{device_token}:{user_agent}:{ip_address}"
    else:
        # Fallback to user agent + IP (less accurate, incognito will be same device)
        device_string = f"{user_agent}:{ip_address}"
    
    device_id = hashlib.sha256(device_string.encode()).hexdigest()
    
    return device_id


def get_device_name(request):
    """Extract a user-friendly device name from user agent"""
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Simple parsing for common browsers and OS
    device_name = "Unknown Device"
    
    if 'Chrome' in user_agent:
        browser = 'Chrome'
    elif 'Firefox' in user_agent:
        browser = 'Firefox'
    elif 'Safari' in user_agent and 'Chrome' not in user_agent:
        browser = 'Safari'
    elif 'Edge' in user_agent:
        browser = 'Edge'
    else:
        browser = 'Browser'
    
    if 'Windows' in user_agent:
        os_name = 'Windows'
    elif 'Mac' in user_agent:
        os_name = 'Mac'
    elif 'Linux' in user_agent:
        os_name = 'Linux'
    elif 'Android' in user_agent:
        os_name = 'Android'
    elif 'iPhone' in user_agent or 'iPad' in user_agent:
        os_name = 'iOS'
    else:
        os_name = 'Unknown OS'
    
    device_name = f"{browser} on {os_name}"
    return device_name


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def is_device_trusted(user, request, device_token=None):
    """Check if the current device is trusted"""
    device_id = generate_device_id(request, device_token)
    
    try:
        device = TrustedDevice.objects.get(
            user=user,
            device_id=device_id,
            is_active=True,
            expires_at__gt=timezone.now()
        )
        # Update last used time
        device.last_used_at = timezone.now()
        device.save()
        return True
    except TrustedDevice.DoesNotExist:
        return False


def trust_device(user, request, days=7, device_token=None):
    """Mark the current device as trusted and return a device token"""
    # Generate a unique device token if not provided
    if not device_token:
        device_token = secrets.token_urlsafe(32)
    
    device_id = generate_device_id(request, device_token)
    device_name = get_device_name(request)
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Debug logging
    print(f"[TRUST DEVICE] User: {user.username}, Device ID: {device_id}, Token: {device_token[:16]}..., Days: {days}")
    
    # Check if device already exists
    device, created = TrustedDevice.objects.get_or_create(
        user=user,
        device_id=device_id,
        defaults={
            'device_name': device_name,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'expires_at': timezone.now() + timedelta(days=days),
            'is_active': True
        }
    )
    
    if not created:
        # Update existing device
        device.device_name = device_name
        device.ip_address = ip_address
        device.user_agent = user_agent
        device.expires_at = timezone.now() + timedelta(days=days)
        device.is_active = True
        device.save()
        print(f"[TRUST DEVICE] Updated existing device for {user.username}")
    else:
        print(f"[TRUST DEVICE] Created new trusted device for {user.username}")
    
    return device, device_token


def log_2fa_event(user, action, request=None, details=''):
    """Log a 2FA-related event"""
    ip_address = None
    user_agent = ''
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    TwoFactorAuditLog.objects.create(
        user=user,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details
    )


def is_2fa_required(user):
    """Check if 2FA is required for this user"""
    # Check if user has 2FA enabled
    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
        return two_factor.is_enabled and two_factor.is_verified
    except TwoFactorAuth.DoesNotExist:
        return False


def setup_2fa_for_user(user):
    """Initialize 2FA setup for a user"""
    # Check if user already has 2FA
    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
        # If already enabled, return existing
        if two_factor.is_enabled:
            return None, "2FA already enabled"
    except TwoFactorAuth.DoesNotExist:
        # Create new 2FA record
        secret_key = generate_secret_key()
        two_factor = TwoFactorAuth.objects.create(
            user=user,
            secret_key=secret_key,
            is_enabled=False,
            is_verified=False
        )
    
    # Generate new secret if not verified
    if not two_factor.is_verified:
        two_factor.secret_key = generate_secret_key()
        two_factor.save()
    
    return two_factor, None


# ========== QR CODE FOR STUDENT PROFILE ==========

def generate_student_qr_token(user_id):
    """Generate permanent encrypted token for student QR code"""
    import secrets
    from cryptography.fernet import Fernet
    from django.conf import settings
    
    # Create encryption key from Django secret (use first 32 bytes, base64 encoded)
    secret_bytes = settings.SECRET_KEY.encode()[:32].ljust(32, b'0')
    key = base64.urlsafe_b64encode(secret_bytes)
    cipher = Fernet(key)
    
    # Create payload with user_id and random salt for uniqueness
    salt = secrets.token_hex(8)
    payload = f"{user_id}:{salt}".encode()
    
    # Encrypt and return token
    encrypted_token = cipher.encrypt(payload).decode()
    return encrypted_token


def decrypt_student_qr_token(token):
    """Decrypt student QR token to get user_id"""
    from cryptography.fernet import Fernet
    from django.conf import settings
    
    try:
        # Recreate encryption key
        secret_bytes = settings.SECRET_KEY.encode()[:32].ljust(32, b'0')
        key = base64.urlsafe_b64encode(secret_bytes)
        cipher = Fernet(key)
        
        # Decrypt token
        decrypted = cipher.decrypt(token.encode()).decode()
        user_id_str, salt = decrypted.split(':', 1)
        return int(user_id_str)
    except Exception as e:
        return None


def generate_student_qr_code(token):
    """Generate QR code image for student profile access"""
    from django.conf import settings
    
    # Create URL that points to public student profile
    # In production, use actual domain
    base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    profile_url = f"{base_url}/public/student/{token}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(profile_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode()
    
    return f"data:image/png;base64,{img_base64}"
