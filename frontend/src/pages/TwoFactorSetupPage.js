import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TwoFactorSetupPage.css';

/**
 * 2FA Setup Page - Shown to admins who need to configure 2FA
 * Allows choice between Email OTP or Authenticator App
 */
const TwoFactorSetupPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: choice, 2: email verify, 3: app scan, 4: complete
    const [selectedMethod, setSelectedMethod] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);

    useEffect(() => {
        // Get credentials from localStorage (set during login)
        const tempUser = JSON.parse(localStorage.getItem('temp_user') || '{}');
        const tempToken = localStorage.getItem('temp_token');
        const tempPassword = localStorage.getItem('temp_password');
        const tempEmail = localStorage.getItem('temp_email');

        if (!tempUser.username || !tempPassword) {
            // No credentials, redirect to login
            navigate('/login');
            return;
        }

        setUsername(tempUser.username);
        setPassword(tempPassword);
        setEmail(tempEmail || '');
        setToken(tempToken || '');

        // Check if we're coming from login with OTP already sent
        // If email is present and we're at step 1, it means OTP was already sent
        if (tempEmail && step === 1) {
            setSelectedMethod('email');
            setStep(2); // Skip to email verification step
        }
    }, [navigate]);

    // Function to mask email for privacy
    const maskEmail = (email) => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        if (!domain) return email;

        // Show first 2 and last 2 characters of local part
        if (localPart.length <= 4) {
            return `${localPart[0]}***@${domain}`;
        }

        const visibleStart = localPart.slice(0, 2);
        const visibleEnd = localPart.slice(-2);
        const maskedMiddle = '*'.repeat(Math.min(localPart.length - 4, 6));

        return `${visibleStart}${maskedMiddle}${visibleEnd}@${domain}`;
    };

    const handleMethodChoice = async (method) => {
        setSelectedMethod(method);
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/2fa/choose-method/', {
                username,
                password,
                method
            });

            if (method === 'email') {
                // Email method - code already sent
                setSuccess(response.data.message);
                setEmail(response.data.email);
                setStep(2); // Go to email verification step
            } else {
                // App method - get QR code
                const setupResponse = await axios.get('http://localhost:8000/api/2fa/setup/', {
                    headers: { 'Authorization': `Token ${response.data.token}` }
                });

                setQrCode(setupResponse.data.qr_code);
                setSecretKey(setupResponse.data.secret_key);
                setToken(response.data.token);
                setStep(3); // Go to QR scan step
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to initialize 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailVerification = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/2fa/email/verify/', {
                username,
                password,
                code: verificationCode.trim(),
                trust_device: rememberDevice
            });

            if (response.data.token && response.data.user) {
                // Clear temporary data
                localStorage.removeItem('temp_user');
                localStorage.removeItem('temp_password');
                localStorage.removeItem('temp_token');
                localStorage.removeItem('temp_email');

                // Set actual login data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('userRole', response.data.user.role);

                // Store device_token if provided (for device trust)
                if (response.data.device_token) {
                    localStorage.setItem('device_token', response.data.device_token);
                    console.log('[DEVICE TOKEN] Stored device token for trusted device');
                }

                setSuccess('2FA setup complete! Redirecting...');
                setTimeout(() => {
                    navigate('/admin/dashboard');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleAppVerification = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/2fa/verify-setup/', {
                code: verificationCode.trim()
            }, {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (response.data.message) {
                setSuccess('2FA setup complete! Redirecting...');

                // Clear temporary data
                localStorage.removeItem('temp_user');
                localStorage.removeItem('temp_password');
                localStorage.removeItem('temp_token');
                localStorage.removeItem('temp_email');

                // Set actual login data
                localStorage.setItem('token', token);

                setTimeout(() => {
                    navigate('/admin/dashboard');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/2fa/choose-method/', {
                username,
                password,
                method: 'email'
            });

            setSuccess('New code sent to ' + response.data.email);
            setVerificationCode(''); // Clear the input
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <div className="setup-header">
                    <div className="security-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <h1>Two-Factor Authentication Setup</h1>
                    <p className="subtitle">Required for administrator accounts</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '8px' }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '8px' }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        {success}
                    </div>
                )}

                {/* Step 1: Choose Method */}
                {step === 1 && (
                    <div className="step-content">
                        <h2>Choose Your 2FA Method</h2>
                        <p className="step-description">
                            Select how you'd like to receive verification codes when logging in:
                        </p>

                        <div className="method-options">
                            <button
                                className="method-card"
                                onClick={() => handleMethodChoice('email')}
                                disabled={loading || !email}
                            >
                                <div className="method-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                                <h3>Email OTP</h3>
                                <p className="method-description">
                                    Receive 6-digit codes via email
                                </p>
                                {email && <p className="method-detail">Send to: {maskEmail(email)}</p>}
                                {!email && (
                                    <p className="method-warning">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px' }}>
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        No email on file
                                    </p>
                                )}
                            </button>

                            <button
                                className="method-card"
                                onClick={() => handleMethodChoice('app')}
                                disabled={loading}
                            >
                                <div className="method-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                    </svg>
                                </div>
                                <h3>Authenticator App</h3>
                                <p className="method-description">
                                    Use Google Authenticator, Authy, or similar apps
                                </p>
                                <p className="method-detail">Scan QR code once</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Email Verification */}
                {step === 2 && (
                    <div className="step-content">
                        <div className="step-indicator">
                            <span className="step-badge">Email OTP Selected</span>
                        </div>

                        <h2>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}>
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            Check Your Email
                        </h2>
                        <p className="step-description">
                            A 6-digit verification code has been sent to:
                        </p>
                        <p className="email-display">{maskEmail(email)}</p>

                        <form onSubmit={handleEmailVerification} className="verification-form">
                            <div className="form-group">
                                <label>Enter the 6-digit code:</label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength="6"
                                    className="code-input"
                                    autoFocus
                                    required
                                />
                                <small className="help-text">Code expires in 10 minutes</small>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary btn-large"
                                disabled={loading || verificationCode.length !== 6}
                            >
                                {loading ? 'Verifying...' : 'Verify and Complete Setup'}
                            </button>
                        </form>

                        <button
                            type="button"
                            className="btn-resend"
                            onClick={handleResendCode}
                            disabled={loading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                            Resend Code
                        </button>

                        <button
                            className="btn-link"
                            onClick={() => setStep(1)}
                        >
                            ← Choose different method
                        </button>

                        {/* Remember Device Checkbox */}
                        <div className="remember-device-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: 'normal',
                                color: '#374151'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={rememberDevice}
                                    onChange={(e) => setRememberDevice(e.target.checked)}
                                    disabled={loading}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        cursor: 'pointer',
                                        accentColor: '#3b82f6'
                                    }}
                                />
                                <span>Remember this device for 7 days</span>
                            </label>
                            <small style={{ display: 'block', marginTop: '8px', marginLeft: '28px', color: '#6b7280', fontSize: '0.85rem' }}>
                                You won't need to enter a code on this device for 7 days
                            </small>
                        </div>
                    </div>
                )}

                {/* Step 3: App QR Code */}
                {step === 3 && (
                    <div className="step-content">
                        <div className="step-indicator">
                            <span className="step-badge">Authenticator App Selected</span>
                        </div>

                        <h2>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}>
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                            </svg>
                            Scan QR Code
                        </h2>
                        <p className="step-description">
                            Open your authenticator app and scan this QR code:
                        </p>

                        <div className="qr-section">
                            <img src={qrCode} alt="2FA QR Code" className="qr-image" />
                        </div>

                        <div className="manual-entry">
                            <p className="manual-label">Can't scan? Enter this code manually:</p>
                            <div className="secret-display">
                                <code>{secretKey}</code>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(secretKey);
                                        setSuccess('Secret key copied!');
                                        setTimeout(() => setSuccess(''), 2000);
                                    }}
                                    className="btn-copy"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="app-recommendations">
                            <p><strong>Recommended Apps:</strong></p>
                            <ul>
                                <li>Google Authenticator (Free)</li>
                                <li>Microsoft Authenticator (Free)</li>
                                <li>Authy (Free)</li>
                            </ul>
                        </div>

                        <form onSubmit={handleAppVerification} className="verification-form">
                            <div className="form-group">
                                <label>Enter the 6-digit code from your app:</label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength="6"
                                    className="code-input"
                                    required
                                />
                                <small className="help-text">The code changes every 30 seconds</small>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary btn-large"
                                disabled={loading || verificationCode.length !== 6}
                            >
                                {loading ? 'Verifying...' : 'Verify and Complete Setup'}
                            </button>
                        </form>

                        <button
                            type="button"
                            className="btn-resend"
                            onClick={handleResendCode}
                            disabled={loading}
                        >
                            🔄 Resend Code
                        </button>

                        <button
                            className="btn-link"
                            onClick={() => setStep(1)}
                        >
                            ← Choose different method
                        </button>
                    </div>
                )}

                <div className="setup-footer">
                    <p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        This is a one-time setup required for all administrator accounts
                    </p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('temp_user');
                            localStorage.removeItem('temp_password');
                            localStorage.removeItem('temp_token');
                            localStorage.removeItem('temp_email');
                            navigate('/login');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            marginTop: '15px',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            gap: '5px',
                            opacity: 0.8,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                    >
                        <span>←</span> Cancel and Return to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorSetupPage;
