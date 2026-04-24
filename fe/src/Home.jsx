import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ShoppingBag, Star, TrendingUp, ShieldCheck, LogOut, Search, User, ArrowRight } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Home = () => {
    const { user, profile, userRole, signOut } = useAuth();

    const products = [
        { id: 1, name: 'Premium Cloud Watch', price: '$299', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', rating: 4.8 },
        { id: 2, name: 'Sleek Noise Headphones', price: '$199', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80', rating: 4.9 },
        { id: 3, name: 'Minimalist Camera', price: '$899', image: 'https://images.unsplash.com/photo-1526170315876-db60ba51947a?auto=format&fit=crop&w=400&q=80', rating: 4.7 },
        { id: 4, name: 'Smart Home Speaker', price: '$149', image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=400&q=80', rating: 4.6 },
    ];

    return (
        <div className="home-container">
            <div className="bg-mesh"></div>
            
            <nav className="navbar">
                <div className="logo">
                    <div className="logo-icon">
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <span>N5<span style={{ color: 'var(--primary)' }}>STORE</span></span>
                </div>

                <div className="nav-links">
                    <a href="#" className="nav-link">Bộ sưu tập</a>
                    <a href="#" className="nav-link">Ưu đãi</a>
                    <a href="#" className="nav-link">Xu hướng</a>
                    {userRole === 'seller' && (
                        <Link to="/seller" className="nav-link" style={{ color: 'var(--primary)', fontWeight: '600' }}>Quản lý bán hàng</Link>
                    )}
                </div>

                <Link to="/profile" className="user-tag" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <User size={18} />
                    <span style={{ fontSize: '0.9rem' }}>{profile?.full_name || user?.email?.split('@')[0]}</span>
                    <button onClick={(e) => { e.preventDefault(); signOut(); }} className="auth-switch" style={{ marginLeft: '1rem' }}>
                        <LogOut size={16} />
                    </button>
                </Link>
            </nav>

            <header className="hero">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <span className="badge">BST Xuân 2024</span>
                    <h1 className="hero-title">
                        Nâng tầm <span className="hero-gradient">phong cách sống</span> <br /> 
                        kỹ thuật số của bạn
                    </h1>
                    <p className="hero-desc">
                        Tuyển tập những thiết bị công nghệ đỉnh cao được thiết kế để hoàn thiện không gian sống và phong thái của bạn.
                    </p>
                    <div className="flex-center" style={{ gap: '1.5rem' }}>
                        <button className="btn-auth" style={{ padding: '1.25rem 2.5rem' }}>Bắt đầu mua sắm</button>
                        <button className="auth-switch" style={{ padding: '1.25rem 2.5rem', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>Xem danh mục</button>
                    </div>
                </motion.div>
            </header>

            <section className="grid-products">
                {products.map((product, i) => (
                    <motion.div 
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="product-card"
                    >
                        <div className="product-img-wrapper">
                            <img src={product.image} alt={product.name} className="product-img" />
                        </div>
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-price">{product.price}</p>
                        <div className="flex-center" style={{ justifyContent: 'space-between', marginTop: '1.5rem' }}>
                            <div className="flex-center" style={{ gap: '0.4rem', color: '#fbbf24' }}>
                                <Star size={14} fill="#fbbf24" />
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>{product.rating}</span>
                            </div>
                            <button className="btn-auth" style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', marginTop: 0 }}>
                                <ShoppingBag size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </section>

            <footer style={{ marginTop: '6rem', paddingBottom: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <p>&copy; 2024 LUXESTORE. Thiết kế bởi Supabase & React CSS.</p>
            </footer>
        </div>
    );
};

export default Home;
