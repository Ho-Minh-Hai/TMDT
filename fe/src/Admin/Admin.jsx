// src/pages/Admin.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, AlertCircle, List, MessageSquare, ShieldAlert, ShoppingBag,
    Settings, HelpCircle, Flag, Clock, Ban, ShieldCheck, Download
} from 'lucide-react';
import './Admin.css';

// Import các sub-components
import AdminProduct from './AdminProduct';
import AdminUser from './AdminUser';
import AdminBannedKeywords from './AdminBannedKeywords';
import AdminOrder from './AdminOrder';
import AdminDashboard from './AdminDashboard';
import AdminReports from './AdminReports';

const Admin = () => {
    const { profile } = useAuth();
    // Quản lý tab đang hiển thị
    const [activeTab, setActiveTab] = useState('reports');

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>Member Portal</h2>
                    <p>University Campus Admin</p>
                </div>

                <nav className="sidebar-menu">
                    <p className="menu-label">MAIN MENU</p>
                    <a href="#dashboard"
                        className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
                        <LayoutDashboard size={20} /> Dashboard
                    </a>

                    <a href="#users"
                        className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}>
                        <Users size={20} /> Quản lý người dùng
                    </a>

                    <a href="#reports"
                        className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}>
                        <AlertCircle size={20} /> Báo cáo vi phạm
                    </a>

                    <a href="#products"
                        className={`menu-item ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveTab('products'); }}>
                        <List size={20} /> Danh sách sản phẩm
                    </a>

                    <a href="#banned-keywords"
                        className={`menu-item ${activeTab === 'banned-keywords' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveTab('banned-keywords'); }}>
                        <ShieldAlert size={20} /> Kiểm duyệt bình luận
                    </a>

                </nav>

                <div className="sidebar-footer">
                    <div className="admin-profile-snippet">
                        <div className="admin-info">
                            <h4>{profile?.full_name || 'Admin User'}</h4>
                            <span>Role: {profile?.role }</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="admin-main">
                {/* 1. Tab Sản phẩm */}
                {activeTab === 'products' && <AdminProduct />}

                {/* 2. Tab Người dùng */}
                {activeTab === 'users' && <AdminUser />}

                {/* 3. Tab Kiểm duyệt bình luận */}
                {activeTab === 'banned-keywords' && <AdminBannedKeywords />}


                {/* 4. Tab Dashboard */}
                {activeTab === 'dashboard' && <AdminDashboard />}

                {/* 5. Tab Báo cáo vi phạm */}
                {activeTab === 'reports' && <AdminReports />}
            </main>
        </div>
    );
};

export default Admin;