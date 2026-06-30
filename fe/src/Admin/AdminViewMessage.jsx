import React, { useState, useEffect } from 'react';
import { Search, User, MessageCircle, MoreVertical, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminViewMessage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Load danh sách hội thoại khi vào trang
    useEffect(() => {
        const fetchConvs = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('http://localhost:8080/api/admin/messages/conversations', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await response.json();
            setConversations(data);
        };
        fetchConvs();
    }, []);

    // Load tin nhắn khi click vào một hội thoại
    const handleSelectConv = async (conv) => {
        setSelectedConv(conv);
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`http://localhost:8080/api/admin/messages/${conv.id}`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        const data = await response.json();
        setMessages(data);
        setLoading(false);
    };

    const filteredConversations = conversations.filter(c => 
        c.user1Name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.user2Name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', height: '85vh', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            
            {/* CỘT TRÁI: DANH SÁCH HỘP THƯ */}
            <div style={{ width: '380px', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a' }}>Messages</h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8c8c8c' }} />
                        <input 
                            type="text" 
                            placeholder="Search conversations..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e8e8e8', outline: 'none', background: '#f9f9f9' }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredConversations.map(conv => (
                        <div 
                            key={conv.id}
                            onClick={() => handleSelectConv(conv)}
                            style={{ 
                                padding: '16px 24px', cursor: 'pointer', transition: '0.3s',
                                borderBottom: '1px solid #fafafa',
                                background: selectedConv?.id === conv.id ? '#f0f7ff' : 'transparent',
                                borderLeft: selectedConv?.id === conv.id ? '4px solid #1890ff' : '4px solid transparent'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{conv.user1Name} & {conv.user2Name}</span>
                                <span style={{ fontSize: '0.75rem', color: '#bfbfbf' }}>
                                    {new Date(conv.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#8c8c8c', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {conv.lastMessage || "Click to view chat history..."}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CỘT PHẢI: CHI TIẾT CHAT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fcfcfc' }}>
                {selectedConv ? (
                    <>
                        {/* Header của Chat vùng */}
                        <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} color="#1890ff" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{selectedConv.user1Name} vs {selectedConv.user2Name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#52c41a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ShieldCheck size={12} /> Admin Monitoring Mode
                                    </div>
                                </div>
                            </div>
                            <MoreVertical size={20} color="#bfbfbf" style={{ cursor: 'pointer' }} />
                        </div>

                        {/* Vùng hiển thị tin nhắn */}
                        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: '20px' }}>Loading messages...</div>
                            ) : (
                                messages.map(msg => {
                                    const isUser1 = msg.senderId === selectedConv.user1Id;
                                    return (
                                        <div key={msg.id} style={{ alignSelf: isUser1 ? 'flex-start' : 'flex-end', maxWidth: '70%' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#bfbfbf', marginBottom: '4px', textAlign: isUser1 ? 'left' : 'right' }}>
                                                {isUser1 ? selectedConv.user1Name : selectedConv.user2Name} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            <div style={{ 
                                                padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem',
                                                background: isUser1 ? '#fff' : '#1890ff',
                                                color: isUser1 ? '#000' : '#fff',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                border: isUser1 ? '1px solid #f0f0f0' : 'none'
                                            }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf' }}>
                        <MessageCircle size={64} strokeWidth={1} style={{ marginBottom: '16px' }} />
                        <p>Select a conversation to monitor messages</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminViewMessage;