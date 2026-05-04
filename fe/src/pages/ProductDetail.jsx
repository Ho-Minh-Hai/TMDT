import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import {
    ShoppingBag, ArrowLeft, MapPin, Clock, User, LogOut,
    MessageSquare, Package, ChevronRight, Heart, Share2,
    Shield, Star, Tag, Truck, AlertCircle, CheckCircle,
    Copy, ExternalLink
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import './ProductDetail.css';

const CONDITIONS_MAP = {
    'new': { label: 'Mới 100%', color: '#22c55e' },
    'like_new': { label: 'Như mới (99%)', color: '#6366f1' },
    'good': { label: 'Tốt', color: '#f59e0b' },
    'fair': { label: 'Trung bình', color: '#6b7280' },
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();

    const [product, setProduct] = useState(null);
    const [seller, setSeller] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (id) fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProduct(data);

            // Fetch seller profile
            if (data.seller_id) {
                const { data: sellerData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, created_at')
                    .eq('id', data.seller_id)
                    .single();
                setSeller(sellerData);
            }

            // Fetch related products (same category, exclude current)
            if (data.category) {
                const { data: related } = await supabase
                    .from('products')
                    .select('*')
                    .eq('category', data.category)
                    .eq('status', 'available')
                    .neq('id', id)
                    .limit(4)
                    .order('created_at', { ascending: false });
                setRelatedProducts(related || []);
            }
        } catch (err) {
            console.error('Error fetching product:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long'
        });
    };

    const handleChatWithSeller = async () => {
        if (!user || !seller) return;
        if (seller.id === user.id) return; // Can't chat with yourself

        try {
            const API_BASE_URL = 'http://localhost:8080/api/chat';
            const response = await fetch(`${API_BASE_URL}/conversations/get-or-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user1_id: user.id, user2_id: seller.id })
            });

            if (response.ok) {
                navigate('/chat');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Build images array (main image + potential extras)
    const images = product?.image_url ? [product.image_url] : [];

    if (loading) {
        return (
            <div className="detail-page">
                <div className="bg-mesh"></div>
                <div className="detail-loading">
                    <div className="loading-spinner" />
                    <p>Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="detail-page">
                <div className="bg-mesh"></div>
                <div className="detail-not-found">
                    <AlertCircle size={56} strokeWidth={1.2} />
                    <h2>Không tìm thấy sản phẩm</h2>
                    <p>Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng.</p>
                    <Link to="/shop" className="btn-primary">Quay lại cửa hàng</Link>
                </div>
            </div>
        );
    }

    const conditionInfo = CONDITIONS_MAP[product.condition] || { label: product.condition, color: '#6b7280' };

    return (
        <div className="detail-page">
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
                    <Link to="/shop" className="nav-link" style={{ color: 'var(--primary)', fontWeight: '600' }}>Bộ sưu tập</Link>
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

            {/* Breadcrumb */}
            <div className="detail-breadcrumb">
                <Link to="/home">Trang chủ</Link>
                <ChevronRight size={14} />
                <Link to="/shop">Bộ sưu tập</Link>
                <ChevronRight size={14} />
                {product.category && (
                    <>
                        <Link to={`/shop?category=${product.category}`}>{product.category}</Link>
                        <ChevronRight size={14} />
                    </>
                )}
                <span className="breadcrumb-current">{product.name}</span>
            </div>

            {/* Main Content */}
            <div className="detail-content">
                {/* Left: Image Gallery */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="detail-gallery"
                >
                    <div className="gallery-main">
                        {images.length > 0 ? (
                            <img
                                src={images[selectedImageIndex]}
                                alt={product.name}
                                className="gallery-main-image"
                            />
                        ) : (
                            <div className="gallery-placeholder">
                                <Package size={80} strokeWidth={1} />
                                <span>Chưa có hình ảnh</span>
                            </div>
                        )}
                        <button
                            className={`fav-btn ${isFavorited ? 'active' : ''}`}
                            onClick={() => setIsFavorited(!isFavorited)}
                            title="Yêu thích"
                        >
                            <Heart size={22} fill={isFavorited ? '#ef4444' : 'none'} />
                        </button>
                    </div>

                    {images.length > 1 && (
                        <div className="gallery-thumbs">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`thumb ${selectedImageIndex === i ? 'active' : ''}`}
                                    onClick={() => setSelectedImageIndex(i)}
                                >
                                    <img src={img} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Right: Product Info */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="detail-info"
                >
                    {/* Status Badge */}
                    <div className="detail-status-row">
                        <span className="detail-status-badge available">
                            <CheckCircle size={14} />
                            Đang bán
                        </span>
                        <span className="detail-posted">
                            <Clock size={14} />
                            Đăng {formatTimeAgo(product.created_at)}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="detail-title">{product.name}</h1>

                    {/* Location */}
                    {product.location && (
                        <div className="detail-location">
                            <MapPin size={16} />
                            <span>{product.location}</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="detail-price-block">
                        <span className="detail-price">{formatPrice(product.price)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="detail-actions">
                        <button className="btn-chat-seller" onClick={handleChatWithSeller}>
                            <MessageSquare size={20} />
                            Chat với người dùng
                        </button>
                        <button className="btn-offer" onClick={handleCopyLink}>
                            {copied ? (
                                <>
                                    <CheckCircle size={18} />
                                    Đã sao chép!
                                </>
                            ) : (
                                <>
                                    <Share2 size={18} />
                                    Chia sẻ
                                </>
                            )}
                        </button>
                    </div>

                    {/* Seller Card */}
                    {seller && (
                        <div className="detail-seller-card">
                            <div className="seller-card-header">
                                <h3>Thông tin người bán</h3>
                            </div>
                            <div className="seller-card-body">
                                <div className="seller-card-avatar">
                                    {seller.avatar_url ? (
                                        <img src={seller.avatar_url} alt="" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="seller-card-info">
                                    <span className="seller-card-name">{seller.full_name || 'Người bán'}</span>
                                    <span className="seller-card-since">
                                        Tham gia từ {formatDate(seller.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Details Grid */}
                    <div className="detail-specs">
                        <h3 className="specs-title">Chi tiết sản phẩm</h3>
                        <div className="specs-grid">
                            {product.condition && (
                                <div className="spec-item">
                                    <span className="spec-label">Tình trạng</span>
                                    <span className="spec-value" style={{ color: conditionInfo.color, fontWeight: 600 }}>
                                        {conditionInfo.label}
                                    </span>
                                </div>
                            )}
                            {product.category && (
                                <div className="spec-item">
                                    <span className="spec-label">Danh mục</span>
                                    <span className="spec-value">
                                        <Tag size={14} /> {product.category}
                                    </span>
                                </div>
                            )}
                            {product.quantity > 0 && (
                                <div className="spec-item">
                                    <span className="spec-label">Số lượng</span>
                                    <span className="spec-value">{product.quantity} sản phẩm</span>
                                </div>
                            )}
                            {product.location && (
                                <div className="spec-item">
                                    <span className="spec-label">Vị trí</span>
                                    <span className="spec-value">
                                        <MapPin size={14} /> {product.location}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="detail-description">
                            <h3 className="desc-title">Mô tả sản phẩm</h3>
                            <div className="desc-content">
                                {product.description.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Safety Tips */}
                    <div className="detail-safety">
                        <Shield size={18} />
                        <div>
                            <strong>Mẹo an toàn:</strong>
                            <span> Hẹn gặp ở nơi công cộng, kiểm tra hàng trước khi thanh toán.</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="detail-related">
                    <div className="related-header">
                        <h2>Sản phẩm liên quan</h2>
                        <Link to="/shop" className="view-all">
                            Xem tất cả <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="related-grid">
                        {relatedProducts.map((rp, i) => (
                            <motion.div
                                key={rp.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    to={`/product/${rp.id}`}
                                    className="related-card"
                                >
                                    <div className="related-card-image">
                                        {rp.image_url ? (
                                            <img src={rp.image_url} alt={rp.name} loading="lazy" />
                                        ) : (
                                            <div className="related-card-placeholder">
                                                <Package size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="related-card-body">
                                        <h4 className="related-card-title">{rp.name}</h4>
                                        <span className="related-card-price">{formatPrice(rp.price)}</span>
                                        {rp.location && (
                                            <span className="related-card-location">
                                                <MapPin size={12} /> {rp.location}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="shop-footer">
                <div className="shop-footer-content">
                    <div className="footer-brand">
                        <div className="logo" style={{ marginBottom: '0.75rem' }}>
                            <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
                                <ShoppingBag size={18} color="white" />
                            </div>
                            <span style={{ fontSize: '1.1rem' }}>Student<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                        </div>
                        <p>Nền tảng trao đổi và mua bán vật dụng dành cho cộng đồng sinh viên Việt Nam.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-col">
                            <h4>Khám phá</h4>
                            <a href="#">Về StudentHub</a>
                            <a href="#">Mẹo an toàn</a>
                            <a href="#">Quy định cộng đồng</a>
                        </div>
                        <div className="footer-col">
                            <h4>Hỗ trợ</h4>
                            <a href="#">Trung tâm giúp đỡ</a>
                            <a href="#">Báo cáo vi phạm</a>
                            <a href="#">Điều khoản dịch vụ</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 StudentHub Marketplace. Built for the University Community.</p>
                </div>
            </footer>
        </div>
    );
};

export default ProductDetail;
