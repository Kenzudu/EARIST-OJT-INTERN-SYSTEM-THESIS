import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionTimeout = () => {
    const navigate = useNavigate();
    const lastActivityRef = useRef(Date.now());

    const logout = useCallback(() => {
        // Check if already logged out to avoid double alerts
        if (!localStorage.getItem('token')) return;

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        alert("Session timed out due to inactivity.");
    }, [navigate]);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return; // Not logged in

        let user;
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            return;
        }

        // Reset activity timestamp when user is logged in
        lastActivityRef.current = Date.now();

        // 5 minutes for admin (staff), 10 minutes for student
        const timeoutDuration = user.is_staff ? 5 * 60 * 1000 : 10 * 60 * 1000;

        const checkTimeout = () => {
            if (Date.now() - lastActivityRef.current > timeoutDuration) {
                logout();
            }
        };

        const interval = setInterval(checkTimeout, 1000);

        const updateActivity = () => {
            lastActivityRef.current = Date.now();
        };

        // Events to track activity
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('click', updateActivity);
        window.addEventListener('scroll', updateActivity);

        return () => {
            clearInterval(interval);
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('click', updateActivity);
            window.removeEventListener('scroll', updateActivity);
        };
    }, [logout]);

    return null;
};

export default SessionTimeout;
