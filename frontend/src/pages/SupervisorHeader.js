import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';
import defaultAvatar from './images/—Pngtree—character default avatar_5407167.png';
import useNotificationSound from '../hooks/useNotificationSound';

function SupervisorHeader({ title, subtitle }) {
    const navigate = useNavigate();
    const [profilePicture, setProfilePicture] = useState(null);
    const [fullName, setFullName] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [notificationFilter, setNotificationFilter] = useState('all'); // all, read, unread
    const notificationRef = useRef(null);
    const baseURL = 'http://localhost:8000/api/';
    const playNotification = useNotificationSound();

    // Get current user data from localStorage
    const currentUser = useMemo(() => {
        try {
            const stored = localStorage.getItem('user');
            if (!stored) return null;
            return typeof stored === 'string' ? JSON.parse(stored) : stored;
        } catch {
            return null;
        }
    }, []);

    // Compute the display name
    const displayName = (() => {
        if (!currentUser) return 'Supervisor';
        if (typeof currentUser === 'string') return currentUser;
        const full =
            currentUser.full_name ||
            `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
        return full || currentUser.username || 'Supervisor';
    })();

    useEffect(() => {
        // Set display name from localStorage
        if (currentUser) {
            const name = currentUser.full_name ||
                `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
            if (name) setFullName(name);
        }
    }, [currentUser]);

    // Fetch unread messages for notifications
    useEffect(() => {
        const fetchMessageNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await axios.get(`${baseURL}supervisor/messages/`, {
                    headers: { Authorization: `Token ${token}` }
                });

                const messages = res.data;
                const newNotifications = [];

                // Load read notification IDs from localStorage
                const savedRead = localStorage.getItem('supervisorReadNotifications');
                const readIds = savedRead ? new Set(JSON.parse(savedRead)) : new Set();

                // Create notifications for all received messages
                const receivedMessages = messages.filter(msg => msg.type === 'received');

                receivedMessages.forEach(msg => {
                    const id = `message-${msg.id}`;
                    const isRead = readIds.has(id) || msg.is_read;
                    newNotifications.push({
                        id,
                        type: 'message',
                        title: 'New Message',
                        message: `From ${msg.sender_name}: ${msg.subject}`,
                        timestamp: msg.created_at,
                        read: isRead,
                        messageId: msg.id,
                        fullMessage: msg  // Store full message data
                    });
                });

                newNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setNotifications(newNotifications);

                const newUnreadCount = newNotifications.filter(n => !n.read).length;

                // Play sound if unread count increased
                if (previousUnreadCount > 0 && newUnreadCount > previousUnreadCount) {
                    console.log('🔔 New notification! Playing sound...');
                    playNotification();
                }

                setPreviousUnreadCount(newUnreadCount);
                setUnreadCount(newUnreadCount);
            } catch (err) {
                console.error('Error fetching message notifications:', err);
            }
        };

        fetchMessageNotifications();
        const interval = setInterval(fetchMessageNotifications, 3000); // Check every 3 seconds for real-time updates
        return () => clearInterval(interval);
    }, [playNotification, previousUnreadCount]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = event => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleNotifications = () => {
        const willShow = !showNotifications;
        setShowNotifications(willShow);
        if (willShow) {
            setNotifications(prev => {
                const updated = prev.map(n => ({ ...n, read: true }));
                // Save read notification IDs to localStorage
                const readIds = updated.map(n => n.id);
                localStorage.setItem('supervisorReadNotifications', JSON.stringify(readIds));
                return updated;
            });
        }
    };

    const handleNotificationClick = (notification) => {
        // Show message modal instead of navigating
        setSelectedMessage(notification.fullMessage);
        setShowNotifications(false);
    };

    return (
        <header className="student-dashboard__header">
            <div>
                <h1>{title || 'Supervisor Dashboard'}</h1>
                <p>{subtitle || 'Manage your assigned interns'}</p>
            </div>
            <div className="student-dashboard__welcome">
                <div className="welcome-details">
                    <span className="welcome-label">Logged in as</span>
                    <strong className="welcome-name">{fullName || displayName}</strong>
                </div>
                {/* Notification Bell */}
                <div className="notification-container" ref={notificationRef}>
                    <button
                        className="notification-bell"
                        onClick={toggleNotifications}
                        title="Notifications"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>
                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-dropdown-header">
                                <h3>Notifications</h3>
                                <button className="notification-close" onClick={() => setShowNotifications(false)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Filter Tabs */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                padding: '12px 16px',
                                borderBottom: '1px solid #e9ecef',
                                background: '#f8f9fa'
                            }}>
                                <button
                                    onClick={() => setNotificationFilter('all')}
                                    style={{
                                        flex: 1,
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: notificationFilter === 'all' ? '#667eea' : 'white',
                                        color: notificationFilter === 'all' ? 'white' : '#666',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    All ({notifications.length})
                                </button>
                                <button
                                    onClick={() => setNotificationFilter('unread')}
                                    style={{
                                        flex: 1,
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: notificationFilter === 'unread' ? '#667eea' : 'white',
                                        color: notificationFilter === 'unread' ? 'white' : '#666',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Unread ({notifications.filter(n => !n.read).length})
                                </button>
                                <button
                                    onClick={() => setNotificationFilter('read')}
                                    style={{
                                        flex: 1,
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: notificationFilter === 'read' ? '#667eea' : 'white',
                                        color: notificationFilter === 'read' ? 'white' : '#666',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Read ({notifications.filter(n => n.read).length})
                                </button>
                            </div>

                            <div className="notification-list">
                                {(() => {
                                    const filteredNotifications = notifications.filter(n => {
                                        if (notificationFilter === 'unread') return !n.read;
                                        if (notificationFilter === 'read') return n.read;
                                        return true; // all
                                    });

                                    return filteredNotifications.length > 0 ? (
                                        filteredNotifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                className={`notification-item ${notification.type} ${notification.read ? "read" : "unread"}`}
                                                onClick={() => handleNotificationClick(notification)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="notification-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                        <polyline points="22,6 12,13 2,6"></polyline>
                                                    </svg>
                                                </div>
                                                <div className="notification-content">
                                                    <div className="notification-title">{notification.title}</div>
                                                    <div className="notification-message">{notification.message}</div>
                                                    <div className="notification-time">{new Date(notification.timestamp).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="notification-empty">
                                            <p>No {notificationFilter === 'all' ? '' : notificationFilter} notifications</p>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* View All Button */}
                            <div style={{
                                padding: '12px 16px',
                                borderTop: '1px solid #e9ecef',
                                background: '#f8f9fa'
                            }}>
                                <button
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate('/supervisor/notifications');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: '#667eea',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#5568d3'}
                                    onMouseLeave={(e) => e.target.style.background = '#667eea'}
                                >
                                    View All Notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Profile Picture – click goes to supervisor profile */}
                <div className="header-profile-picture" onClick={() => navigate('/supervisor/profile')} style={{ cursor: 'pointer' }}>
                    <img
                        src={profilePicture || defaultAvatar}
                        alt="Profile"
                        className="header-avatar"
                        title="Go to Profile"
                    />
                </div>
            </div>

            {/* Message Modal */}
            {selectedMessage && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}
                    onClick={() => setSelectedMessage(null)}
                >
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        maxWidth: '700px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #e0e0e0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px 12px 0 0'
                        }}>
                            <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem' }}>Message</h2>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>From</div>
                                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                                    {selectedMessage.sender_name}
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Subject</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>
                                    {selectedMessage.subject}
                                </div>
                            </div>

                            {/* Date */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                    {new Date(selectedMessage.created_at).toLocaleString()}
                                </div>
                            </div>

                            {/* Message Body */}
                            <div style={{
                                padding: '16px',
                                background: '#f9f9f9',
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    color: '#333',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {selectedMessage.message}
                                </div>
                            </div>

                            {/* Attachment */}
                            {selectedMessage.attachment && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Attachment</div>
                                    <a
                                        href={selectedMessage.attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-block',
                                            padding: '8px 16px',
                                            background: '#4CAF50',
                                            color: 'white',
                                            borderRadius: '4px',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                        </svg>
                                        Download Attachment
                                    </a>
                                </div>
                            )}

                            {/* Reply Button */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button
                                    onClick={() => {
                                        setSelectedMessage(null);
                                        navigate('/supervisor/messages');
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Reply
                                </button>
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#757575',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div >
            )
            }
        </header >
    );
}

export default SupervisorHeader;
