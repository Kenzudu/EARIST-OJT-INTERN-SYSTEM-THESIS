import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SupervisorHeader from './SupervisorHeader';
import './SupervisorMessages.css';

function SupervisorNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, read, unread
    const [selectedMessage, setSelectedMessage] = useState(null);
    const baseURL = 'http://localhost:8000/api/';

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
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

            // Create notifications for received messages
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
                    fullMessage: msg
                });
            });

            newNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setNotifications(newNotifications);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setLoading(false);
        }
    };

    const markAsRead = (notificationId) => {
        const savedRead = localStorage.getItem('supervisorReadNotifications');
        const readIds = savedRead ? new Set(JSON.parse(savedRead)) : new Set();
        readIds.add(notificationId);
        localStorage.setItem('supervisorReadNotifications', JSON.stringify([...readIds]));

        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        ));
    };

    const handleNotificationClick = (notification) => {
        setSelectedMessage(notification.fullMessage);
        if (!notification.read) {
            markAsRead(notification.id);
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
                <SupervisorHeader
                    title="Notifications"
                    subtitle="View all your notifications and message alerts"
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
                                            borderLeft: `4px solid ${notification.read ? '#e0e0e0' : '#007bff'}`,
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
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                <polyline points="22,6 12,13 2,6"></polyline>
                                            </svg>
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

                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {new Date(selectedMessage.created_at).toLocaleString()}
                                    </div>
                                </div>

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

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
                    </div>
                )}
            </div>
        </div>
    );
}

export default SupervisorNotifications;
