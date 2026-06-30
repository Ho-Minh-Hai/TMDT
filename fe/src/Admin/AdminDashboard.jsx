import React, { useState, useEffect } from 'react';
import { Activity, MessageCircle, Tag, Edit, Trash2, Calendar, User, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const fetchLogs = async (currentPage) => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`http://localhost:8080/api/admin/activity-logs?page=${currentPage}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.content || []);
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error("Lỗi khi fetch activity logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    const getActionIcon = (action) => {
        switch (action) {
            case 'post_product':
                return <Tag size={16} color="#16a34a" />;
            case 'comment':
                return <MessageCircle size={16} color="#3b82f6" />;
            case 'update_product':
                return <Edit size={16} color="#d97706" />;
            case 'delete_product':
                return <Trash2 size={16} color="#dc2626" />;
            default:
                return <Activity size={16} color="#64748b" />;
        }
    };

    const getActionBadgeStyle = (action) => {
        switch (action) {
            case 'post_product':
                return { backgroundColor: '#dcfce7', color: '#166534' };
            case 'comment':
                return { backgroundColor: '#dbeafe', color: '#1e40af' };
            case 'update_product':
                return { backgroundColor: '#fef3c7', color: '#854d0e' };
            case 'delete_product':
                return { backgroundColor: '#fee2e2', color: '#991b1b' };
            default:
                return { backgroundColor: '#f1f5f9', color: '#334155' };
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'post_product': return 'Đăng sản phẩm';
            case 'comment': return 'Bình luận';
            case 'update_product': return 'Sửa sản phẩm';
            case 'delete_product': return 'Xóa sản phẩm';
            default: return 'Hoạt động';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Dashboard</h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px', margin: 0 }}>Nhật ký hoạt động hệ thống và thống kê tổng quan.</p>
                </div>
                <button 
                    onClick={() => fetchLogs(page)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                        backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: '600', color: '#334155', transition: 'all 0.2s'
                    }}
                >
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            {/* Stats Cards (Tổng quan nhanh) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Tổng số hoạt động</p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{logs.length * page} +</h3>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Trạng thái hệ thống</p>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ● Hoạt động ổn định
                    </h3>
                </div>
            </div>

            {/* Activity Logs Feed */}
            <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} color="#3b82f6" /> Nhật ký hoạt động gần đây
                </h2>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải nhật ký hoạt động...</div>
                ) : logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chưa có hoạt động nào được ghi nhận.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {logs.map((log) => (
                            <div 
                                key={log.id} 
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px',
                                    borderRadius: '10px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc',
                                    transition: 'transform 0.2s', cursor: 'default'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                            >
                                {/* Action Icon wrapper */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '36px', height: '36px', borderRadius: '8px',
                                    backgroundColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                                }}>
                                    {getActionIcon(log.action)}
                                </div>

                                {/* Content info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>
                                                {log.userFullName}
                                            </span>
                                            <span style={{ 
                                                fontSize: '0.75rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px',
                                                ...getActionBadgeStyle(log.action)
                                            }}>
                                                {getActionLabel(log.action)}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '0.925rem', lineHeight: '1.5' }}>
                                        {log.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(p => p - 1)}
                            style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', backgroundColor: '#white' }}
                        >
                            Trước
                        </button>
                        <span style={{ padding: '8px 16px', color: '#64748b' }}>Trang {page} / {totalPages}</span>
                        <button 
                            disabled={page === totalPages} 
                            onClick={() => setPage(p => p + 1)}
                            style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
