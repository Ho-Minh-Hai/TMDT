import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <ShoppingBag size={22} color="white" />
                        </div>
                        <span className="sidebar-logo-text">
                            Student<span className="sidebar-logo-accent">Market</span>
                        </span>
                    </div>
                    <button
                        className="sidebar-close-btn"
                        onClick={() => setSidebarOpen(false)}
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
                <header className="main-header">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="header-right">
                        <Link to="/profile" className="header-user-tag" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <User size={16} />
                            <span>{profile?.full_name || user?.email?.split('@')[0]}</span>
                        </Link>
                    </div>
                </header>
                <div className="main-body">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SellerLayout;
