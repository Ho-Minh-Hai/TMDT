import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, User, Search, X, MapPin, StickyNote, ShoppingBag, Package, LogOut } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import './Chat.css';

const Chat = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [conversationUsers, setConversationUsers] = useState({});
    const [conversationMessages, setConversationMessages] = useState({});
    const [activeConv, setActiveConv] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({});
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [, setIsSearching] = useState(false);

    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteForm, setNoteForm] = useState({ title: '', content: '', deadline: '' });
    const [pendingNotes, setPendingNotes] = useState([]);

    const messagesEndRef = useRef(null);

    const API_BASE_URL = 'http://localhost:8080/api/chat';

    const getOtherUserId = (conv) => {
        return conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
    };

    const fetchUserInfo = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', userId)
                .single();
            
            if (!error && data) {
                return data;
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
        return null;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const markAsRead = async (conversationId) => {
        if (!conversationId || !user) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/messages/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    user_id: user.id
                })
            });
                
            if (response.ok) {
                setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchPendingNotes = async () => {
        if (!user) return;
        try {
            const response = await fetch(`http://localhost:8080/api/notes/pending/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setPendingNotes(data || []);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchPendingNotes();

        const interval = setInterval(fetchPendingNotes, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [user]);

    // Auto-mark notes as done when deadline is reached
    useEffect(() => {
        if (pendingNotes.length === 0) return;

        const checkOverdueNotes = async () => {
            const now = new Date();
            for (const note of pendingNotes) {
                const deadline = new Date(note.deadline);
                if (deadline <= now) {
                    await handleMarkNoteDone(note.id);
                }
            }
        };

        const timer = setInterval(checkOverdueNotes, 60000); // Check every minute
        checkOverdueNotes(); // Check immediately on load

        return () => clearInterval(timer);
    }, [pendingNotes]);

    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/conversations/${user.id}`);
                const data = await response.json();
                const convs = Array.isArray(data) ? data : [];
                setConversations(convs);

                // Fetch user info and messages for each conversation
                const userInfoMap = {};
                const messagesMap = {};
                for (const conv of convs) {
                    const otherUserId = getOtherUserId(conv);
                    const userInfo = await fetchUserInfo(otherUserId);
                    if (userInfo) {
                        userInfoMap[conv.id] = userInfo;
                    }
                    // Fetch messages for preview
                    try {
                        const msgResponse = await fetch(`${API_BASE_URL}/messages/${conv.id}`);
                        if (msgResponse.ok) {
                            const msgs = await msgResponse.json();
                            messagesMap[conv.id] = Array.isArray(msgs) ? msgs : [];
                        }
                    } catch (error) {
                        console.error(`Error fetching messages for conv ${conv.id}:`, error);
                    }
                }
                setConversationUsers(userInfoMap);
                setConversationMessages(messagesMap);
                
                // Fetch unread counts
                if (convs.length > 0) {
                    const { data: unreadData, error: unreadError } = await supabase
                        .from('messages')
                        .select('conversation_id')
                        .neq('sender_id', user.id)
                        .is('read_at', null)
                        .in('conversation_id', convs.map(c => c.id));
                        
                    if (!unreadError && unreadData) {
                        const counts = {};
                        unreadData.forEach(msg => {
                            counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
                        });
                        setUnreadCounts(counts);
                    }
                }
            } catch (error) {
                console.error('Error fetching conversations:', error);
                setConversations([]);
            }
        };

        fetchConversations();

        const convChannel = supabase
            .channel('public:conversations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
            .subscribe();

        const globalMsgChannel = supabase
            .channel('global:messages')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages',
                }, 
                (payload) => {
                    // Update messages map for preview
                    setConversationMessages(prev => ({
                        ...prev,
                        [payload.new.conversation_id]: [
                            ...(prev[payload.new.conversation_id] || []),
                            payload.new
                        ]
                    }));
                    
                    if (payload.new.sender_id !== user.id) {
                        setUnreadCounts(prev => {
                            return {
                                ...prev,
                                [payload.new.conversation_id]: (prev[payload.new.conversation_id] || 0) + 1
                            };
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(convChannel);
            supabase.removeChannel(globalMsgChannel);
        };
    }, [user]);

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .ilike('full_name', `%${searchTerm}%`)
                .neq('id', user.id) 
                .limit(5);

            if (!error) setSearchResults(data || []);
            setIsSearching(false);
        };

        const timer = setTimeout(searchUsers, 150); 
        return () => clearTimeout(timer);
    }, [searchTerm, user?.id]);

    useEffect(() => {
        if (!activeConv) return;

        const fetchMessages = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/messages/${activeConv.id}`);
                const data = await response.json();
                const msgs = Array.isArray(data) ? data : [];
                setMessages(msgs);
                // Update conversation messages map too
                setConversationMessages(prev => ({
                    ...prev,
                    [activeConv.id]: msgs
                }));
                // Mark messages as read after successfully fetching them
                await markAsRead(activeConv.id);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setMessages([]);
            }
        };

        fetchMessages();

        const msgChannel = supabase
            .channel(`room:${activeConv.id}`)
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages',
                    filter: `conversation_id=eq.${activeConv.id}` 
                }, 
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                    // Update conversation messages map
                    setConversationMessages(prev => ({
                        ...prev,
                        [activeConv.id]: [...(prev[activeConv.id] || []), payload.new]
                    }));
                    if (payload.new.sender_id !== user?.id) {
                        markAsRead(activeConv.id);
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(msgChannel);
    }, [activeConv]);

    const handleStartChat = async (targetUser) => {
        setSearchTerm('');
        setSearchResults([]);

        try {
            const response = await fetch(`${API_BASE_URL}/conversations/get-or-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user1_id: user.id, user2_id: targetUser.id })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Lỗi từ server:', errorData);
                alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại!');
                return;
            }
            
            const data = await response.json();
            if (data && data.id) {
                setActiveConv(data);
                setActiveUser(targetUser);
            } else {
                console.error('Dữ liệu conversation không hợp lệ:', data);
                alert('Dữ liệu không hợp lệ. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Lỗi khi mở hội thoại:', error);
            alert('Lỗi khi mở hội thoại: ' + error.message);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !activeConv) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: activeConv.id,
                    sender_id: user.id,
                    content: newMessage,
                    message_type: 'text'
                })
            });
            
            if (response.ok) {
                setNewMessage('');
            } else {
                const errorData = await response.json();
                console.error('Lỗi gửi tin nhắn:', errorData);
                alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            alert('Lỗi: ' + error.message);
        }
        setLoading(false);
    };

    const handleShareLocation = async () => {
        if (!user || !activeConv) return;

        setLoading(true);
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude, accuracy } = position.coords;
                        const locationLink = `https://www.google.com/maps/search/${latitude},${longitude}`;
                        const locationMessage = locationLink;

                        console.log(`Vị trí: ${latitude}, ${longitude} (Độ chính xác: ${accuracy}m)`);

                        try {
                            const response = await fetch(`${API_BASE_URL}/messages`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    conversation_id: activeConv.id,
                                    sender_id: user.id,
                                    content: locationMessage,
                                    message_type: 'location'
                                })
                            });

                            if (!response.ok) {
                                console.error('Lỗi gửi vị trí');
                                alert('Không thể gửi vị trí. Vui lòng thử lại!');
                            }
                        } catch (error) {
                            console.error('Lỗi gửi vị trí:', error);
                            alert('Lỗi: ' + error.message);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error('Lỗi lấy vị trí:', error);
                        alert('Không thể lấy vị trí của bạn. Vui lòng kiểm tra quyền truy cập.');
                        setLoading(false);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                alert('Trình duyệt không hỗ trợ geolocation.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Lỗi: ' + error.message);
            setLoading(false);
        }
    };

    const handleNote = () => {
        setShowNoteModal(true);
    };

    const handleSaveNote = async () => {
        if (!user || !noteForm.title.trim() || !noteForm.deadline) {
            alert('Vui lòng nhập tiêu đề và chọn ngày + giờ cần làm!');
            return;
        }

        try {
            // Parse datetime-local string correctly
            // Format: "2026-04-28T18:00"
            const [datePart, timePart] = noteForm.deadline.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute] = timePart.split(':').map(Number);

            // Create date as LOCAL time, then convert to ISO string
            const dateObj = new Date(year, month - 1, day, hour, minute, 0);
            const isoString = dateObj.toISOString();


            const response = await fetch('http://localhost:8080/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    title: noteForm.title.trim(),
                    content: noteForm.content.trim(),
                    deadline: isoString,
                    status: 'pending'
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                setShowNoteModal(false);
                setNoteForm({ title: '', content: '', deadline: '' });
                await fetchPendingNotes();
            }
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    };

    const handleMarkNoteDone = async (noteId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/notes/${noteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'done' })
            });

            if (response.ok) {
                await fetchPendingNotes();
            }
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });
        }
    };

    const getLastMessage = (convId) => {
        return conversationMessages[convId]?.[conversationMessages[convId].length - 1];
    };

    const formatLastMessage = (msg) => {
        if (!msg) return 'Không có tin nhắn';
        if (msg.message_type === 'location') return '📍 Vị trí chia sẻ';
        return msg.content.substring(0, 40) + (msg.content.length > 40 ? '...' : '');
    };

    return (
        <div className="home-container">
            <div className="bg-mesh"></div>
            
            <nav className="navbar">
                <button 
                    className="logo" 
                    style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => navigate('/home')}
                >
                    <div className="logo-icon">
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <span>Student<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                </button>

                <div className="nav-links">
                    <Link to="/shop" className="nav-link">Bộ sưu tập</Link>
                    <a href="#" className="nav-link">Ưu đãi</a>
                    <a href="#" className="nav-link">Xu hướng</a>
                    <Link to="/chat" className="nav-icon-link" title="Tin nhắn">
                        <MessageSquare size={20} />
                    </Link>
                    <Link to="/seller" className="nav-icon-link" title="Shop">
                        <Package size={20} />
                    </Link>
                </div>

                <Link to="/profile" className="user-tag" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <User size={18} />
                    <span style={{ fontSize: '0.9rem' }}>{profile?.full_name || user?.email?.split('@')[0]}</span>
                    <button onClick={(e) => { e.preventDefault(); signOut(); }} className="auth-switch" style={{ marginLeft: '1rem' }}>
                        <LogOut size={16} />
                    </button>
                </Link>
            </nav>

            <div className="chat-page">
            {/* Notes Widget */}
            {pendingNotes.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="notes-widget"
                >
                    <div className="notes-header">
                        <h3>Ghi chú ({pendingNotes.length})</h3>
                    </div>
                    <div className="notes-list">
                        {pendingNotes.map((note) => (
                            <div key={note.id} className="note-item">
                                <div className="note-title">{note.title}</div>
                                <div className="note-deadline">
                                    {new Date(note.deadline).toLocaleString('vi-VN', { 
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                <button 
                                    className="note-done-btn"
                                    onClick={() => handleMarkNoteDone(note.id)}
                                    title="Đánh dấu hoàn thành"
                                >
                                    ✓
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Note Modal */}
            <AnimatePresence>
                {showNoteModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowNoteModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="note-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Thêm ghi chú</h2>
                                <button 
                                    className="close-btn"
                                    onClick={() => setShowNoteModal(false)}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Tiêu đề *</label>
                                    <input 
                                        type="text"
                                        placeholder="Nhập tiêu đề ghi chú..."
                                        value={noteForm.title}
                                        onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ngày cần làm *</label>
                                    <input 
                                        type="datetime-local"
                                        value={noteForm.deadline}
                                        onChange={(e) => setNoteForm({ ...noteForm, deadline: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-cancel"
                                    onClick={() => setShowNoteModal(false)}
                                >
                                    Hủy
                                </button>
                                <button 
                                    className="btn-save"
                                    onClick={handleSaveNote}
                                >
                                    Lưu ghi chú
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="chat-wrapper">
                {/* Middle Column - Conversations List */}
                <div className="conversations-panel">
                    <div className="conversations-header">
                        <h2>Messages</h2>
                        <div className="conversations-search">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Search conversations..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="clear-search" onClick={() => setSearchTerm('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search Results or Conversations List */}
                    <AnimatePresence>
                        {searchResults.length > 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="search-results-list"
                            >
                                <div className="results-label">New conversations</div>
                                {searchResults.map(u => (
                                    <div key={u.id} className="conversation-item search-result-item" onClick={() => handleStartChat(u)}>
                                        <div className="conversation-avatar">
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt="" />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="conversation-info">
                                            <div className="conversation-name">{u.full_name}</div>
                                            <div className="conversation-status">Click to start chat</div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="conversations-list">
                                {conversations.length > 0 ? (
                                    conversations.map(conv => {
                                        const convUser = conversationUsers[conv.id];
                                        const lastMsg = getLastMessage(conv.id);
                                        return (
                                            <motion.div 
                                                key={conv.id}
                                                whileHover={{ scale: 1.01 }}
                                                className={`conversation-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    setActiveConv(conv);
                                                    setActiveUser(convUser);
                                                }}
                                            >
                                                <div className="conversation-avatar">
                                                    {convUser?.avatar_url ? (
                                                        <img src={convUser.avatar_url} alt="" />
                                                    ) : (
                                                        <User size={20} />
                                                    )}
                                                </div>
                                                <div className="conversation-info">
                                                    <div className="conversation-header">
                                                        <div className="conversation-name">{convUser?.full_name || 'User'}</div>
                                                        <div className="conversation-time">{lastMsg ? formatTime(lastMsg.created_at) : ''}</div>
                                                    </div>
                                                    <div className="conversation-preview">
                                                        {formatLastMessage(lastMsg)}
                                                    </div>
                                                </div>
                                                {unreadCounts[conv.id] > 0 && (
                                                    <div className="unread-badge">
                                                        {unreadCounts[conv.id]}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="empty-state">
                                        <MessageSquare size={40} opacity={0.3} />
                                        <p>No conversations yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column - Chat View */}
                {activeConv ? (
                    <div className="chat-view-panel">
                        <div className="chat-view-header">
                            <div className="chat-view-user">
                                <div className="chat-view-avatar">
                                    {activeUser?.avatar_url ? (
                                        <img src={activeUser.avatar_url} alt="" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <h3>{activeUser?.full_name}</h3>
                            </div>
                            <div className="chat-view-actions">
                                <button className="action-btn" onClick={handleShareLocation} disabled={loading} title="Share location">
                                    <MapPin size={20} />
                                </button>
                                <button className="action-btn" onClick={handleNote} disabled={loading} title="Add note">
                                    <StickyNote size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="messages-area">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id || index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                                    >
                                        {msg.message_type === 'location' ? (
                                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="location-link">
                                                Vị trí hiện tại
                                            </a>
                                        ) : (
                                            <>{msg.content}</>
                                        )}
                                        <span className="message-time">{formatTime(msg.created_at)}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-area">
                            <form onSubmit={handleSendMessage} className="chat-input-form">
                                <input 
                                    type="text" 
                                    placeholder="Type a message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={loading}
                                />
                                <button type="submit" className="send-btn" disabled={loading || !newMessage.trim()}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="empty-chat-state">
                        <MessageSquare size={64} opacity={0.2} />
                        <p>Select a conversation or search for users to start chatting</p>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default Chat;
