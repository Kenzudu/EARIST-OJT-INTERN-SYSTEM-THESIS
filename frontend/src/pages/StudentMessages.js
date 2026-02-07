import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import StudentHeader from './StudentHeader';
import './SupervisorMessages.css';

function StudentMessages() {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCompose, setShowCompose] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [recipientId, setRecipientId] = useState('');
    const [subject, setSubject] = useState('');
    const [messageText, setMessageText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [sending, setSending] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);

    // Chat modal states
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatUser, setChatUser] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [sendingChat, setSendingChat] = useState(false);

    // Notification sound
    const notificationSound = useRef(null);
    const messagesEndRef = useRef(null); // Ref for auto-scroll
    const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

    const baseURL = 'http://localhost:8000/api/';

    useEffect(() => {
        fetchMessages();
        fetchUsers();
    }, []);

    // Dynamic polling for real-time updates
    useEffect(() => {
        const intervalDelay = showChatModal ? 3000 : 15000;
        const pollInterval = setInterval(() => {
            fetchMessagesQuietly();
        }, intervalDelay);
        return () => clearInterval(pollInterval);
    }, [showChatModal]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, showChatModal]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${baseURL}student/messages/`, {
                headers: { Authorization: `Token ${token}` }
            });

            // Check for new unread messages
            const newUnreadCount = res.data.filter(msg => msg.type === 'received' && !msg.is_read).length;

            // Play notification sound if unread count increased
            if (previousUnreadCount > 0 && newUnreadCount > previousUnreadCount) {
                playNotificationSound();
            }

            setPreviousUnreadCount(newUnreadCount);
            setMessages(res.data);
            setError('');
        } catch (err) {
            console.error('Error fetching messages:', err);
            if (err.response?.status === 403) {
                setError('Access denied. Please check if you have student permissions.');
            } else if (err.response?.status === 401) {
                setError('Authentication failed. Please log in again.');
            } else {
                setError(err.response?.data?.error || 'Failed to load messages');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages quietly (without loading state) for polling
    const fetchMessagesQuietly = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${baseURL}student/messages/`, {
                headers: { Authorization: `Token ${token}` }
            });

            // Check for new unread messages
            const newUnreadCount = res.data.filter(msg => msg.type === 'received' && !msg.is_read).length;

            // Play notification sound if unread count increased
            if (previousUnreadCount > 0 && newUnreadCount > previousUnreadCount) {
                playNotificationSound();
            }

            setPreviousUnreadCount(newUnreadCount);
            setMessages(res.data);
        } catch (err) {
            console.error('Error polling messages:', err);
        }
    };

    // Play notification sound
    const playNotificationSound = () => {
        if (notificationSound.current) {
            notificationSound.current.play().catch(err => {
                console.log('Could not play notification sound:', err);
            });
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${baseURL}users/`, {
                headers: { Authorization: `Token ${token}` }
            });
            // Filter to show admins, coordinators, and supervisors
            const staffUsers = res.data.filter(user =>
                ['admin', 'coordinator', 'supervisor'].includes(user.role)
            );
            setUsers(staffUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!recipientId || !subject || !messageText) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setSending(true);
            const token = localStorage.getItem('token');

            // Use FormData for file upload
            const formData = new FormData();
            formData.append('recipient_id', recipientId);
            formData.append('subject', subject);
            formData.append('message', messageText);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            await axios.post(`${baseURL}student/messages/`, formData, {
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccess('Message sent successfully!');
            setShowCompose(false);
            setRecipientId('');
            setSubject('');
            setMessageText('');
            setAttachment(null);
            fetchMessages();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();

        if (!chatInput.trim() || !chatUser) return;

        const messageText = chatInput.trim();

        try {
            setSendingChat(true);
            const token = localStorage.getItem('token');

            const formData = new FormData();
            formData.append('recipient_id', chatUser.id);
            formData.append('subject', 'Chat Message');
            formData.append('message', messageText);

            // Clear input immediately for better UX
            setChatInput('');

            const response = await axios.post(`${baseURL}student/messages/`, formData, {
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Create the new message object to add to chat immediately
            const newMessage = {
                ...response.data,
                type: 'sent',
                sender_name: response.data.sender_name || `${localStorage.getItem('first_name') || ''} ${localStorage.getItem('last_name') || ''}`.trim() || localStorage.getItem('username'),
                message: messageText,
                created_at: response.data.created_at || new Date().toISOString(),
                attachment: response.data.attachment || null
            };

            // Add the new message to the chat immediately (optimistic update)
            setChatMessages(prev => [...prev, newMessage]);

            // Refresh messages in the background
            fetchMessages();

        } catch (err) {
            console.error('Error sending chat message:', err);
            setError('Failed to send message');
            // Restore the input if sending failed
            setChatInput(messageText);
        } finally {
            setSendingChat(false);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${baseURL}student/messages/${messageId}/read/`, {}, {
                headers: { Authorization: `Token ${token}` }
            });
            fetchMessages();
        } catch (err) {
            console.error('Error marking message as read:', err);
        }
    };

    // Auto-sync chat messages when new messages arrive (Live Chat)
    useEffect(() => {
        if (chatUser && messages.length > 0) {
            // Safer filtering using 'type' provided by backend (avoids local storage username issues)
            const relevantMessages = messages.filter(msg =>
                (msg.type === 'received' && msg.sender === chatUser.username) ||
                (msg.type === 'sent' && msg.recipient === chatUser.username)
            ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            if (relevantMessages.length !== chatMessages.length ||
                (relevantMessages.length > 0 && chatMessages.length > 0 && relevantMessages[relevantMessages.length - 1].id !== chatMessages[chatMessages.length - 1].id)) {
                setChatMessages(relevantMessages);

                relevantMessages.forEach(m => {
                    if (m.type === 'received' && !m.is_read) {
                        markAsRead(m.id);
                    }
                });
            }
        }
    }, [messages, chatUser]);

    const handleDeleteMessage = async (messageId, e) => {
        if (e) e.stopPropagation();

        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${baseURL}student/messages/${messageId}/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setSuccess('Message deleted successfully!');
            fetchMessages();
            setSelectedMessage(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting message:', err);
            setError('Failed to delete message');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm(`Are you sure you want to delete ALL messages? This action cannot be undone.`)) return;

        try {
            const token = localStorage.getItem('token');
            setLoading(true);

            // Use bulk delete endpoint
            const response = await axios.post(`${baseURL}student/messages/delete-all/`, {}, {
                headers: { Authorization: `Token ${token}` }
            });

            setSuccess(`Successfully deleted ${response.data.count} messages!`);
            fetchMessages();
            setSelectedMessage(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting messages:', err);
            setError('Failed to delete all messages');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Create unique conversations grouped by contact
    const getUniqueConversations = () => {
        const conversationMap = new Map();

        messages.forEach(msg => {
            // Determine the other person in the conversation
            const contactId = msg.type === 'sent' ? msg.recipient : msg.sender;
            const contactName = msg.type === 'sent' ? msg.recipient_name : msg.sender_name;

            if (!conversationMap.has(contactId)) {
                // Find the user's role and numeric ID from the users list
                const user = users.find(u => u.username === contactId);
                const userRole = user ? user.role : 'unknown';
                const userId = user ? user.id : null;

                conversationMap.set(contactId, {
                    contactId,
                    contactName,
                    userId,
                    messages: [],
                    lastMessage: msg,
                    unreadCount: 0,
                    role: userRole
                });
            }

            const conversation = conversationMap.get(contactId);
            conversation.messages.push(msg);

            // Update last message if this one is newer
            if (new Date(msg.created_at) > new Date(conversation.lastMessage.created_at)) {
                conversation.lastMessage = msg;
            }

            // Count unread messages
            if (msg.type === 'received' && !msg.is_read) {
                conversation.unreadCount++;
            }
        });

        return Array.from(conversationMap.values());
    };

    const conversations = getUniqueConversations();

    // Filter conversations by search query and filter type
    const filteredConversations = conversations.filter(conv => {
        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = conv.contactName?.toLowerCase().includes(query) ||
                conv.lastMessage.subject?.toLowerCase().includes(query) ||
                conv.lastMessage.message?.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        // Apply tab filter
        if (filter === 'received') {
            // Inbox: conversations with unread messages
            return conv.unreadCount > 0;
        } else if (filter === 'sent') {
            // Sent: conversations where I sent the last message
            return conv.lastMessage.type === 'sent';
        }

        // 'all' filter shows everything
        // 'all' filter shows everything
        return true;
    }).sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));

    // const adminConversations... (Removed split grouping)

    const unreadCount = messages.filter(msg => msg.type === 'received' && !msg.is_read).length;

    const handleOpenChat = (conversation) => {
        // Set the chat user from the conversation object
        setChatUser({
            id: conversation.userId,  // Use numeric user ID for API calls
            username: conversation.contactId,  // Keep username for filtering messages
            name: conversation.contactName,
            role: conversation.role
        });

        // Use spread operator to create a new array and avoid mutation
        const sortedMessages = [...conversation.messages].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        setChatMessages(sortedMessages);
        setShowChatModal(true);

        // Mark unread messages as read
        conversation.messages.forEach(m => {
            if (m.type === 'received' && !m.is_read) {
                markAsRead(m.id);
            }
        });
    };

    return (
        <div className="admin-dashboard-container">
            {/* Notification Sound */}
            <audio ref={notificationSound} src="/notification.wav" preload="auto" />

            <div className="admin-dashboard-main">
                <StudentHeader
                    title="Messages"
                    subtitle="Communicate with administrators, coordinators, and supervisors"
                />

                <div className="supervisor-messages-content">
                    {success && <div className="alert alert-success">{success}</div>}
                    {error && <div className="alert alert-error">{error}</div>}

                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                        {/* Search Field */}
                        <div style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#999"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 40px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {filteredConversations.length > 0 && (
                                <button
                                    className="btn-delete-all"
                                    onClick={handleDeleteAll}
                                    disabled={loading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete All
                                </button>
                            )}
                            <button className="btn-compose" onClick={() => setShowCompose(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    <line x1="9" y1="10" x2="15" y2="10"></line>
                                    <line x1="12" y1="7" x2="12" y2="13"></line>
                                </svg>
                                New Message
                            </button>
                        </div>
                    </div>

                    <div className="message-stats">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <div>
                                <div className="stat-value">{messages.length}</div>
                                <div className="stat-label">Total Messages</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            </div>
                            <div>
                                <div className="stat-value">{unreadCount}</div>
                                <div className="stat-label">Unread</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </div>
                            <div>
                                <div className="stat-value">{messages.filter(m => m.type === 'sent').length}</div>
                                <div className="stat-label">Sent</div>
                            </div>
                        </div>
                    </div>

                    <div className="message-filters">
                        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                            All Messages
                        </button>
                        <button className={`filter-tab ${filter === 'received' ? 'active' : ''}`} onClick={() => setFilter('received')}>
                            Inbox ({conversations.filter(c => c.unreadCount > 0).length})
                        </button>
                        <button className={`filter-tab ${filter === 'sent' ? 'active' : ''}`} onClick={() => setFilter('sent')}>
                            Sent ({conversations.filter(c => c.lastMessage.type === 'sent').length})
                        </button>
                    </div>

                    <div className="messages-container">
                        {loading ? (
                            <div className="loading-state">Loading messages...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="empty-state">
                                <h3>No messages yet</h3>
                                <p>Start a conversation with administrators, coordinators, or supervisors</p>
                            </div>
                        ) : (
                            <div className="messages-list">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.contactId}
                                        className={`message-card ${conv.unreadCount > 0 ? 'unread' : ''}`}
                                        onClick={() => handleOpenChat(conv)}
                                    >
                                        <div className="message-header">
                                            <div className="message-participants">
                                                <span className="name">
                                                    {conv.contactName}
                                                    <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                                                        ({conv.role === 'admin' ? 'Administrator' : conv.role.charAt(0).toUpperCase() + conv.role.slice(1)})
                                                    </span>
                                                </span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="badge-unread">{conv.unreadCount}</span>
                                                )}
                                            </div>
                                            <div className="message-meta">
                                                <span className="message-date">
                                                    {new Date(conv.lastMessage.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="message-subject">{conv.lastMessage.subject}</div>
                                        <div className="message-preview">{conv.lastMessage.message}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {showCompose && (
                        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Compose Message</h2>
                                    <button className="modal-close" onClick={() => setShowCompose(false)}>×</button>
                                </div>
                                <form onSubmit={handleSendMessage} className="compose-form">
                                    <div className="form-group">
                                        <label>Recipient *</label>
                                        <select
                                            value={recipientId}
                                            onChange={(e) => setRecipientId(e.target.value)}
                                            required
                                            className="form-control"
                                        >
                                            <option value="">Select recipient...</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.first_name} {user.last_name} ({user.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Subject *</label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Enter message subject"
                                            required
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Message *</label>
                                        <textarea
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder="Type your message here..."
                                            required
                                            className="form-control"
                                            rows={8}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Attachment (Optional)</label>
                                        <input
                                            type="file"
                                            onChange={(e) => setAttachment(e.target.files[0])}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn-cancel" onClick={() => setShowCompose(false)}>Cancel</button>
                                        <button type="submit" className="btn-send" disabled={sending}>
                                            {sending ? 'Sending...' : 'Send Message'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Chat Modal */}
                    {showChatModal && chatUser && (
                        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
                            <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="chat-header">
                                    <div className="chat-user-info">
                                        <div className="chat-avatar">
                                            {chatUser.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3>{chatUser.name}</h3>
                                            <span className="chat-role">{chatUser.role}</span>
                                        </div>
                                    </div>
                                    <button className="modal-close" onClick={() => setShowChatModal(false)}>×</button>
                                </div>
                                <div className="chat-messages">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className={`chat-message ${msg.type === 'sent' ? 'sent' : 'received'}`}>
                                            <div className="message-bubble">
                                                <div className="message-subject-small">{msg.subject}</div>
                                                {msg.message}
                                                {msg.attachment && (
                                                    <div className="message-attachment">
                                                        <a href={msg.attachment} target="_blank" rel="noopener noreferrer">
                                                            View Attachment
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="message-time">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={handleSendChatMessage} className="chat-input-area">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="chat-input"
                                    />
                                    <button type="submit" className="btn-send-chat" disabled={!chatInput.trim() || sendingChat}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default StudentMessages;
