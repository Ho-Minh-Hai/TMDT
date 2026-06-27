import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
import { ShoppingBag, Star, TrendingUp, ShieldCheck, LogOut, Search, User, ArrowRight, MessageSquare, Package, ChevronRight, Sparkles } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Home = () => {
    const { user, profile, userRole, signOut } = useAuth();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [products, setProducts] = useState([]);
    const [sellerProfiles, setSellerProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [boostedIds, setBoostedIds] = useState([]);

    const categories = [
        { id: 'all', name: 'Tất cả', icon: '📦' },
        { id: 'Điện tử', name: 'Điện tử & Máy tính', icon: '💻' },
        { id: 'Quần áo', name: 'Thời trang', icon: '👕' },
        { id: 'Đồ gia dụng', name: 'Nhà & Ngoài trời', icon: '🏠' },
        { id: 'Thể thao', name: 'Thể thao & Ngoài trời', icon: '⚽' },
    ];

    // Fetch products from Supabase based on category
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const storedBoosted = JSON.parse(localStorage.getItem('boosted_products') || '[]');
                setBoostedIds(storedBoosted);

                // Start building the query
                let query = supabase
                    .from('products')
                    .select('*')
                    .eq('status', 'available');

                // Add category filter if not 'all'
                if (selectedCategory !== 'all') {
                    query = query.eq('category', selectedCategory);
                }

                // Add ordering and limit
                query = query.order('created_at', { ascending: false }).limit(6);

                // Execute the query
                const { data, error } = await query;

                if (error) throw error;

                // Sort so boosted items come first
                const sorted = (data || []).sort((a, b) => {
                    const aBoosted = storedBoosted.includes(a.id);
                    const bBoosted = storedBoosted.includes(b.id);
                    if (aBoosted && !bBoosted) return -1;
                    if (!aBoosted && bBoosted) return 1;
                    return 0;
                });

                setProducts(sorted);

                // Fetch seller profiles for all unique seller IDs
                const sellerIds = [...new Set((data || []).map(p => p.seller_id).filter(Boolean))];
                if (sellerIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .in('id', sellerIds);

                    const profileMap = {};
                    (profiles || []).forEach(p => { profileMap[p.id] = p; });
                    setSellerProfiles(profileMap);
                } else {
                    setSellerProfiles({});
                }
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategory]);

    return (
        <div className="home-container">
            <div className="bg-mesh"></div>

            <nav className="navbar">
                <button 
                    className="logo" 
                    style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => navigate('/home')}
                >
                    <div className="logo-icon">
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <span>Student<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                </button>

                <div className="nav-links">
                    <Link to="/shop" className="nav-link">Bộ sưu tập</Link>
                    <Link to="/shop?filter=deals" className="nav-link">Ưu đãi</Link>
                    <Link to="/shop?filter=trending" className="nav-link">Xu hướng</Link>
                    <Link to="/chat" className="nav-icon-link" title="Tin nhắn">
                        <MessageSquare size={20} />
                    </Link>
                    <Link to="/seller" className="nav-icon-link" title="Quản lý shop">
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

            <div className="home-main">
                {/* Sidebar */}
                <aside className="home-sidebar">
                    <div className="sidebar-section">
                        <h3 className="sidebar-title">QUẢN LÝ TÀI KHOẢN</h3>
                        <ul className="sidebar-menu">
                            <li><Link to="/profile" className="sidebar-item">👤 Hồ sơ cá nhân</Link></li>
                            <li><Link to="/wishlist" className="sidebar-item">📌 Danh sách yêu thích</Link></li>
                            <li><Link to="/purchase-history" className="sidebar-item">⏱️ Lịch sử mua hàng</Link></li>
                            <li><Link to="/vip-member" className="sidebar-item">👑 Vip member</Link></li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h3 className="sidebar-title">DANH MỤC</h3>
                        <ul className="sidebar-menu">
                            {categories.map(cat => (
                                <li key={cat.id}>
                                    <button
                                        className={`sidebar-item ${selectedCategory === cat.id ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        {cat.icon} {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                </aside>

                {/* Main Content */}
                <main className="home-content">
                    <header className="hero">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                            className="hero-inner"
                        >
                            <h1 className="hero-title">
                                Nâng cấp đời sinh <br />
                                viên cùng <span className="hero-gradient">UnixShop</span>
                            </h1>
                            <p className="hero-desc">
                                Khám phá những sản phẩm chất lượng cao từ các nhà bán hàng uy tín
                            </p>
                            <div className="hero-buttons">
                                <Link to="/shop" className="btn-primary" style={{ textDecoration: 'none' }}>Bắt đầu mua sắm</Link>
                                <Link to="/shop" className="btn-secondary" style={{ textDecoration: 'none' }}>Xem danh mục</Link>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="hero-image"
                        >
                            <div className="hero-placeholder" style={{
                                backgroundImage: 'url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=500&q=80)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}></div>
                        </motion.div>
                    </header>

                    <section className="products-section">
                        <div className="section-header">
                            <h2>Sản phẩm mới nhất</h2>
                            <Link to="/shop" className="view-all">Xem tất cả <ChevronRight size={16} /></Link>
                        </div>

                        <div className="products-grid">
                            {products.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="product-card-new"
                                    style={{
                                        backgroundImage: `url(${product.image_url || product.image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                >
                                    <div className="product-overlay"></div>
                                    {boostedIds.includes(product.id) && (
                                        <span className="sponsored-badge-home">
                                            <Sparkles size={12} />
                                            <span>Được tài trợ</span>
                                        </span>
                                    )}
                                    <div className="product-content">
                                        <h3 className="product-title">{product.name}</h3>
                                        <p className="product-seller">
                                            Bởi {sellerProfiles[product.seller_id]?.full_name || 'Người bán'}
                                        </p>
                                        <div className="product-footer">
                                            <div className="product-rating">
                                                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                                <span>{product.rating || 4.8}</span>
                                            </div>
                                            <div className="product-price-new">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="view-more-container">
                            <Link to="/shop" className="btn-view-more" style={{ textDecoration: 'none' }}>Xem thêm sản phẩm</Link>
                        </div>
                    </section>
                </main>
            </div>

            <footer style={{ marginTop: '6rem', paddingBottom: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <p>&copy; 2024 StudentHub. Tất cả quyền được bảo lưu.</p>
            </footer>
        </div>
    );
};

export default Home;