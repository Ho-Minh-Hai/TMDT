import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle, Clock, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminOrder = () => {
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'completed' | 'pending'
    const [isLoading, setIsLoading] = useState(false);

    const fetchOrders = async (currentPage) => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
                return;
            }

            const response = await fetch(`http://localhost:8080/api/orders/admin?status=${filterStatus}&page=${currentPage}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data.content || []);
                setTotalPages(data.totalPages || 1);
            } else {
                console.error("Lỗi tải danh sách đơn hàng:", response.status);
            }
        } catch (error) {
            console.error("Lỗi khi kết nối server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(page);
    }, [page, filterStatus]);

    const handleToggleStatus = async (orderId, currentStatus) => {
        const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        const statusLabel = nextStatus === 'completed' ? 'Đã bán' : 'Chưa bán';

        if (!window.confirm(`Bạn có muốn đổi trạng thái đơn hàng này thành "${statusLabel}" không?`)) {
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`http://localhost:8080/api/orders/admin/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (response.ok) {
                alert("Cập nhật trạng thái thành công!");
                fetchOrders(page);
            } else {
                alert("Lỗi cập nhật trạng thái đơn hàng!");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Quản lý Đơn hàng</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px', margin: 0 }}>Xem danh sách giao dịch, hóa đơn và đánh dấu đã bán/chưa bán.</p>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button 
                        onClick={() => { setFilterStatus('all'); setPage(1); }}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            backgroundColor: filterStatus === 'all' ? '#fff' : 'transparent',
                            color: filterStatus === 'all' ? '#0f172a' : '#64748b',
                            fontWeight: '600', transition: 'all 0.2s'
                        }}
                    >
                        Tất cả
                    </button>
                    <button 
                        onClick={() => { setFilterStatus('completed'); setPage(1); }}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            backgroundColor: filterStatus === 'completed' ? '#fff' : 'transparent',
                            color: filterStatus === 'completed' ? '#16a34a' : '#64748b',
                            fontWeight: '600', transition: 'all 0.2s'
                        }}
                    >
                        Đã bán
                    </button>
                    <button 
                        onClick={() => { setFilterStatus('pending'); setPage(1); }}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            backgroundColor: filterStatus === 'pending' ? '#fff' : 'transparent',
                            color: filterStatus === 'pending' ? '#d97706' : '#64748b',
                            fontWeight: '600', transition: 'all 0.2s'
                        }}
                    >
                        Chưa bán
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu đơn hàng...</div>
            ) : (
                <>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>MÃ ĐƠN HÀNG</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>SẢN PHẨM</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>NGƯỜI MUA</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>GIÁ TRỊ</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>TRẠNG THÁI</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600', textAlign: 'right' }}>THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                            Không tìm thấy đơn hàng nào.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        const isCompleted = order.status === 'completed';
                                        return (
                                            <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '14px 16px', fontWeight: '600', color: '#64748b', fontSize: '0.85rem' }}>
                                                    #{order.id?.substring(0, 8).toUpperCase()}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {order.productImage ? (
                                                            <img src={order.productImage} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={18} color="#94a3b8" /></div>
                                                        )}
                                                        <span style={{ fontWeight: '500', color: '#0f172a' }}>{order.productName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px', color: '#334155' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {order.buyerAvatar && order.buyerAvatar !== 'NULL' ? (
                                                            <img src={order.buyerAvatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                                        ) : (
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>U</div>
                                                        )}
                                                        <span>{order.buyerName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontWeight: '600', color: '#3b82f6' }}>
                                                    {formatPrice(order.amount)}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    {isCompleted ? (
                                                        <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: '600', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>
                                                            <CheckCircle size={14} /> Đã bán
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: '600', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>
                                                            <Clock size={14} /> Chưa bán
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                    <button 
                                                        onClick={() => handleToggleStatus(order.id, order.status)}
                                                        style={{ 
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer',
                                                            backgroundColor: isCompleted ? '#ef4444' : '#10b981', 
                                                            color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        <RefreshCw size={14} /> {isCompleted ? "Đánh dấu chưa bán" : "Đánh dấu đã bán"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(p => p - 1)}
                                style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', backgroundColor: 'white' }}
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
                </>
            )}
        </div>
    );
};

export default AdminOrder;
