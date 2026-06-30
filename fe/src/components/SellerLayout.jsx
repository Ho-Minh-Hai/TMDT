import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserSearchBar from './UserSearchBar';
import {
    LayoutDashboard,
    Package,
    PlusCircle,
    LogOut,
    Menu,
    X,
    ShoppingBag,
    User,
    ChevronRight
} from 'lucide-react';

const SellerLayout = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    const navItems = [
        { path: '/seller', icon: LayoutDashboard, label: 'Tổng quan', end: true },
        { path: '/seller/products', icon: Package, label: 'Sản phẩm', end: false },
        { path: '/seller/products/new', icon: PlusCircle, label: 'Thêm sản phẩm', end: false },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Global Navbar */}
            <nav className="navbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        className="mobile-menu-btn-navbar"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
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
                </div>

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
                    <button onClick={(e) => { e.preventDefault(); handleSignOut(); }} className="auth-switch" style={{ marginLeft: '1rem' }}>
                        <LogOut size={16} />
                    </button>
                </Link>
            </nav>

            <div className="seller-layout">
                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                    <div className="sidebar-header">
                        <button
                            className="sidebar-close-btn"
                            onClick={() => setSidebarOpen(false)}
                            style={{ marginLeft: 'auto' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        <div className="sidebar-nav-label">Menu chính</div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) =>
                                    `sidebar-nav-item ${isActive ? 'sidebar-nav-active' : ''}`
                                }
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                                <ChevronRight size={16} className="sidebar-nav-arrow" />
                            </NavLink>
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        <Link to="/profile" className="sidebar-user" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="sidebar-user-avatar">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={18} />
                                )}
                            </div>
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">
                                    {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                </span>
                                <span className="sidebar-user-role">
                                    {profile?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                                </span>
                            </div>
                        </Link>
                        <button className="sidebar-logout-btn" onClick={handleSignOut}>
                            <LogOut size={18} />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="main-content">
                    <div className="main-body">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SellerLayout;
