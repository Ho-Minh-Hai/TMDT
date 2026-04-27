import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, MessageSquare, User, Search, X, MapPin, StickyNote } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [conversationUsers, setConversationUsers] = useState({});
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

                // Fetch user info for each conversation
                const userInfoMap = {};
                for (const conv of convs) {
                    const otherUserId = getOtherUserId(conv);
                    const userInfo = await fetchUserInfo(otherUserId);
                    if (userInfo) {
                        userInfoMap[conv.id] = userInfo;
                    }
                }
                setConversationUsers(userInfoMap);
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
                    if (payload.new.sender_id !== user.id) {
                        setUnreadCounts(prev => {
                            // If we are currently active on this conversation, do not increment (it will be marked read)
                            // However, we don't have activeConv in this closure's dependency, so we just increment it.
                            // The activeConv effect will mark it read anyway.
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
                setMessages(Array.isArray(data) ? data : []);
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
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-page">
            <div className="bg-mesh"></div>
            
            {/* Notes Widget - Right Corner */}
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
            
            <Link to="/home" className="back-home">
                <ArrowLeft size={20} />
                <span>Trang chủ</span>
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chat-container">
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-title-row">
                            <h2>Trò chuyện</h2>
                        </div>
                        
                        <div className="chat-search-wrapper">
                            <div className="chat-search-input">
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm bạn bè..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button className="clear-search" onClick={() => setSearchTerm('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {searchResults.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="search-results-popup"
                                    >
                                        <div className="search-results-label">Kết quả tìm kiếm</div>
                                        {searchResults.map(u => (
                                            <div key={u.id} className="search-result-item" onClick={() => handleStartChat(u)}>
                                                <div className="result-avatar">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="" />
                                                    ) : (
                                                        <User size={16} />
                                                    )}
                                                </div>
                                                <div className="result-info">
                                                    <span className="result-name">{u.full_name}</span>
                                                    <span className="result-status">Người dùng hệ thống</span>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="user-list">
                        {conversations.map(conv => {
                            const convUser = conversationUsers[conv.id];
                            return (
                            <div 
                                key={conv.id} 
                                className={`user-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveConv(conv);
                                    setActiveUser(convUser);
                                }}
                            >
                                <div className="user-avatar" style={{ background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {convUser?.avatar_url ? (
                                        <img src={convUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={20} color={activeConv?.id === conv.id ? 'white' : 'var(--primary)'} />
                                    )}
                                </div>
                                <div className="user-info">
                                    <h4>{convUser?.full_name || 'User'}</h4>
                                    <p>Nhấn để xem tin nhắn</p>
                                </div>
                                {unreadCounts[conv.id] > 0 && (
                                    <div className="unread-badge">
                                        {unreadCounts[conv.id]}
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                </div>

                <div className="chat-main">
                    {activeConv ? (
                        <>
                            <div className="chat-header">
                                <div className="header-user">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
                                        {activeUser?.avatar_url ? (
                                            <img src={activeUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h4>{activeUser?.full_name}</h4>
                                    </div>
                                </div>
                                <div className="header-actions">
                                    <button type="button" className="action-btn location-btn" onClick={handleShareLocation} disabled={loading} title="Chia sẻ vị trí">
                                        <MapPin size={20} />
                                    </button>
                                    <button type="button" className="action-btn note-btn" onClick={handleNote} disabled={loading} title="Ghi chú">
                                        <StickyNote size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="messages-area">
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, index) => (
                                        <motion.div
                                            key={msg.id || index}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                                        >
                                            {msg.message_type === 'location' ? (
                                                <a href={msg.content} target="_blank" rel="noopener noreferrer" className="location-link">
                                                 Vị trí hiện tại
                                                </a>
                                            ) : (
                                                <div>{msg.content}</div>
                                            )}
                                            <span className="message-time">{formatTime(msg.created_at)}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input-wrapper">
                                <form onSubmit={handleSendMessage} className="chat-input-form">
                                    <input 
                                        type="text" 
                                        placeholder="Nhập tin nhắn..." 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button type="submit" className="send-btn" disabled={loading || !newMessage.trim()}>
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="empty-chat-state">
                            <MessageSquare size={64} style={{ opacity: 0.1 }} />
                            <p>Chọn một cuộc trò chuyện hoặc tìm người dùng mới</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Chat;
