import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MandatoryTwoFactorSetup from '../components/MandatoryTwoFactorSetup';

/**
 * Admin 2FA Setup Page
 * Shown to admin users who haven't set up 2FA yet
 */
const AdminTwoFactorSetupPage = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Get temporary credentials from localStorage
        const tempToken = localStorage.getItem('temp_token');
        const tempUser = JSON.parse(localStorage.getItem('temp_user') || '{}');

        if (!tempToken || !tempUser.username) {
            // No temp credentials, redirect to login
            navigate('/login');
            return;
        }

        setToken(tempToken);
        setUsername(tempUser.username);
    }, [navigate]);

    const handleSetupComplete = () => {
        // Clear temporary credentials
        localStorage.removeItem('temp_token');
        localStorage.removeItem('temp_user');

        // Login again to get full access
        alert('2FA setup complete! Please login again with your new 2FA code.');
        navigate('/login');
    };

    if (!token) {
        return <div>Loading...</div>;
    }

    return (
        <MandatoryTwoFactorSetup
            token={token}
            username={username}
            onSetupComplete={handleSetupComplete}
        />
    );
};

export default AdminTwoFactorSetupPage;
