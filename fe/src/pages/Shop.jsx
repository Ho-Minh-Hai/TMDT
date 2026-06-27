import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserSearchBar from '../components/UserSearchBar';
import { supabase } from '../supabaseClient';
import {
    ShoppingBag, Search, Heart, Filter, Grid, List,
    X, MapPin, Clock, User, LogOut,
    MessageSquare, Package, SlidersHorizontal,
    Tag, Zap, ArrowUpDown, Eye, BookOpen, Sparkles
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../hooks/useWishlist';
import './Shop.css';

const CATEGORIES = [
    { id: 'all', name: 'Tất cả', icon: Grid },
    { id: 'Điện tử', name: 'Điện tử & Laptop', icon: Zap },
    { id: 'Sách vở', name: 'Sách & Giáo trình', icon: Tag },
    { id: 'Quần áo', name: 'Thời trang', icon: Tag },
    { id: 'Đồ gia dụng', name: 'Đồ gia dụng', icon: Tag },
    { id: 'Thể thao', name: 'Thể thao', icon: Tag },
    { id: 'Xe cộ', name: 'Xe & Phụ kiện', icon: Tag },
    { id: 'Khác', name: 'Khác', icon: Tag },
];

const CONDITIONS_MAP = {
    'new': 'Mới 100%',
    'like_new': 'Như mới (99%)',
    'good': 'Tốt',
    'fair': 'Trung bình',
};

const SORT_OPTIONS = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá thấp → cao' },
    { value: 'price_desc', label: 'Giá cao → thấp' },
    { value: 'name_asc', label: 'Tên A → Z' },
];

const Shop = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const { isWishlisted, toggleWishlist, wishlistCount } = useWishlist();

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [boostedIds, setBoostedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedCondition, setSelectedCondition] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedSchool, setSelectedSchool] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [sellerProfiles, setSellerProfiles] = useState({});
    const [hoveredProduct, setHoveredProduct] = useState(null);
    const [wishlistToast, setWishlistToast] = useState(null);

    const handleToggleWishlist = async (e, productId) => {
        e.stopPropagation();
        if (!user) {
            setWishlistToast({ msg: 'Vui lòng đăng nhập để yêu thích!', type: 'error' });
            setTimeout(() => setWishlistToast(null), 2500);
            return;
        }
        const result = await toggleWishlist(productId);
        if (result.success) {
            setWishlistToast({
                msg: result.added ? '❤️ Đã thêm vào yêu thích!' : '💔 Đã xóa khỏi yêu thích!',
                type: result.added ? 'success' : 'info'
            });
            setTimeout(() => setWishlistToast(null), 2000);
        }
    };

    // Fetch all available products from Supabase directly
    useEffect(() => {
        fetchProducts();
        const stored = localStorage.getItem('boosted_products');
        if (stored) {
            try {
                setBoostedIds(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setProducts(data || []);

            // Fetch seller profiles for all unique seller IDs
            const sellerIds = [...new Set((data || []).map(p => p.seller_id).filter(Boolean))];
            if (sellerIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, school')
                    .in('id', sellerIds);

                const profileMap = {};
                (profiles || []).forEach(p => { profileMap[p.id] = p; });
                setSellerProfiles(profileMap);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters, search, and sort
    useEffect(() => {
        let result = [...products];

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term) ||
                p.category?.toLowerCase().includes(term) ||
                p.location?.toLowerCase().includes(term)
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            result = result.filter(p => p.category === selectedCategory);
        }

        // Condition filter
        if (selectedCondition !== 'all') {
            result = result.filter(p => p.condition === selectedCondition);
        }

        // Location filter
        if (selectedLocation !== 'all') {
            result = result.filter(p => p.location === selectedLocation);
        }

        // School filter (filter by seller's school)
        if (selectedSchool !== 'all') {
            result = result.filter(p => {
                const seller = sellerProfiles[p.seller_id];
                return seller && seller.school === selectedSchool;
            });
        }

        // Price range filter
        if (priceRange.min) {
            result = result.filter(p => p.price >= parseFloat(priceRange.min));
        }
        if (priceRange.max) {
            result = result.filter(p => p.price <= parseFloat(priceRange.max));
        }

        // Sort
        switch (sortBy) {
            case 'price_asc':
                result.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price_desc':
                result.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'name_asc':
                result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'newest':
            default:
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }

        // Boosted/Sponsored listings prioritization to the top
        const boostedIds = JSON.parse(localStorage.getItem('boosted_products') || '[]');
        result.sort((a, b) => {
            const aBoosted = boostedIds.includes(a.id);
            const bBoosted = boostedIds.includes(b.id);
            if (aBoosted && !bBoosted) return -1;
            if (!aBoosted && bBoosted) return 1;
            return 0;
        });

        setFilteredProducts(result);
    }, [products, searchTerm, selectedCategory, selectedCondition, selectedLocation, selectedSchool, sortBy, priceRange, sellerProfiles]);

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

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('all');
        setSelectedCondition('all');
        setSelectedLocation('all');
        setSelectedSchool('all');
        setSortBy('newest');
        setPriceRange({ min: '', max: '' });
    };

    const hasActiveFilters = selectedCategory !== 'all' || selectedCondition !== 'all' || selectedLocation !== 'all' || selectedSchool !== 'all' || priceRange.min || priceRange.max;

    return (
        <div className="shop-page">
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

            <div className="shop-layout">
                {/* Sidebar Filters */}
                <aside className={`shop-sidebar ${showFilters ? 'show' : ''}`}>
                    <div className="shop-sidebar-header">
                        <h3><SlidersHorizontal size={18} /> Bộ lọc</h3>
                        {hasActiveFilters && (
                            <button className="clear-filters-btn" onClick={clearFilters}>
                                Xóa tất cả
                            </button>
                        )}
                        <button className="close-filter-btn" onClick={() => setShowFilters(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Categories */}
                    <div className="filter-section">
                        <h4 className="filter-title">Danh mục</h4>
                        <div className="filter-options">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.id)}
                                >
                                    <span>{cat.name}</span>
                                    {selectedCategory === cat.id && (
                                        <span className="chip-count">
                                            {cat.id === 'all'
                                                ? products.length
                                                : products.filter(p => p.category === cat.id).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* Condition */}
                    <div className="filter-section">
                        <h4 className="filter-title">Tình trạng</h4>
                        <div className="filter-options">
                            <button
                                className={`filter-chip ${selectedCondition === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedCondition('all')}
                            >
                                Tất cả
                            </button>
                            {Object.entries(CONDITIONS_MAP).map(([key, label]) => (
                                <button
                                    key={key}
                                    className={`filter-chip ${selectedCondition === key ? 'active' : ''}`}
                                    onClick={() => setSelectedCondition(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="filter-section">
                        <h4 className="filter-title">Khu vực</h4>
                        <select 
                            value={selectedLocation}
                            onChange={e => setSelectedLocation(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-glass)',
                                fontSize: '0.9rem',
                                background: 'rgba(255, 255, 255, 0.7)',
                                color: '#111827',
                                cursor: 'pointer',
                                outline: 'none',
                                fontFamily: 'inherit'
                            }}
                        >
                            <option value="all">Tất cả khu vực</option>
                            {['all', ...new Set(products.map(p => p.location).filter(Boolean))]
                                .filter(loc => loc !== 'all')
                                .sort()
                                .map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    {/* School */}
                    <div className="filter-section">
                        <h4 className="filter-title"> Trường đại học</h4>
                        <select 
                            value={selectedSchool}
                            onChange={e => setSelectedSchool(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-glass)',
                                fontSize: '0.9rem',
                                background: 'rgba(255, 255, 255, 0.7)',
                                color: '#111827',
                                cursor: 'pointer',
                                outline: 'none',
                                fontFamily: 'inherit'
                            }}
                        >
                            <option value="all">Tất cả trường</option>
                            {['all', ...new Set(Object.values(sellerProfiles).map(p => p.school).filter(Boolean))]
                                .filter(school => school !== 'all')
                                .sort()
                                .map(school => (
                                <option key={school} value={school}>{school}</option>
                            ))}
                        </select>
                    </div>
                </aside>

                {/* Overlay for mobile filters */}
                {showFilters && <div className="filter-overlay" onClick={() => setShowFilters(false)} />}

                {/* Main Content */}
                <main className="shop-main">
                    {/* Search & Controls Bar */}
                    <div className="shop-controls">
                        <div className="shop-search">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm, danh mục, người bán..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <div className="shop-actions">
                            <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
                                <Filter size={18} />
                                <span>Lọc</span>
                                {hasActiveFilters && <span className="filter-badge" />}
                            </button>

                            <div className="sort-dropdown">
                                <ArrowUpDown size={16} />
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="view-toggle">
                                <button
                                    className={viewMode === 'grid' ? 'active' : ''}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    className={viewMode === 'list' ? 'active' : ''}
                                    onClick={() => setViewMode('list')}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Info */}
                    <div className="results-info">
                        <p>
                            <span className="results-count">{filteredProducts.length}</span> sản phẩm
                            {selectedCategory !== 'all' && <span className="results-filter"> trong "{CATEGORIES.find(c => c.id === selectedCategory)?.name}"</span>}
                            {searchTerm && <span className="results-filter"> cho "{searchTerm}"</span>}
                        </p>
                        {hasActiveFilters && (
                            <button className="clear-all-btn" onClick={clearFilters}>
                                <X size={14} /> Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Product Grid */}
                    {loading ? (
                        <div className="shop-loading">
                            <div className="loading-spinner" />
                            <p>Đang tải sản phẩm...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="shop-empty">
                            <Search size={56} strokeWidth={1.2} />
                            <h3>Không tìm thấy sản phẩm</h3>
                            <p>Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm</p>
                            <button className="btn-primary" onClick={clearFilters}>Xóa bộ lọc</button>
                        </div>
                    ) : (
                        <div className={`shop-products ${viewMode}`}>
                            {filteredProducts.map((product, i) => {
                                const seller = sellerProfiles[product.seller_id];
                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.05, 0.5) }}
                                        className={`shop-card ${product.status === 'sold' ? 'sold' : ''}`}
                                        onClick={() => navigate(`/product/${product.id}`)}
                                        onMouseEnter={() => setHoveredProduct(product.id)}
                                        onMouseLeave={() => setHoveredProduct(null)}
                                    >
                                        <div className="shop-card-image">
                                            {boostedIds.includes(product.id) && (
                                                <span className="sponsored-badge-shop">
                                                    <Sparkles size={11} />
                                                    <span>Được tài trợ</span>
                                                </span>
                                            )}
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} loading="lazy" />
                                            ) : (
                                                <div className="shop-card-placeholder">
                                                    <Package size={40} />
                                                </div>
                                            )}
                                            {/* Nút Yêu thích */}
                                            <motion.button
                                                className={`shop-card-heart-btn ${isWishlisted(product.id) ? 'active' : ''}`}
                                                onClick={(e) => handleToggleWishlist(e, product.id)}
                                                title={isWishlisted(product.id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                                whileTap={{ scale: 0.85 }}
                                                animate={isWishlisted(product.id) ? { scale: [1, 1.3, 1] } : {}}
                                            >
                                                <Heart
                                                    size={18}
                                                    fill={isWishlisted(product.id) ? '#ef4444' : 'none'}
                                                    color={isWishlisted(product.id) ? '#ef4444' : 'white'}
                                                />
                                            </motion.button>
                                            <div className="shop-card-badges">
                                                {product.status === 'sold' && (
                                                    <span className="sold-badge" style={{ 
                                                        background: '#ef4444', 
                                                        color: 'white', 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: '800',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                                                    }}>
                                                        Đã bán
                                                    </span>
                                                )}
                                                {product.condition && (
                                                    <span className={`condition-badge ${product.condition}`}>
                                                        {CONDITIONS_MAP[product.condition] || product.condition}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="shop-card-category">
                                                {product.category}
                                            </div>
                                            <AnimatePresence>
                                                {hoveredProduct === product.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="shop-card-hover-overlay"
                                                    >
                                                        <button className="quick-view-btn" title="Xem nhanh">
                                                            <Eye size={20} />
                                                            <span>Xem chi tiết</span>
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="shop-card-body">
                                            <div className="shop-card-meta">
                                                <span className="shop-card-time">
                                                    <Clock size={12} />
                                                    {formatTimeAgo(product.created_at)}
                                                </span>
                                                {product.location && (
                                                    <span className="shop-card-location">
                                                        <MapPin size={12} />
                                                        {product.location}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="shop-card-title">{product.name}</h3>

                                            {viewMode === 'list' && product.description && (
                                                <p className="shop-card-desc">{product.description}</p>
                                            )}

                                            <div className="shop-card-price">
                                                {formatPrice(product.price)}
                                            </div>

                                            <div className="shop-card-seller">
                                                <div className="seller-avatar">
                                                    {seller?.avatar_url ? (
                                                        <img src={seller.avatar_url} alt="" />
                                                    ) : (
                                                        <User size={14} />
                                                    )}
                                                </div>
                                                <span className="seller-name">
                                                    {seller?.full_name || 'Người bán'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Toast thông báo Wishlist */}
            <AnimatePresence>
                {wishlistToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 40, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: wishlistToast.type === 'error'
                                ? 'rgba(239, 68, 68, 0.92)'
                                : wishlistToast.type === 'success'
                                    ? 'rgba(34, 197, 94, 0.92)'
                                    : 'rgba(99, 102, 241, 0.92)',
                            backdropFilter: 'blur(12px)',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '50px',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            zIndex: 9999,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {wishlistToast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

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

export default Shop;
