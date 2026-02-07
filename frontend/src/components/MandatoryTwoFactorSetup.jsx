import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MandatoryTwoFactorSetup.css';

/**
 * Mandatory 2FA Setup Component
 * Forces admin users to set up 2FA before accessing the system
 */
const MandatoryTwoFactorSetup = ({ token, username, onSetupComplete }) => {
    const [step, setStep] = useState(1); // 1: intro, 2: scan QR, 3: verify, 4: backup codes
    const [qrCode, setQrCode] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(false);
    const navigate = useNavigate();

    // Auto-start setup when component mounts
    useEffect(() => {
        if (step === 1) {
            handleStartSetup();
        }
    }, []);

    const handleStartSetup = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('http://localhost:8000/api/2fa/setup/', {
                headers: { 'Authorization': `Token ${token}` }
            });

            setQrCode(response.data.qr_code);
            setSecretKey(response.data.secret_key);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to initialize 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (verificationCode.length !== 6) {
            setError('Verification code must be 6 digits');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:8000/api/2fa/verify-setup/',
                {
                    code: verificationCode,
                    trust_device: rememberDevice
                },
                { headers: { 'Authorization': `Token ${token}` } }
            );

            setBackupCodes(response.data.backup_codes);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid verification code');
            setVerificationCode(''); // Clear the input
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = () => {
        // Redirect to admin dashboard
        if (onSetupComplete) {
            onSetupComplete();
        } else {
            navigate('/admin/dashboard');
        }
    };

    const downloadBackupCodes = () => {
        const content = `EARIST OJT System - 2FA Backup Codes
Generated: ${new Date().toLocaleString()}
Username: ${username}

⚠️ IMPORTANT: Save these codes in a secure location.
Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use
one of these codes to login to your account.
`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `2FA_Backup_Codes_${username}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="mandatory-2fa-container">
            <div className="mandatory-2fa-card">
                <div className="mandatory-2fa-header">
                    <div className="security-icon">🔐</div>
                    <h1>Two-Factor Authentication Required</h1>
                    <p className="subtitle">Enhanced security for administrator accounts</p>
                </div>

                {error && (
                    <div className="error-banner">
                        ⚠️ {error}
                    </div>
                )}

                {/* Step 2: Scan QR Code */}
                {step === 2 && (
                    <div className="setup-content">
                        <div className="step-indicator">
                            <span className="step-number">Step 1 of 2</span>
                        </div>

                        <h2>📱 Scan QR Code</h2>
                        <p className="instruction">
                            Open your authenticator app and scan this QR code:
                        </p>

                        <div className="qr-code-section">
                            <img src={qrCode} alt="2FA QR Code" className="qr-code-image" />
                        </div>

                        <div className="manual-entry-section">
                            <p className="manual-entry-label">Can't scan? Enter this code manually:</p>
                            <div className="secret-key-display">
                                <code>{secretKey}</code>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(secretKey);
                                        alert('Secret key copied to clipboard!');
                                    }}
                                    className="copy-button"
                                >
                                    📋 Copy
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

                        <form onSubmit={handleVerify} className="verification-form">
                            <div className="form-group">
                                <label>Enter the 6-digit code from your app:</label>
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
                                <small className="help-text">The code changes every 30 seconds</small>
                            </div>

                            {/* Remember Device Checkbox */}
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 'normal'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={rememberDevice}
                                        onChange={(e) => setRememberDevice(e.target.checked)}
                                        disabled={loading}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span>Remember this device for 7 days</span>
                                </label>
                                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85rem', marginLeft: '28px' }}>
                                    You won't need to enter a code on this device for 7 days
                                </small>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || verificationCode.length !== 6}
                                className="btn-primary btn-large"
                            >
                                {loading ? 'Verifying...' : 'Verify and Continue'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 3: Backup Codes */}
                {step === 3 && (
                    <div className="setup-content">
                        <div className="success-icon">✅</div>
                        <h2>2FA Enabled Successfully!</h2>

                        <div className="backup-codes-section">
                            <h3>🔑 Your Backup Codes</h3>
                            <div className="warning-box">
                                <strong>⚠️ IMPORTANT:</strong> Save these codes in a secure location.
                                Each code can only be used once for emergency access.
                            </div>

                            <div className="backup-codes-grid">
                                {backupCodes.map((code, index) => (
                                    <div key={index} className="backup-code-item">
                                        <span className="code-number">{index + 1}.</span>
                                        <code className="backup-code-value">{code}</code>
                                    </div>
                                ))}
                            </div>

                            <div className="backup-actions">
                                <button onClick={downloadBackupCodes} className="btn-secondary">
                                    📥 Download Backup Codes
                                </button>
                            </div>
                        </div>

                        <div className="info-box">
                            <h4>📌 What's Next?</h4>
                            <ul>
                                <li>Your authenticator app will generate codes every 30 seconds</li>
                                <li>You'll need to enter a code when logging in</li>
                                <li>Use backup codes if you lose access to your authenticator app</li>
                                <li>You can trust devices for 30 days to skip 2FA</li>
                            </ul>
                        </div>

                        <button onClick={handleComplete} className="btn-primary btn-large">
                            Continue to Dashboard →
                        </button>
                    </div>
                )}

                {loading && step === 1 && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Setting up 2FA...</p>
                    </div>
                )}
            </div>

            <div className="mandatory-footer">
                <p>🔒 This is a one-time setup required for all administrator accounts</p>
            </div>
        </div>
    );
};

export default MandatoryTwoFactorSetup;
