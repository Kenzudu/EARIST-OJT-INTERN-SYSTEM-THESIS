// CoordinatorHeader component – displays page title, subtitle, logged‑in coordinator info, notifications and profile picture
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";
import defaultAvatar from "./images/—Pngtree—character default avatar_5407167.png";

function CoordinatorHeader({ title, subtitle }) {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [profilePicture, setProfilePicture] = useState(null);
    const [fullName, setFullName] = useState('');
    const [notificationFilter, setNotificationFilter] = useState('all'); // all, read, unread
    const [selectedMessage, setSelectedMessage] = useState(null);
    const notificationRef = useRef(null);
    const baseURL = "http://localhost:8000/api/";

    // ---------------------------------------------------------------------
    // Get current coordinator data from localStorage (stored after login)
    // ---------------------------------------------------------------------
    const currentCoordinator = useMemo(() => {
        try {
            const stored = localStorage.getItem("user");
            if (!stored) return null;
            return typeof stored === "string" ? JSON.parse(stored) : stored;
        } catch {
            return null;
        }
    }, []);

    // ---------------------------------------------------------------------
    // Compute the display name – prefer full_name, then first+last, then username
    // ---------------------------------------------------------------------
    const displayName = (() => {
        if (!currentCoordinator) return "Coordinator";
        if (typeof currentCoordinator === "string") return currentCoordinator;
        const full =
            currentCoordinator.full_name ||
            `${currentCoordinator.first_name || ""} ${currentCoordinator.last_name || ""}`.trim();
        return full || currentCoordinator.username || "Coordinator";
    })();

    // ---------------------------------------------------------------------
    // Logout handler – clears token and redirects to login page
    // ---------------------------------------------------------------------
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    // ---------------------------------------------------------------------
    // Load profile picture and coordinator info
    // ---------------------------------------------------------------------
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                // Try to fetch coordinator profile
                const res = await axios.get(`${baseURL}coordinator/profile/`, {
                    headers: { Authorization: `Token ${token}` },
                });

                if (res.data.profile_picture) {
                    setProfilePicture(res.data.profile_picture);
                }

                // Extract full name
                const name = res.data.full_name || `${res.data.first_name || ''} ${res.data.last_name || ''}`.trim();
                if (name) setFullName(name);
            } catch (err) {
                console.error("Error fetching coordinator profile:", err);
                // Fallback to user data from localStorage
                if (currentCoordinator) {
                    const name = currentCoordinator.full_name ||
                        `${currentCoordinator.first_name || ''} ${currentCoordinator.last_name || ''}`.trim();
                    if (name) setFullName(name);
                }
            }
        };
        fetchProfile();
    }, [currentCoordinator]);

    // ---------------------------------------------------------------------
    // Notification handling – fetch pending applications, students, AND messages
    // ---------------------------------------------------------------------
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                // Fetch coordinator-specific notifications (pending applications, new students, etc.)
                const studentsRes = await axios.get(`${baseURL}coordinator/students/`, {
                    headers: { Authorization: `Token ${token}` },
                });

                // Fetch unread messages
                const messagesRes = await axios.get(`${baseURL}supervisor/messages/`, {
                    headers: { Authorization: `Token ${token}` }
                });

                const newNotifications = [];

                // Load read notification IDs from localStorage
                const savedRead = localStorage.getItem('coordinatorReadNotifications');
                const readIds = savedRead ? new Set(JSON.parse(savedRead)) : new Set();

                // Add message notifications
                const receivedMessages = messagesRes.data.filter(msg => msg.type === 'received');

                receivedMessages.forEach(msg => {
                    const id = `message-${msg.id}`;
                    const isRead = readIds.has(id) || msg.is_read;
                    newNotifications.push({
                        id,
                        type: "message",
                        title: "New Message",
                        message: `From ${msg.sender_name}: ${msg.subject}`,
                        timestamp: msg.created_at,
                        read: isRead,
                        messageId: msg.id,
                        fullMessage: msg
                    });
                });

                // Create notifications for students with pending status or recent applications
                const students = studentsRes.data;
                const recentStudents = students.filter(student => {
                    const createdDate = new Date(student.created_at || student.date_joined);
                    const daysSinceCreated = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
                    return daysSinceCreated <= 7; // Students added in last 7 days
                });

                recentStudents.forEach(student => {
                    const id = `new-student-${student.id}`;
                    const isRead = readIds.has(id);
                    newNotifications.push({
                        id,
                        type: "info",
                        title: "New Student Registered",
                        message: `${student.full_name || student.username} has been added to your college.`,
                        timestamp: student.created_at || student.date_joined,
                        read: isRead,
                        fullMessage: null // No full message for students
                    });
                });

                newNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setNotifications(newNotifications);
                setUnreadCount(newNotifications.filter(n => !n.read).length);
            } catch (err) {
                console.error("Error fetching coordinator notifications:", err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = event => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const markAsRead = (notification) => {
        const savedRead = localStorage.getItem('coordinatorReadNotifications');
        const readIds = savedRead ? new Set(JSON.parse(savedRead)) : new Set();
        readIds.add(notification.id);
        localStorage.setItem('coordinatorReadNotifications', JSON.stringify([...readIds]));

        setNotifications(prev => prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    return (
        <header className="student-dashboard__header">
            <div>
                <h1>{title || "Coordinator Dashboard"}</h1>
                <p>{subtitle || "Manage students, companies, and internship placements"}</p>
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
                                                onClick={() => {
                                                    if (!notification.read) markAsRead(notification);
                                                    if (notification.type === 'message') {
                                                        setSelectedMessage(notification.fullMessage);
                                                        setShowNotifications(false);
                                                    }
                                                }}
                                                style={{ cursor: notification.type === 'message' ? 'pointer' : 'default' }}
                                            >
                                                <div className="notification-icon">
                                                    {notification.type === "success" && (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                    )}
                                                    {notification.type === "error" && (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                                    )}
                                                    {notification.type === "info" && (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                                    )}
                                                    {notification.type === "message" && (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                    )}
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
                                        navigate('/coordinator/notifications');
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
                {/* Profile Picture – click goes to coordinator profile */}
                <div className="header-profile-picture" onClick={() => navigate('/coordinator/profile')} style={{ cursor: 'pointer' }}>
                    <img
                        src={profilePicture || defaultAvatar}
                        alt="Profile"
                        className="header-avatar"
                        title="Go to My Profile"
                    />
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
                                            📎 Download Attachment
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
        </header>
    );
}

export default CoordinatorHeader;
