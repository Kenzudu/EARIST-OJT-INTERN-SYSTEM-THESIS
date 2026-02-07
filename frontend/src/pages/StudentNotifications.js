import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StudentHeader from './StudentHeader';
import './SupervisorMessages.css';

function StudentNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, read, unread
    const baseURL = 'http://localhost:8000/api/';

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch both applications and tasks
            const [appsRes, tasksRes] = await Promise.all([
                axios.get(`${baseURL}applications/`, { headers: { Authorization: `Token ${token}` } }),
                axios.get(`${baseURL}tasks/`, { headers: { Authorization: `Token ${token}` } })
            ]);

            const apps = appsRes.data;
            const tasks = tasksRes.data;
            const newNotifications = [];

            // Load read notification IDs from localStorage
            const savedRead = localStorage.getItem('readNotifications');
            const readIds = savedRead ? new Set(JSON.parse(savedRead)) : new Set();

            // Add application notifications
            apps.forEach(app => {
                const id = `app-${app.status?.toLowerCase() || "info"}-${app.id}`;
                const type = app.status === "Approved" ? "success" : app.status === "Rejected" ? "error" : "info";
                const title = `Application ${app.status}`;
                const message = `Your application for ${app.internship?.position || "the position"} at ${app.internship?.company_name || "the company"} ${app.status?.toLowerCase()}.`;
                const isRead = readIds.has(id);
                newNotifications.push({ id, type, title, message, timestamp: app.applied_at, read: isRead });
            });

            // Add task notifications
            tasks.forEach(task => {
                const id = `task-${task.id}`;
                const type = "task";
                const title = "New Task Assigned";
                const message = `${task.title} - ${task.description?.substring(0, 50)}${task.description?.length > 50 ? '...' : ''}`;
                const isRead = readIds.has(id);
                newNotifications.push({ id, type, title, message, timestamp: task.created_at, read: isRead });
            });

            newNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setNotifications(newNotifications);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setLoading(false);
        }
    };

    const markAsRead = (notification) => {
        const savedRead = localStorage.getItem('readNotifications');
        const readIds = savedRead ? new Set(JSON.parse(savedRead)) : new Set();
        readIds.add(notification.id);
        localStorage.setItem('readNotifications', JSON.stringify([...readIds]));

        setNotifications(prev => prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
        ));
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification);
        }

        if (notification.type === 'task') {
            navigate('/student/tasks');
        } else {
            navigate('/student/applications');
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true; // all
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    const readCount = notifications.filter(n => n.read).length;

    return (
        <div className="supervisor-messages-container">
            <div className="admin-dashboard-main">
                <StudentHeader
                    title="Notifications"
                    subtitle="View all your notifications and alerts"
                />

                {/* Centered Content Container */}
                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    {/* Filter Tabs */}
                    <div className="message-filters">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Notifications ({notifications.length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread ({unreadCount})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
                            onClick={() => setFilter('read')}
                        >
                            Read ({readCount})
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="messages-section">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                Loading notifications...
                            </div>
                        ) : filteredNotifications.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {filteredNotifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{
                                            background: notification.read ? '#fff' : '#f0f7ff',
                                            border: `1px solid ${notification.read ? '#e0e0e0' : '#007bff'}`,
                                            borderLeft: `4px solid ${notification.read ? '#e0e0e0' : (notification.type === 'task' ? '#fd7e14' : notification.type === 'success' ? '#28a745' : notification.type === 'error' ? '#dc3545' : '#17a2b8')}`,
                                            borderRadius: '8px',
                                            padding: '16px 20px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            gap: '16px',
                                            alignItems: 'flex-start'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: notification.read ? '#e9ecef' : '#d1ecf1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            flexShrink: 0
                                        }}>
                                            {notification.type === "success" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                            )}
                                            {notification.type === "error" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                            )}
                                            {notification.type === "info" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                            )}
                                            {notification.type === "task" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: '600',
                                                color: '#143f6b',
                                                marginBottom: '4px',
                                                fontSize: '15px'
                                            }}>
                                                {notification.title}
                                            </div>
                                            <div style={{
                                                color: '#5a6275',
                                                fontSize: '14px',
                                                marginBottom: '6px',
                                                lineHeight: '1.4'
                                            }}>
                                                {notification.message}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#8290a0'
                                            }}>
                                                {new Date(notification.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: '#007bff',
                                                flexShrink: 0,
                                                marginTop: '6px'
                                            }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#999'
                            }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ccc' }}>
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                </div>
                                <p style={{ fontSize: '18px', margin: 0 }}>
                                    No {filter === 'all' ? '' : filter} notifications
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentNotifications;
