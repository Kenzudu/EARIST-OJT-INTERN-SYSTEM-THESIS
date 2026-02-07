import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SupervisorHeader from './SupervisorHeader';
import './SupervisorMessages.css';

function SupervisorMessages() {
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
    const [chatAttachment, setChatAttachment] = useState(null);
    const [sendingChat, setSendingChat] = useState(false);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

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

    // Close chat menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showChatMenu && !event.target.closest('button')) {
                setShowChatMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showChatMenu]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, showChatModal]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userRole = localStorage.getItem('userRole');

            console.log('Fetching messages for supervisor...');
            console.log('User Role:', userRole);
            console.log('Token exists:', !!token);

            const res = await axios.get(`${baseURL}supervisor/messages/`, {
                headers: { Authorization: `Token ${token}` }
            });

            console.log('Messages received:', res.data.length);
            console.log('Messages data:', res.data);

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
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);

            if (err.response?.status === 403) {
                setError('Access denied. Please check if you have supervisor permissions.');
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
            const res = await axios.get(`${baseURL}supervisor/messages/`, {
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
            const staffUsers = res.data.filter(user =>
                user.role === 'coordinator' || user.role === 'admin'
            );
            setUsers(staffUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!recipientId || !messageText) {
            setError('Please select a recipient and enter a message');
            return;
        }

        try {
            setSending(true);
            const token = localStorage.getItem('token');

            // Use FormData for file upload
            const formData = new FormData();
            formData.append('recipient_id', recipientId);
            formData.append('subject', subject || 'New Message');  // Auto-generate subject if empty
            formData.append('message', messageText);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            await axios.post(`${baseURL}supervisor/messages/`, formData, {
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

    const markAsRead = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${baseURL}supervisor/messages/${messageId}/read/`, {}, {
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
        return true;
    }).sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));

    // const coordinatorConversations... (Removed split grouping)

    const unreadCount = messages.filter(msg => msg.type === 'received' && !msg.is_read).length;

    const handleReply = (msg) => {
        // Find the sender in the users list
        const sender = users.find(u => u.username === msg.sender);
        if (sender) {
            setRecipientId(sender.id.toString());
            setSubject(msg.subject.startsWith('Re: ') ? msg.subject : `Re: ${msg.subject}`);
            setShowCompose(true);
        }
    };

    const handleOpenChat = (conversation) => {
        console.log('Opening chat with conversation:', conversation);

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

        console.log('Setting chat messages:', sortedMessages);
        setChatMessages(sortedMessages);
        setShowChatModal(true);

        // Mark unread messages as read
        conversation.messages.forEach(m => {
            if (m.type === 'received' && !m.is_read) {
                markAsRead(m.id);
            }
        });
    };

    const handleDeleteConversation = async () => {
        if (!window.confirm(`Are you sure you want to delete all messages with ${chatUser.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // Delete all messages in this conversation
            const deletePromises = chatMessages.map(msg =>
                axios.delete(`${baseURL}supervisor/messages/${msg.id}/`, {
                    headers: { Authorization: `Token ${token}` }
                })
            );

            await Promise.all(deletePromises);

            setSuccess(`Conversation with ${chatUser.name} deleted successfully!`);
            setShowChatModal(false);
            setShowChatMenu(false);
            fetchMessages();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting conversation:', err);
            setError('Failed to delete conversation');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleViewAttachments = () => {
        setShowAttachmentsModal(true);
        setShowChatMenu(false);
    };

    const getChatAttachments = () => {
        return chatMessages.filter(msg => msg.attachment).map(msg => ({
            id: msg.id,
            url: msg.attachment,
            filename: msg.attachment.split('/').pop(),
            date: msg.created_at,
            sender: msg.type === 'sent' ? 'You' : chatUser.name
        }));
    };

    // Polling for typing status
    useEffect(() => {
        let interval;
        if (showChatModal && chatUser) {
            checkTypingStatus();
            interval = setInterval(checkTypingStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [showChatModal, chatUser]);

    const checkTypingStatus = async () => {
        if (!chatUser) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${baseURL}typing/status/?user_id=${chatUser.id}`, {
                headers: { Authorization: `Token ${token}` }
            });
            setIsTyping(res.data.is_typing);
        } catch (err) {
            // silent fail
        }
    };

    const handleInputChange = (e) => {
        setChatInput(e.target.value);
        if (chatUser) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            else sendTypingStatus(true);

            typingTimeoutRef.current = setTimeout(() => {
                sendTypingStatus(false);
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const sendTypingStatus = async (status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${baseURL}typing/update/`,
                { recipient_id: chatUser.id, is_typing: status },
                { headers: { Authorization: `Token ${token}` } }
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();

        if ((!chatInput.trim() && !chatAttachment) || !chatUser) return;

        const messageText = chatInput.trim() || '(Attachment)';
        const attachment = chatAttachment;

        try {
            setSendingChat(true);
            const token = localStorage.getItem('token');

            const formData = new FormData();
            formData.append('recipient_id', chatUser.id);
            formData.append('subject', 'Chat Message');
            formData.append('message', messageText);
            if (attachment) {
                formData.append('attachment', attachment);
            }
            if (replyingTo) {
                formData.append('reply_to_id', replyingTo.id);
            }

            // Clear input and attachment immediately for better UX
            setChatInput('');
            setChatAttachment(null);
            setReplyingTo(null);

            const response = await axios.post(`${baseURL}supervisor/messages/`, formData, {
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
                reply_to: response.data.reply_to || (replyingTo ? replyingTo.id : null),
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
            setChatAttachment(attachment);
        } finally {
            setSendingChat(false);
        }
    };

    return (
        <div className="admin-dashboard-container">
            {/* Notification Sound */}
            <audio ref={notificationSound} src="/notification.wav" preload="auto" />

            <div className="admin-dashboard-main">
                <SupervisorHeader
                    title="Messages"
                    subtitle="Communicate with coordinators and administrators"
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
                                placeholder="Search messages by sender, subject, or content..."
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

                        {/* New Conversation Button */}
                        <button className="btn-compose" onClick={() => setShowCompose(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                <line x1="9" y1="10" x2="15" y2="10"></line>
                                <line x1="12" y1="7" x2="12" y2="13"></line>
                            </svg>
                            New Conversation
                        </button>
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

                                {/* Modal Body */}
                                <div style={{ padding: '24px' }}>
                                    {/* From/To */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>
                                            {selectedMessage.type === 'sent' ? 'To' : 'From'}
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                                            {selectedMessage.type === 'sent' ? selectedMessage.recipient_name : selectedMessage.sender_name}
                                        </div>
                                    </div>

                                    {/* Subject */}
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

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                        {selectedMessage.type === 'received' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedMessage(null);
                                                    setShowCompose(true);
                                                    setRecipientId(selectedMessage.sender);
                                                    setSubject(`Re: ${selectedMessage.subject}`);
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
                                        )}
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
                                <div className="empty-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ccc' }}>
                                        <path d="M22 12h-6l-2 3h-4l-2-3H2"></path>
                                        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                                    </svg>
                                </div>
                                <h3>No messages yet</h3>
                                <p>Start a conversation with coordinators or administrators</p>
                            </div>
                        ) : (
                            <div className="messages-list">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.contactId}
                                        className={`message-card ${conv.unreadCount > 0 ? 'unread' : ''}`}
                                        onClick={() => handleOpenChat(conv)}
                                        style={{ cursor: 'pointer' }}
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
                                                    <span style={{
                                                        background: '#2196f3',
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        marginLeft: '8px'
                                                    }}>
                                                        {conv.unreadCount}
                                                    </span>
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
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#999',
                                            marginTop: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                            {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Modal */}
                    {
                        showChatModal && chatUser && (
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
                                zIndex: 10000,
                                padding: '20px'
                            }}
                                onClick={() => setShowChatModal(false)}
                            >
                                <div style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    maxWidth: '700px',
                                    width: '100%',
                                    height: '80vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    overflow: 'hidden'
                                }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Chat Header */}
                                    <div style={{
                                        padding: '20px 24px',
                                        borderBottom: '1px solid #e0e0e0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: '#c8102e',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: '600',
                                                fontSize: '18px'
                                            }}>
                                                {chatUser.name ? chatUser.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: '600' }}>
                                                    {chatUser.name || 'Unknown User'}
                                                </h2>
                                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                                                    {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                                            {/* Menu Button */}
                                            <button
                                                onClick={() => setShowChatMenu(!showChatMenu)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.2)',
                                                    border: 'none',
                                                    color: 'white',
                                                    fontSize: '20px',
                                                    cursor: 'pointer',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'background 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="1"></circle>
                                                    <circle cx="12" cy="5" r="1"></circle>
                                                    <circle cx="12" cy="19" r="1"></circle>
                                                </svg>
                                            </button>

                                            {/* Dropdown Menu */}
                                            {showChatMenu && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '40px',
                                                    right: '40px',
                                                    background: 'white',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    overflow: 'hidden',
                                                    zIndex: 10001,
                                                    minWidth: '200px'
                                                }}>
                                                    <button
                                                        onClick={handleViewAttachments}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            border: 'none',
                                                            background: 'white',
                                                            color: '#333',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            fontSize: '14px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f7fa'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                                        </svg>
                                                        View Attachments ({getChatAttachments().length})
                                                    </button>
                                                    <div style={{ height: '1px', background: '#e0e0e0' }}></div>
                                                    <button
                                                        onClick={handleDeleteConversation}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            border: 'none',
                                                            background: 'white',
                                                            color: '#dc3545',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            fontSize: '14px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fff5f5'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                                        </svg>
                                                        Delete Conversation
                                                    </button>
                                                </div>
                                            )}

                                            {/* Close Button */}
                                            <button
                                                onClick={() => setShowChatModal(false)}
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
                                                    justifyContent: 'center',
                                                    transition: 'background 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chat Messages Area */}
                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '20px',
                                        background: '#f5f7fa',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        {chatMessages.length === 0 ? (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '40px 20px',
                                                color: '#999'
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', color: '#ccc' }}>
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                                <p style={{ margin: 0, fontSize: '16px' }}>No messages yet. Start the conversation!</p>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg, index) => {
                                                const isSent = msg.type === 'sent';
                                                const showDate = index === 0 ||
                                                    new Date(chatMessages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                                                return (
                                                    <React.Fragment key={msg.id}>
                                                        {showDate && (
                                                            <div style={{
                                                                textAlign: 'center',
                                                                margin: '12px 0',
                                                                fontSize: '0.75rem',
                                                                color: '#999'
                                                            }}>
                                                                {new Date(msg.created_at).toLocaleDateString('en-US', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                        )}
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: isSent ? 'flex-end' : 'flex-start',
                                                                marginBottom: '4px',
                                                                position: 'relative'
                                                            }}
                                                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                                                            onMouseLeave={() => setHoveredMessageId(null)}
                                                        >
                                                            {/* Reply Button (Left for Sent messages) */}
                                                            {isSent && hoveredMessageId === msg.id && (
                                                                <button
                                                                    onClick={() => setReplyingTo(msg)}
                                                                    title="Reply"
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        padding: '0 8px',
                                                                        color: '#999',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="9 17 4 12 9 7"></polyline>
                                                                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <div style={{
                                                                maxWidth: '70%',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: isSent ? 'flex-end' : 'flex-start'
                                                            }}>
                                                                <div style={{
                                                                    background: isSent
                                                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                                        : 'white',
                                                                    color: isSent ? 'white' : '#333',
                                                                    padding: '12px 16px',
                                                                    borderRadius: isSent
                                                                        ? '18px 18px 4px 18px'
                                                                        : '18px 18px 18px 4px',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                                    wordWrap: 'break-word',
                                                                    position: 'relative',
                                                                    minWidth: '120px'
                                                                }}>
                                                                    {/* Display Quoted Message */}
                                                                    {msg.reply_to && (
                                                                        <div style={{
                                                                            background: isSent ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                                                                            borderLeft: `3px solid ${isSent ? 'rgba(255,255,255,0.5)' : '#667eea'}`,
                                                                            borderRadius: '4px',
                                                                            padding: '4px 8px',
                                                                            marginBottom: '6px',
                                                                            fontSize: '0.8rem',
                                                                            cursor: 'pointer'
                                                                        }}>
                                                                            <div style={{ fontWeight: '600', opacity: 0.8, marginBottom: '2px' }}>
                                                                                {chatMessages.find(m => m.id === msg.reply_to)?.sender_name || 'User'}
                                                                            </div>
                                                                            <div style={{
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                maxWidth: '200px',
                                                                                opacity: 0.9
                                                                            }}>
                                                                                {chatMessages.find(m => m.id === msg.reply_to)?.message || 'Message unavailable'}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div style={{
                                                                        fontSize: '0.95rem',
                                                                        lineHeight: '1.5',
                                                                        whiteSpace: 'pre-wrap'
                                                                    }}>
                                                                        {msg.message}
                                                                    </div>
                                                                    {msg.attachment && (
                                                                        <a
                                                                            href={msg.attachment}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '6px',
                                                                                marginTop: '8px',
                                                                                padding: '6px 12px',
                                                                                background: isSent ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                                                                                borderRadius: '8px',
                                                                                color: isSent ? 'white' : '#667eea',
                                                                                textDecoration: 'none',
                                                                                fontSize: '0.85rem'
                                                                            }}
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                                                            </svg>
                                                                            Attachment
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '0.7rem',
                                                                    color: '#999',
                                                                    marginTop: '4px',
                                                                    padding: '0 4px'
                                                                }}>
                                                                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                    {isSent && (
                                                                        <>
                                                                            {msg.read_at ? (
                                                                                // Read - Blue double check
                                                                                <>
                                                                                    <svg
                                                                                        width="14"
                                                                                        height="14"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="#4fc3f7"
                                                                                        strokeWidth="2"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        style={{ marginLeft: '4px', verticalAlign: 'middle' }}
                                                                                        title="Read"
                                                                                    >
                                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                                    </svg>
                                                                                    <svg
                                                                                        width="14"
                                                                                        height="14"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="#4fc3f7"
                                                                                        strokeWidth="2"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        style={{ marginLeft: '-8px', verticalAlign: 'middle' }}
                                                                                        title="Read"
                                                                                    >
                                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                                    </svg>
                                                                                </>
                                                                            ) : msg.delivered_at ? (
                                                                                // Delivered - Gray double check
                                                                                <>
                                                                                    <svg
                                                                                        width="14"
                                                                                        height="14"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="#999"
                                                                                        strokeWidth="2"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        style={{ marginLeft: '4px', verticalAlign: 'middle' }}
                                                                                        title="Delivered"
                                                                                    >
                                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                                    </svg>
                                                                                    <svg
                                                                                        width="14"
                                                                                        height="14"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="#999"
                                                                                        strokeWidth="2"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        style={{ marginLeft: '-8px', verticalAlign: 'middle' }}
                                                                                        title="Delivered"
                                                                                    >
                                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                                    </svg>
                                                                                </>
                                                                            ) : (
                                                                                // Sent - Single gray check
                                                                                <svg
                                                                                    width="14"
                                                                                    height="14"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="#999"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    style={{ marginLeft: '4px', verticalAlign: 'middle' }}
                                                                                    title="Sent"
                                                                                >
                                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                                </svg>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Reply Button (Right for Received messages) */}
                                                            {!isSent && hoveredMessageId === msg.id && (
                                                                <button
                                                                    onClick={() => setReplyingTo(msg)}
                                                                    title="Reply"
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        padding: '0 8px',
                                                                        color: '#999',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="9 17 4 12 9 7"></polyline>
                                                                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Chat Input Area */}
                                    <div className="chat-input-area">
                                        {isTyping && (
                                            <div style={{
                                                padding: '4px 20px',
                                                fontSize: '0.75rem',
                                                color: '#667eea',
                                                fontStyle: 'italic',
                                                fontWeight: '500'
                                            }}>
                                                {chatUser.first_name || 'User'} is typing...
                                            </div>
                                        )}

                                        <form onSubmit={handleSendChatMessage} style={{
                                            padding: '16px 20px',
                                            borderTop: '1px solid #e0e0e0',
                                            background: 'white',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}>
                                            {/* Reply Preview */}
                                            {replyingTo && (
                                                <div style={{
                                                    padding: '8px 12px',
                                                    background: '#f5f5f5',
                                                    borderLeft: '3px solid #667eea',
                                                    borderRadius: '4px',
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                                                        <span style={{ fontWeight: '600', color: '#667eea', marginRight: '6px' }}>
                                                            Replying to {replyingTo.sender_name || replyingTo.sender}:
                                                        </span>
                                                        {replyingTo.message}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setReplyingTo(null)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            color: '#666'
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Attachment Preview */}
                                            {chatAttachment && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px 12px',
                                                    background: '#f0f0f0',
                                                    borderRadius: '8px',
                                                    fontSize: '14px'
                                                }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                                    </svg>
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {chatAttachment.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setChatAttachment(null)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            color: '#999'
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Input Row */}
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                                {/* Hidden File Input */}
                                                <input
                                                    type="file"
                                                    id="supervisor-chat-file-input"
                                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setChatAttachment(e.target.files[0]);
                                                        }
                                                    }}
                                                    style={{ display: 'none' }}
                                                />

                                                {/* Attachment Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('supervisor-chat-file-input').click()}
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        border: '2px solid #e0e0e0',
                                                        background: 'white',
                                                        color: '#667eea',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.3s ease',
                                                        flexShrink: 0
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = '#667eea';
                                                        e.currentTarget.style.background = '#f5f7fa';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                                        e.currentTarget.style.background = 'white';
                                                    }}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                                    </svg>
                                                </button>

                                                {/* Text Input */}
                                                <textarea
                                                    value={chatInput}
                                                    onChange={handleInputChange}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendChatMessage(e);
                                                        }
                                                    }}
                                                    placeholder={`Message ${chatUser?.first_name || '...'}`}
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px 16px',
                                                        border: '2px solid #e0e0e0',
                                                        borderRadius: '24px',
                                                        fontSize: '15px',
                                                        fontFamily: 'inherit',
                                                        resize: 'none',
                                                        minHeight: '48px',
                                                        maxHeight: '120px',
                                                        outline: 'none',
                                                        transition: 'border-color 0.3s ease'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    rows={1}
                                                />

                                                {/* Send Button */}
                                                <button
                                                    type="submit"
                                                    disabled={(!chatInput.trim() && !chatAttachment) || sendingChat}
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        background: (chatInput.trim() || chatAttachment) && !sendingChat
                                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                            : '#e0e0e0',
                                                        color: 'white',
                                                        cursor: (chatInput.trim() || chatAttachment) && !sendingChat ? 'pointer' : 'not-allowed',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.3s ease',
                                                        flexShrink: 0,
                                                        boxShadow: (chatInput.trim() || chatAttachment) && !sendingChat
                                                            ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                                            : 'none'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if ((chatInput.trim() || chatAttachment) && !sendingChat) {
                                                            e.target.style.transform = 'scale(1.05)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    {sendingChat ? (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                                            <line x1="12" y1="2" x2="12" y2="6"></line>
                                                            <line x1="12" y1="18" x2="12" y2="22"></line>
                                                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                                            <line x1="2" y1="12" x2="6" y2="12"></line>
                                                            <line x1="18" y1="12" x2="22" y2="12"></line>
                                                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                                        </svg>
                                                    ) : (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Attachments Modal */}
                    {showAttachmentsModal && chatUser && (
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
                            zIndex: 10002,
                            padding: '20px'
                        }}
                            onClick={() => setShowAttachmentsModal(false)}
                        >
                            <div style={{
                                background: 'white',
                                borderRadius: '16px',
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '80vh',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                overflow: 'hidden'
                            }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div style={{
                                    padding: '20px 24px',
                                    borderBottom: '1px solid #e0e0e0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#c8102e',
                                }}>
                                    <div>
                                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: '600' }}>
                                            Attachments
                                        </h2>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                                            {getChatAttachments().length} file{getChatAttachments().length !== 1 ? 's' : ''} shared with {chatUser.name}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowAttachmentsModal(false)}
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
                                            justifyContent: 'center',
                                            transition: 'background 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>

                                {/* Attachments List */}
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '20px'
                                }}>
                                    {getChatAttachments().length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '40px 20px',
                                            color: '#999'
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', color: '#ccc' }}>
                                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                            </svg>
                                            <p style={{ margin: 0, fontSize: '16px' }}>No attachments in this conversation</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {getChatAttachments().map((attachment, index) => {
                                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment.filename);
                                                return (
                                                    <div key={index} style={{
                                                        padding: '16px',
                                                        background: '#f5f7fa',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        transition: 'transform 0.2s',
                                                        cursor: 'pointer'
                                                    }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                                    >
                                                        {/* File Icon/Preview */}
                                                        <div style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            borderRadius: '8px',
                                                            background: isImage ? '#fff' : '#667eea',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                            flexShrink: 0
                                                        }}>
                                                            {isImage ? (
                                                                <img src={attachment.url} alt={attachment.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                                                    <polyline points="13 2 13 9 20 9"></polyline>
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* File Info */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontWeight: '500',
                                                                fontSize: '14px',
                                                                color: '#333',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {attachment.filename}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '12px',
                                                                color: '#999',
                                                                marginTop: '4px'
                                                            }}>
                                                                {attachment.sender} • {new Date(attachment.date).toLocaleDateString()}
                                                            </div>
                                                        </div>

                                                        {/* Download Button */}
                                                        <a
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                padding: '8px 12px',
                                                                background: '#667eea',
                                                                color: 'white',
                                                                borderRadius: '8px',
                                                                textDecoration: 'none',
                                                                fontSize: '13px',
                                                                fontWeight: '500',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                transition: 'background 0.2s',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#5568d3'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                                <polyline points="7 10 12 15 17 10"></polyline>
                                                                <line x1="12" y1="15" x2="12" y2="3"></line>
                                                            </svg>
                                                            View
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {
                        showCompose && (
                            <div className="modal-overlay" onClick={() => setShowCompose(false)}>
                                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h2>New Conversation</h2>
                                        <button className="modal-close" onClick={() => setShowCompose(false)}>×</button>
                                    </div>
                                    <form onSubmit={handleSendMessage} className="compose-form">
                                        <div className="form-group">
                                            <label style={{ fontWeight: '600', color: '#333', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                                Send to
                                            </label>
                                            <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required className="form-control" style={{
                                                padding: '12px 16px',
                                                border: '2px solid #e0e0e0',
                                                borderRadius: '10px',
                                                fontSize: '14px'
                                            }}>
                                                <option value="">Choose a coordinator or administrator...</option>
                                                {users.map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.first_name} {user.last_name} • {user.role}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Hidden subject field - auto-generated */}
                                        <input type="hidden" value={subject || 'New Message'} />

                                        <div className="form-group">
                                            <label style={{ fontWeight: '600', color: '#333', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                                Your message
                                            </label>
                                            <textarea
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Type your message here..."
                                                required
                                                className="form-control"
                                                rows={6}
                                                style={{
                                                    padding: '12px 16px',
                                                    border: '2px solid #e0e0e0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label style={{ fontWeight: '600', color: '#333', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                                                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                                </svg>
                                                Attach file (optional)
                                            </label>
                                            <input
                                                type="file"
                                                onChange={(e) => setAttachment(e.target.files[0])}
                                                className="form-control"
                                                accept="image/*,.pdf,.doc,.docx"
                                                style={{
                                                    padding: '10px',
                                                    border: '2px dashed #e0e0e0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px'
                                                }}
                                            />
                                            {attachment && (
                                                <div style={{
                                                    marginTop: '10px',
                                                    padding: '10px 12px',
                                                    background: '#f5f5f5',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    color: '#666'
                                                }}>
                                                    📎 {attachment.name} ({(attachment.size / 1024).toFixed(2)} KB)
                                                </div>
                                            )}
                                            <small style={{ color: '#999', marginTop: '6px', display: 'block', fontSize: '12px' }}>
                                                Images, PDF, Word documents supported
                                            </small>
                                        </div>

                                        <div className="modal-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setShowCompose(false)} disabled={sending}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-send" disabled={sending}>
                                                {sending ? 'Sending...' : 'Send Message'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                        )}
                </div>
            </div>
        </div >
    );
}

export default SupervisorMessages;
