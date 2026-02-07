// StudentHeader component – displays page title, subtitle, logged‑in user info, notifications and profile picture
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";
import defaultAvatar from "./images/—Pngtree—character default avatar_5407167.png";
import gridIcon from "./images/grid.png";

function StudentHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);
  const [fullName, setFullName] = useState('');
  const [notificationFilter, setNotificationFilter] = useState('all'); // all, read, unread
  const notificationRef = useRef(null);
  const baseURL = "http://localhost:8000/api/";

  // ---------------------------------------------------------------------
  // Get current student data from localStorage (stored after login)
  // ---------------------------------------------------------------------
  const currentStudent = useMemo(() => {
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
    if (!currentStudent) return "Student";
    if (typeof currentStudent === "string") return currentStudent;
    const full =
      currentStudent.full_name ||
      `${currentStudent.first_name || ""} ${currentStudent.last_name || ""}`.trim();
    return full || currentStudent.username || "Student";
  })();

  // ---------------------------------------------------------------------
  // Logout handler – clears token and redirects to login page
  // ---------------------------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ---------------------------------------------------------------------
  // Load profile picture (if any) – we keep name handling separate above
  // ---------------------------------------------------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${baseURL}my-profile/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (res.data.profile_picture) {
          setProfilePicture(res.data.profile_picture);
        }
        // Extract full name
        const name = res.data.full_name || `${res.data.first_name || ''} ${res.data.last_name || ''}`.trim();
        if (name) setFullName(name);
      } catch (err) {
        console.error("Error fetching profile picture:", err);
      }
    };
    fetchProfile();
  }, []);

  // ---------------------------------------------------------------------
  // Notification handling – fetch applications AND tasks, create notifications
  // ---------------------------------------------------------------------
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
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
        setUnreadCount(newNotifications.filter(n => !n.read).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
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
    if (notification.read) return;

    const savedRead = localStorage.getItem('readNotifications');
    const readIds = savedRead ? new Set(JSON.parse(savedRead)) : new Set();
    readIds.add(notification.id);
    localStorage.setItem('readNotifications', JSON.stringify([...readIds]));

    setNotifications(prev => prev.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));
    // Update unread count based on new state
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <header className="student-dashboard__header">
      <div>
        <h1>{title || "Student Intern Dashboard"}</h1>
        <p>{subtitle || "Track your internship journey and stay on top of your applications."}</p>
      </div>
      <div className="student-dashboard__welcome">
        <div className="welcome-details">
          <span className="welcome-label">Logged in as</span>
          <strong className="welcome-name">{displayName}</strong>
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
                          setShowNotifications(false);
                          // Navigate based on notification type
                          if (notification.type === 'task') {
                            navigate('/student/tasks');
                          } else {
                            // Application notifications
                            navigate('/student/applications');
                          }
                        }}
                        style={{ cursor: 'pointer' }}
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
                          {notification.type === "task" && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
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
                    navigate('/student/notifications');
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
        {/* Profile Picture – click goes to My Profile */}
        <div className="header-profile-picture" onClick={() => navigate('/student/profile')} style={{ cursor: 'pointer' }}>
          <img
            src={profilePicture || defaultAvatar}
            alt="Profile"
            className="header-avatar"
            title="Go to My Profile"
          />
        </div>
        {/* Optional logout button – uncomment if needed */}
        {/* <button onClick={handleLogout} className="logout-btn-small" title="Logout">🚪</button> */}
      </div>
    </header >
  );
}

export default StudentHeader;
