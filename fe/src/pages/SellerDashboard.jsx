import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api';
import { Package, PlusCircle, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const SellerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: products.length,
        available: products.filter(p => p.status === 'available').length,
        sold: products.filter(p => p.status === 'sold').length,
        pending: products.filter(p => p.status === 'pending').length,
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Tổng quan</h1>
                    <p className="dashboard-subtitle">Chào mừng bạn trở lại! Đây là tổng quan cửa hàng của bạn.</p>
                </div>
                <Link to="/seller/products/new" className="btn-primary">
                    <PlusCircle size={20} />
                    <span>Thêm sản phẩm</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card stat-card-total">
                    <div className="stat-icon-wrapper stat-icon-blue">
                        <Package size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.total}</span>
                        <span className="stat-label">Tổng sản phẩm</span>
                    </div>
                </div>
                <div className="stat-card stat-card-available">
                    <div className="stat-icon-wrapper stat-icon-green">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.available}</span>
                        <span className="stat-label">Đang bán</span>
                    </div>
                </div>
                <div className="stat-card stat-card-sold">
                    <div className="stat-icon-wrapper stat-icon-purple">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.sold}</span>
                        <span className="stat-label">Đã bán</span>
                    </div>
                </div>
                <div className="stat-card stat-card-pending">
                    <div className="stat-icon-wrapper stat-icon-orange">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.pending}</span>
                        <span className="stat-label">Chờ duyệt</span>
                    </div>
                </div>
            </div>

            {/* Recent Products */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Sản phẩm gần đây</h2>
                    <Link to="/seller/products" className="section-link">
                        Xem tất cả →
                    </Link>
                </div>

                {products.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Package size={48} />
                        </div>
                        <h3>Chưa có sản phẩm nào</h3>
                        <p>Bắt đầu bán hàng bằng cách thêm sản phẩm đầu tiên của bạn!</p>
                        <Link to="/seller/products/new" className="btn-primary" style={{ marginTop: '1rem' }}>
                            <PlusCircle size={18} />
                            <span>Thêm sản phẩm ngay</span>
                        </Link>
                    </div>
                ) : (
                    <div className="recent-products-grid">
                        {products.slice(0, 4).map((product) => (
                            <div key={product.id} className="recent-product-card">
                                <div className="recent-product-img">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} />
                                    ) : (
                                        <div className="img-placeholder">
                                            <Package size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="recent-product-info">
                                    <h4>{product.name}</h4>
                                    <p className="recent-product-price">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                    </p>
                                    <span className={`status-badge status-${product.status}`}>
                                        {product.status === 'available' ? 'Đang bán' :
                                         product.status === 'sold' ? 'Đã bán' :
                                         product.status === 'pending' ? 'Chờ duyệt' : product.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
