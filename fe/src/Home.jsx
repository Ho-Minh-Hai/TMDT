import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ShoppingBag, Star, TrendingUp, ShieldCheck, LogOut, Search, User, ArrowRight, MessageSquare, Package, ChevronRight } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Home = () => {
    const { user, profile, userRole, signOut } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'Tất cả', icon: '📦' },
        { id: 'electronics', name: 'Điện tử & Máy tính', icon: '💻' },
        { id: 'fashion', name: 'Thời trang', icon: '👕' },
        { id: 'home', name: 'Nhà & Ngoài trời', icon: '🏠' },
        { id: 'sports', name: 'Thể thao & Ngoài trời', icon: '⚽' },
    ];

    const products = [
        { id: 1, name: 'Máy Đọc Sách Kỹ Thuật Số', price: '$299', seller: 'Hải bán rẻ', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=800&q=80', rating: 4.8 },
        { id: 2, name: 'Sách Kỹ Năng Tiếp Cận', price: '$199', seller: 'Hải bán cái khác', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=500&q=80', rating: 4.9 },
        { id: 3, name: 'Xe Đạp Công Nghệ Cao', price: '$899', seller: 'Hải bán mắc', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80', rating: 4.7 },
        { id: 4, name: 'Loa Thông Minh', price: '$149', seller: 'Hải bán hàng giả', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=500&q=80', rating: 4.6 },
        { id: 5, name: 'Bàn Phím Cơ Cao Cấp', price: '$249', seller: 'Hải bán ế', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', rating: 4.8 },
        { id: 6, name: 'Màn Hình 4K', price: '$599', seller: 'Hải không bán', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500&q=80', rating: 4.9 },
    ];

    return (
        <div className="home-container">
            <div className="bg-mesh"></div>

            <nav className="navbar">
                <div className="logo">
                    <div className="logo-icon">
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <span>Student<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                </div>

                <div className="nav-links">
                    <a href="#" className="nav-link">Bộ sưu tập</a>
                    <a href="#" className="nav-link">Ưu đãi</a>
                    <a href="#" className="nav-link">Xu hướng</a>
                    <Link to="/chat" className="nav-icon-link" title="Tin nhắn">
                        <MessageSquare size={20} />
                    </Link>
                    <Link to="/seller" className="nav-icon-link" title="Shop">
                        <Package size={20} />
                    </Link>
                    <Link to="/seller" className="nav-link" style={{ color: 'var(--primary)', fontWeight: '600' }}>Đăng bán</Link>
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
                            <li><a href="#" className="sidebar-item">📋 Danh sách yêu thích</a></li>
                            <li><a href="#" className="sidebar-item">⏱️ Lịch sử mua hàng</a></li>
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

                    <div className="sidebar-section">
                        <h3 className="sidebar-title">LỌC GIÁ</h3>
                        <div className="price-range">
                            <input type="range" min="0" max="1000" className="price-slider" />
                            <div className="price-inputs">
                                <input type="number" placeholder="Min" className="price-input" />
                                <span>-</span>
                                <input type="number" placeholder="Max" className="price-input" />
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3 className="sidebar-title">TÌM KIẾM</h3>
                        <div className="search-box">
                            <Search size={18} />
                            <input type="text" placeholder="Tìm sản phẩm..." className="search-input" />
                        </div>
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
                                <button className="btn-primary">Bắt đầu mua sắm</button>
                                <button className="btn-secondary">Xem danh mục</button>
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
                            <a href="#" className="view-all">Xem tất cả <ChevronRight size={16} /></a>
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
                                        backgroundImage: `url(${product.image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    <div className="product-overlay"></div>
                                    <div className="product-content">
                                        <h3 className="product-title">{product.name}</h3>
                                        <p className="product-seller">Bởi {product.seller}</p>
                                        <div className="product-footer">
                                            <div className="product-rating">
                                                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                                <span>{product.rating}</span>
                                            </div>
                                            <div className="product-price-new">{product.price}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="view-more-container">
                            <button className="btn-view-more">Xem thêm sản phẩm</button>
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
