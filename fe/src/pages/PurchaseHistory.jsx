import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ShoppingBag, ArrowLeft, Package, Clock, CheckCircle } from 'lucide-react';

const PurchaseHistory = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchMyOrders();
    }, [user]);

    const fetchMyOrders = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('http://localhost:8080/api/orders/my-orders', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Lỗi tải đơn hàng:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString('vi-VN');

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải dữ liệu...</div>;

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '4rem' }}>
            {/* Header đơn giản */}
            <header style={{ backgroundColor: 'white', padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/home" style={{ color: '#4b5563', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={20} /> Quay lại
                </Link>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Lịch sử mua hàng</h1>
            </header>

            <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #d1d5db' }}>
                        <ShoppingBag size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ color: '#374151', margin: '0 0 0.5rem 0' }}>Bạn chưa có đơn hàng nào</h3>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Hãy khám phá các sản phẩm tuyệt vời trên StudentHub nhé.</p>
                        <Link to="/shop" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
                            Mua sắm ngay
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {orders.map((order) => (
                            <div key={order.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                {/* Trạng thái & Ngày */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.9rem', fontWeight: '500' }}>
                                        <CheckCircle size={16} /> Giao dịch thành công
                                    </span>
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} /> {formatDate(order.created_at)}
                                    </span>
                                </div>

                                {/* Thông tin sản phẩm */}
                                <Link to={`/product/${order.product_id}`} style={{ display: 'flex', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#f3f4f6', flexShrink: 0, overflow: 'hidden' }}>
                                        {order.products?.image_url ? (
                                            <img src={order.products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package color="#9ca3af" /></div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#111827' }}>
                                            {order.products?.name || 'Sản phẩm không xác định'}
                                        </h3>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Mã ĐH: {order.id.split('-')[0].toUpperCase()}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                            {formatPrice(order.amount)}
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseHistory;