import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TwoFactorAuth.css';

/**
 * 2FA Setup Component
 * This component allows admins to set up Two-Factor Authentication
 */
const TwoFactorSetup = ({ userToken, onSetupComplete }) => {
    const [step, setStep] = useState(1); // 1: setup, 2: verify, 3: backup codes
    const [qrCode, setQrCode] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Initialize 2FA setup
    const handleSetupStart = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('http://localhost:8000/api/2fa/setup/', {
                headers: { 'Authorization': `Token ${userToken}` }
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

    // Step 2: Verify setup with authenticator code
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
                { code: verificationCode },
                { headers: { 'Authorization': `Token ${userToken}` } }
            );

            setBackupCodes(response.data.backup_codes);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    // Download backup codes as text file
    const downloadBackupCodes = () => {
        const content = `EARIST OJT System - 2FA Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Save these codes in a secure location.
Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use
one of these codes to login to your account.
`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '2FA_Backup_Codes.txt';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="two-factor-setup">
            <h2>🔐 Two-Factor Authentication Setup</h2>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {/* Step 1: Start Setup */}
            {step === 1 && (
                <div className="setup-step">
                    <p>
                        Two-Factor Authentication adds an extra layer of security to your account.
                        You'll need a smartphone with an authenticator app.
                    </p>

                    <div className="app-recommendations">
                        <h4>Recommended Apps:</h4>
                        <ul>
                            <li>Google Authenticator (Free)</li>
                            <li>Authy (Free)</li>
                            <li>Microsoft Authenticator (Free)</li>
                        </ul>
                    </div>

                    <button
                        onClick={handleSetupStart}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Setting up...' : 'Start Setup'}
                    </button>
                </div>
            )}

            {/* Step 2: Scan QR Code */}
            {step === 2 && (
                <div className="setup-step">
                    <h3>Step 2: Scan QR Code</h3>
                    <p>Open your authenticator app and scan this QR code:</p>

                    <div className="qr-code-container">
                        <img src={qrCode} alt="2FA QR Code" />
                    </div>

                    <div className="manual-entry">
                        <p>Can't scan? Enter this code manually:</p>
                        <code className="secret-key">{secretKey}</code>
                    </div>

                    <form onSubmit={handleVerify}>
                        <div className="form-group">
                            <label>Enter the 6-digit code from your app:</label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                maxLength="6"
                                className="code-input"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || verificationCode.length !== 6}
                            className="btn-primary"
                        >
                            {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
                        </button>
                    </form>
                </div>
            )}

            {/* Step 3: Backup Codes */}
            {step === 3 && (
                <div className="setup-step">
                    <h3>✅ 2FA Enabled Successfully!</h3>

                    <div className="success-message">
                        Your two-factor authentication is now active.
                    </div>

                    <div className="backup-codes-section">
                        <h4>🔑 Your Backup Codes</h4>
                        <p className="warning">
                            ⚠️ Save these codes in a secure location. Each code can only be used once.
                        </p>

                        <div className="backup-codes-grid">
                            {backupCodes.map((code, index) => (
                                <div key={index} className="backup-code">
                                    <span className="code-number">{index + 1}.</span>
                                    <code>{code}</code>
                                </div>
                            ))}
                        </div>

                        <div className="actions">
                            <button onClick={downloadBackupCodes} className="btn-secondary">
                                📥 Download Backup Codes
                            </button>
                            <button onClick={onSetupComplete} className="btn-primary">
                                Done
                            </button>
                        </div>
                    </div>

                    <div className="info-box">
                        <h5>📱 Next Steps:</h5>
                        <ul>
                            <li>Your authenticator app will now generate codes every 30 seconds</li>
                            <li>You'll need to enter a code when logging in from a new device</li>
                            <li>Use backup codes if you lose access to your authenticator app</li>
                            <li>You can trust devices for 30 days to skip 2FA</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};


/**
 * 2FA Login Modal Component
 * Shown when user needs to enter 2FA code during login
 */
const TwoFactorLoginModal = ({ username, password, onSuccess, onCancel }) => {
    const [twoFACode, setTwoFACode] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [backupCode, setBackupCode] = useState('');
    const [trustDevice, setTrustDevice] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const loginData = {
                username,
                password,
                trust_device: trustDevice
            };

            if (useBackupCode) {
                loginData.backup_code = backupCode;
            } else {
                loginData.two_fa_code = twoFACode;
            }

            const response = await axios.post(
                'http://localhost:8000/api/login/',
                loginData
            );

            // Store token
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            onSuccess(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>🔐 Two-Factor Authentication</h3>

                <p className="modal-description">
                    Enter the 6-digit code from your authenticator app
                </p>

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!useBackupCode ? (
                        <div className="form-group">
                            <label>Authenticator Code:</label>
                            <input
                                type="text"
                                value={twoFACode}
                                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                maxLength="6"
                                className="code-input"
                                autoFocus
                            />
                            <small className="help-text">
                                The code changes every 30 seconds
                            </small>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Backup Code:</label>
                            <input
                                type="text"
                                value={backupCode}
                                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                                placeholder="ABCD1234"
                                className="code-input"
                                autoFocus
                            />
                            <small className="help-text">
                                Enter one of your backup codes
                            </small>
                        </div>
                    )}

                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={trustDevice}
                                onChange={(e) => setTrustDevice(e.target.checked)}
                            />
                            Trust this device for 30 days
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!useBackupCode && twoFACode.length !== 6) || (useBackupCode && !backupCode)}
                            className="btn-primary"
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>

                    <div className="toggle-mode">
                        <button
                            type="button"
                            onClick={() => setUseBackupCode(!useBackupCode)}
                            className="link-button"
                        >
                            {useBackupCode ? '← Use authenticator code' : 'Use backup code instead →'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


/**
 * 2FA Management Component (Settings Page)
 * Allows users to view status, disable 2FA, manage devices, etc.
 */
const TwoFactorManagement = ({ userToken }) => {
    const [status, setStatus] = useState(null);
    const [trustedDevices, setTrustedDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSetup, setShowSetup] = useState(false);

    useEffect(() => {
        loadStatus();
        loadTrustedDevices();
    }, []);

    const loadStatus = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/2fa/status/', {
                headers: { 'Authorization': `Token ${userToken}` }
            });
            setStatus(response.data);
        } catch (err) {
            console.error('Failed to load 2FA status', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTrustedDevices = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/2fa/trusted-devices/', {
                headers: { 'Authorization': `Token ${userToken}` }
            });
            setTrustedDevices(response.data.trusted_devices);
        } catch (err) {
            console.error('Failed to load trusted devices', err);
        }
    };

    const handleDisable2FA = async () => {
        const password = prompt('Enter your password to disable 2FA:');
        if (!password) return;

        try {
            await axios.post(
                'http://localhost:8000/api/2fa/disable/',
                { password },
                { headers: { 'Authorization': `Token ${userToken}` } }
            );

            alert('2FA has been disabled successfully');
            loadStatus();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to disable 2FA');
        }
    };

    const handleRemoveDevice = async (deviceId) => {
        if (!confirm('Remove this trusted device?')) return;

        try {
            await axios.delete(
                `http://localhost:8000/api/2fa/trusted-devices/${deviceId}/`,
                { headers: { 'Authorization': `Token ${userToken}` } }
            );

            loadTrustedDevices();
        } catch (err) {
            alert('Failed to remove device');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="two-factor-management">
            <h2>🔐 Two-Factor Authentication</h2>

            {!status?.is_enabled ? (
                <div className="disabled-state">
                    <p className="status-badge disabled">❌ Disabled</p>
                    <p>Two-factor authentication is not enabled for your account.</p>
                    <button onClick={() => setShowSetup(true)} className="btn-primary">
                        Enable 2FA
                    </button>

                    {showSetup && (
                        <TwoFactorSetup
                            userToken={userToken}
                            onSetupComplete={() => {
                                setShowSetup(false);
                                loadStatus();
                            }}
                        />
                    )}
                </div>
            ) : (
                <div className="enabled-state">
                    <p className="status-badge enabled">✅ Enabled</p>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{status.backup_codes_remaining}</div>
                            <div className="stat-label">Backup Codes Remaining</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-value">{status.trusted_devices_count}</div>
                            <div className="stat-label">Trusted Devices</div>
                        </div>
                    </div>

                    {status.enabled_at && (
                        <p className="info-text">
                            Enabled on: {new Date(status.enabled_at).toLocaleDateString()}
                        </p>
                    )}

                    <div className="actions-section">
                        <button onClick={handleDisable2FA} className="btn-danger">
                            Disable 2FA
                        </button>
                    </div>

                    {trustedDevices.length > 0 && (
                        <div className="trusted-devices-section">
                            <h3>Trusted Devices</h3>
                            <div className="devices-list">
                                {trustedDevices.map(device => (
                                    <div key={device.id} className="device-card">
                                        <div className="device-info">
                                            <strong>{device.device_name}</strong>
                                            {device.is_current && <span className="badge">Current</span>}
                                            <div className="device-meta">
                                                <small>IP: {device.ip_address}</small>
                                                <small>Expires: {new Date(device.expires_at).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveDevice(device.id)}
                                            className="btn-remove"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export { TwoFactorSetup, TwoFactorLoginModal, TwoFactorManagement };
