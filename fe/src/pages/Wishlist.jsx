import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import UserSearchBar from '../components/UserSearchBar';
import {
    ShoppingBag, Heart, User, LogOut, MessageSquare,
    Package, MapPin, Clock, Trash2, ShoppingCart, X
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import './Wishlist.css';

const CONDITIONS_MAP = {
    'new': 'Mới 100%',
    'like_new': 'Như mới (99%)',
    'good': 'Tốt',
    'fair': 'Trung bình',
};

const Wishlist = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const { fetchWishlistProducts, toggleWishlist, wishlistCount } = useWishlist();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        loadWishlist();
    }, [user]);

    const loadWishlist = async () => {
        setLoading(true);
        const data = await fetchWishlistProducts();
        setProducts(data);
        setLoading(false);
    };

    const handleRemove = async (productId) => {
        setRemovingId(productId);
        await toggleWishlist(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        setRemovingId(null);
    };

    const formatPrice = (price) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="wishlist-page">
            <div className="bg-mesh"></div>

            {/* Navbar */}
            <nav className="navbar">
                <Link to="/home" className="logo" style={{ textDecoration: 'none' }}>
                    <div className="logo-icon">
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <span>Student<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                </Link>

                <div className="nav-links">
                    <a href="/shop" className="nav-link">Bộ sưu tập</a>
                    <a href="/wishlist" className="nav-link">Yêu thích</a>
                    <a href="/chat" className="nav-link">Tin nhắn</a>
                    <a href="/seller" className="nav-link">Đăng bài</a>
                </div>
                <UserSearchBar />
                <Link to="/profile" className="user-tag" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <User size={18} />
                    <span style={{ fontSize: '0.9rem' }}>{profile?.full_name || user?.email?.split('@')[0]}</span>
                    <button onClick={(e) => { e.preventDefault(); signOut(); }} className="auth-switch" style={{ marginLeft: '1rem' }}>
                        <LogOut size={16} />
                    </button>
                </Link>
            </nav>

            {/* Page Header */}
            <div className="wishlist-header">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="wishlist-header-content"
                >
                    <div className="wishlist-title-row">
                        <div className="wishlist-title-icon">
                            <Heart size={28} fill="#ef4444" color="#ef4444" />
                        </div>
                        <div>
                            <h1 className="wishlist-title">Danh sách yêu thích</h1>
                            <p className="wishlist-subtitle">
                                {products.length > 0
                                    ? `${products.length} sản phẩm bạn đã yêu thích`
                                    : 'Những sản phẩm bạn đã đánh dấu yêu thích'}
                            </p>
                        </div>
                    </div>
                    {products.length > 0 && (
                        <Link to="/shop" className="wishlist-shop-btn">
                            <ShoppingCart size={18} />
                            Tiếp tục mua sắm
                        </Link>
                    )}
                </motion.div>
            </div>

            {/* Content */}
            <div className="wishlist-content">
                {loading ? (
                    <div className="wishlist-loading">
                        <div className="loading-spinner" />
                        <p>Đang tải danh sách yêu thích...</p>
                    </div>
                ) : products.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="wishlist-empty"
                    >
                        <div className="wishlist-empty-icon">
                            <Heart size={64} strokeWidth={1.2} />
                        </div>
                        <h2>Chưa có sản phẩm yêu thích</h2>
                        <p>Bấm vào biểu tượng ❤️ trên sản phẩm để lưu vào danh sách này</p>
                        <Link to="/shop" className="btn-primary" style={{ textDecoration: 'none', marginTop: '1rem' }}>
                            Khám phá sản phẩm ngay
                        </Link>
                    </motion.div>
                ) : (
                    <div className="wishlist-grid">
                        <AnimatePresence>
                            {products.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85 }}
                                    transition={{ delay: Math.min(i * 0.06, 0.4) }}
                                    className="wishlist-card"
                                    layout
                                >
                                    {/* Ảnh sản phẩm */}
                                    <div
                                        className="wishlist-card-image"
                                        onClick={() => navigate(`/product/${product.id}`)}
                                    >
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} loading="lazy" />
                                        ) : (
                                            <div className="wishlist-card-placeholder">
                                                <Package size={44} strokeWidth={1} />
                                            </div>
                                        )}
                                        {product.status === 'sold' && (
                                            <div className="wishlist-sold-overlay">
                                                <span>Đã bán</span>
                                            </div>
                                        )}
                                        {product.condition && (
                                            <span className={`wishlist-condition-badge ${product.condition}`}>
                                                {CONDITIONS_MAP[product.condition] || product.condition}
                                            </span>
                                        )}
                                    </div>

                                    {/* Thông tin */}
                                    <div className="wishlist-card-body">
                                        <div className="wishlist-card-meta">
                                            {product.category && (
                                                <span className="wishlist-category-tag">{product.category}</span>
                                            )}
                                            <span className="wishlist-card-time">
                                                <Clock size={12} />
                                                {formatTimeAgo(product.created_at)}
                                            </span>
                                        </div>

                                        <h3
                                            className="wishlist-card-title"
                                            onClick={() => navigate(`/product/${product.id}`)}
                                        >
                                            {product.name}
                                        </h3>

                                        {product.location && (
                                            <div className="wishlist-card-location">
                                                <MapPin size={13} />
                                                <span>{product.location}</span>
                                            </div>
                                        )}

                                        <div className="wishlist-card-price">
                                            {formatPrice(product.price)}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="wishlist-card-actions">
                                            <button
                                                className="wishlist-btn-view"
                                                onClick={() => navigate(`/product/${product.id}`)}
                                            >
                                                Xem sản phẩm
                                            </button>
                                            <motion.button
                                                className="wishlist-btn-remove"
                                                onClick={() => handleRemove(product.id)}
                                                disabled={removingId === product.id}
                                                whileTap={{ scale: 0.9 }}
                                                title="Xóa khỏi yêu thích"
                                            >
                                                {removingId === product.id ? (
                                                    <div className="loading-spinner-sm" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer style={{ marginTop: '6rem', paddingBottom: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <p>© 2024 StudentHub. Tất cả quyền được bảo lưu.</p>
            </footer>
        </div>
    );
};

export default Wishlist;
