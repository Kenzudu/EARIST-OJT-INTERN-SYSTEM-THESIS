import React, { useState } from 'react';
import axios from 'axios';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6 || newPassword.length > 12) {
            setError('Password must be 6-12 characters');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8000/api/change-password/',
                {
                    old_password: oldPassword,
                    new_password: newPassword
                },
                {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                }
            );

            setSuccess('Password changed successfully!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Close modal after 2 seconds
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>🔒 Change Password</h2>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password (6-12 characters)</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="button-group">
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }

                .modal-content h2 {
                    margin: 0 0 1.5rem 0;
                    color: #333;
                    text-align: center;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #555;
                    font-weight: 500;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                    box-sizing: border-box;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .button-group {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .btn-primary, .btn-secondary {
                    flex: 1;
                    padding: 0.75rem;
                    border: none;
                    border-radius: 4px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: #667eea;
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #5568d3;
                }

                .btn-secondary {
                    background: #e0e0e0;
                    color: #333;
                }

                .btn-secondary:hover:not(:disabled) {
                    background: #d0d0d0;
                }

                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .alert {
                    padding: 0.75rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    text-align: center;
                }

                .alert-error {
                    background: #fee;
                    color: #c00;
                    border-left: 3px solid #c00;
                }

                .alert-success {
                    background: #d4edda;
                    color: #155724;
                    border-left: 3px solid #28a745;
                }
            `}</style>
        </div>
    );
};

export default ChangePasswordModal;
