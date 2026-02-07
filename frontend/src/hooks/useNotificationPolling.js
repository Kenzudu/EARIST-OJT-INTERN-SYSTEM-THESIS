import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import useNotificationSound from './useNotificationSound';

/**
 * Custom hook for polling notifications based on user role
 * Automatically detects user role and polls appropriate endpoints
 * Plays sound when new notifications are detected
 */
export const useNotificationPolling = () => {
    const [notificationCount, setNotificationCount] = useState(0);
    // Use useRef to avoid stale closures in setInterval
    const previousMessageIdsRef = useRef(new Set());
    const playNotification = useNotificationSound();
    const baseURL = 'http://localhost:8000/api/';

    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        const token = localStorage.getItem('token');

        if (!token || !userRole) return;

        // Initial fetch after a short delay to ensure user is logged in
        const initialTimeout = setTimeout(() => {
            fetchNotifications(userRole, token);
        }, 2000); // 2 second delay for initial load

        // Poll every 3 seconds for near real-time notifications
        const pollInterval = setInterval(() => {
            fetchNotifications(userRole, token);
        }, 3000); // 3 seconds - much faster for real-time feel

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(pollInterval);
        };
    }, []);

    const fetchNotifications = async (userRole, token) => {
        try {
            let result = { count: 0, messageIds: [] };

            console.log('🔔 Checking notifications for role:', userRole);

            // Fetch based on user role
            switch (userRole) {
                case 'admin':
                    result = await fetchAdminNotifications(token);
                    break;
                case 'coordinator':
                    result = await fetchCoordinatorNotifications(token);
                    break;
                case 'student':
                    result = await fetchStudentNotifications(token);
                    break;
                case 'supervisor':
                    result = await fetchSupervisorNotifications(token);
                    break;
                default:
                    break;
            }

            const newMessageIds = new Set(result.messageIds);
            const previousMessageIds = previousMessageIdsRef.current;

            console.log('📊 Notification count:', result.count);
            console.log('📨 Message IDs:', Array.from(newMessageIds));

            // Check for NEW messages (IDs that weren't in previous set)
            const newMessages = Array.from(newMessageIds).filter(id => !previousMessageIds.has(id));

            if (newMessages.length > 0 && previousMessageIds.size > 0) {
                console.log('🔊 NEW MESSAGES DETECTED! Playing sound for', newMessages.length, 'new message(s)');
                console.log('   New message IDs:', newMessages);
                playNotification();
            } else if (previousMessageIds.size === 0) {
                console.log('📝 Initial load - found', newMessageIds.size, 'unread messages (no sound on first load)');
            } else {
                console.log('✅ No new messages');
            }

            previousMessageIdsRef.current = newMessageIds;
            setNotificationCount(result.count);
        } catch (err) {
            console.error('❌ Error fetching notifications:', err);
        }
    };

    const fetchAdminNotifications = async (token) => {
        try {
            const allIds = [];

            // Check unread messages
            const messagesRes = await axios.get(`${baseURL}admin/messages/`, {
                headers: { Authorization: `Token ${token}` }
            });
            const unreadMessages = messagesRes.data.filter(m => m.type === 'received' && !m.is_read);
            unreadMessages.forEach(m => allIds.push(`msg-${m.id}`));

            // Check pending applications
            let pendingApps = [];
            try {
                const appsRes = await axios.get(`${baseURL}applications/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                pendingApps = appsRes.data.filter(app => app.status === 'Pending');
                pendingApps.forEach(app => allIds.push(`app-${app.id}`));
            } catch (err) {
                // Endpoint might not exist
            }

            return {
                count: unreadMessages.length + pendingApps.length,
                messageIds: allIds
            };
        } catch (err) {
            console.error('Error fetching admin notifications:', err);
            return { count: 0, messageIds: [] };
        }
    };

    const fetchCoordinatorNotifications = async (token) => {
        try {
            const allIds = [];

            // Check unread messages
            const messagesRes = await axios.get(`${baseURL}coordinator/messages/`, {
                headers: { Authorization: `Token ${token}` }
            });
            const unreadMessages = messagesRes.data.filter(m => m.type === 'received' && !m.is_read);
            unreadMessages.forEach(m => allIds.push(`msg-${m.id}`));

            // Check pending journals
            let pendingJournals = [];
            try {
                const journalsRes = await axios.get(`${baseURL}coordinator/journals/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                pendingJournals = journalsRes.data.filter(j => j.status === 'Submitted');
                pendingJournals.forEach(j => allIds.push(`journal-${j.id}`));
            } catch (err) {
                // Endpoint might not exist
            }

            return {
                count: unreadMessages.length + pendingJournals.length,
                messageIds: allIds
            };
        } catch (err) {
            console.error('Error fetching coordinator notifications:', err);
            return { count: 0, messageIds: [] };
        }
    };

    const fetchStudentNotifications = async (token) => {
        try {
            const allIds = [];

            // Check unread messages
            const messagesRes = await axios.get(`${baseURL}student/messages/`, {
                headers: { Authorization: `Token ${token}` }
            });
            const unreadMessages = messagesRes.data.filter(m => m.type === 'received' && !m.is_read);
            unreadMessages.forEach(m => allIds.push(`msg-${m.id}`));

            // Check new tasks
            let newTasks = [];
            try {
                const tasksRes = await axios.get(`${baseURL}tasks/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                newTasks = tasksRes.data.filter(t => t.status === 'Pending');
                newTasks.forEach(t => allIds.push(`task-${t.id}`));
            } catch (err) {
                // Endpoint might not exist
            }

            return {
                count: unreadMessages.length + newTasks.length,
                messageIds: allIds
            };
        } catch (err) {
            console.error('Error fetching student notifications:', err);
            return { count: 0, messageIds: [] };
        }
    };

    const fetchSupervisorNotifications = async (token) => {
        try {
            // Check unread messages
            const messagesRes = await axios.get(`${baseURL}supervisor/messages/`, {
                headers: { Authorization: `Token ${token}` }
            });

            const allMessages = messagesRes.data;
            const receivedMessages = allMessages.filter(m => m.type === 'received');
            const unreadMessages = receivedMessages.filter(m => !m.is_read);

            console.log('📬 Total messages:', allMessages.length);
            console.log('📥 Received messages:', receivedMessages.length);
            console.log('📩 Unread messages:', unreadMessages.length);

            // Get message IDs for tracking new messages
            const allIds = unreadMessages.map(m => `msg-${m.id}`);

            // Check pending journals
            let pendingJournals = [];
            try {
                const journalsRes = await axios.get(`${baseURL}supervisor/journals/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                pendingJournals = journalsRes.data.filter(j => j.status === 'Submitted');
                pendingJournals.forEach(j => allIds.push(`journal-${j.id}`));
            } catch (err) {
                // Endpoint might not exist
            }

            return {
                count: unreadMessages.length + pendingJournals.length,
                messageIds: allIds
            };
        } catch (err) {
            console.error('Error fetching supervisor notifications:', err);
            return { count: 0, messageIds: [] };
        }
    };

    return { notificationCount };
};

export default useNotificationPolling;
