import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, MessageSquare, User, Search, X } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [, setIsSearching] = useState(false);

    const messagesEndRef = useRef(null);

    const API_BASE_URL = 'http://localhost:8080/api/chat';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/conversations/${user.id}`);
                const data = await response.json();
                setConversations(Array.isArray(data) ? data : []);
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

        return () => supabase.removeChannel(convChannel);
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
                body: JSON.stringify({ user1Id: user.id, user2Id: targetUser.id })
            });
            const data = await response.json();
            setActiveConv(data);
        } catch (error) {
            console.error('Lỗi khi mở hội thoại:', error);
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
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
        setLoading(false);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-page">
            <div className="bg-mesh"></div>
            
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
                        {conversations.map(conv => (
                            <div 
                                key={conv.id} 
                                className={`user-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                                onClick={() => setActiveConv(conv)}
                            >
                                <div className="user-avatar" style={{ background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageSquare size={20} color={activeConv?.id === conv.id ? 'white' : 'var(--primary)'} />
                                </div>
                                <div className="user-info">
                                    <h4>{conv.id.substring(0, 8)}...</h4>
                                    <p>Nhấn để xem tin nhắn</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chat-main">
                    {activeConv ? (
                        <>
                            <div className="chat-header">
                                <div className="header-user">
                                    <div className="status-dot"></div>
                                    <h4>Cuộc trò chuyện</h4>
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
                                            <div>{msg.content}</div>
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
