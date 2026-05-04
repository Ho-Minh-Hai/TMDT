// src/pages/Admin.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, Users, AlertCircle, List, MessageSquare, 
    Settings, HelpCircle, Flag, Clock, Ban, ShieldCheck, Download
} from 'lucide-react';
import './Admin.css';
import AdminProduct from './AdminProduct';

const Admin = () => {
    const { profile } = useAuth();
    // Thêm state để quản lý tab đang hiển thị (mặc định là báo cáo vi phạm)
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
                    
                    <a href="#messages" 
                       className={`menu-item ${activeTab === 'messages' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); setActiveTab('messages'); }}>
                        <MessageSquare size={20} /> Messages
                    </a>
                </nav>

                <div className="sidebar-footer">
                    <a href="#settings" className="menu-item"><Settings size={20} /> Admin Panel</a>
                    <a href="#help" className="menu-item"><HelpCircle size={20} /> Help Center</a>
                    
                    <div className="admin-profile-snippet">
                        <img src={profile?.avatar_url || 'https://via.placeholder.com/40'} alt="Admin Avatar" className="admin-avatar" />
                        <div className="admin-info">
                            <h4>{profile?.full_name || 'Admin User'}</h4>
                            <span>Super Admin</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {activeTab === 'products' ? (
                    // Render component danh sách sản phẩm
                    <AdminProduct />
                ) : activeTab === 'reports' ? (
                    // Render giao diện Báo cáo vi phạm (như cũ)
                    <>
                        <header className="main-header">
                            <h1>Báo cáo vi phạm</h1>
                            <div className="header-badges">
                                <span className="badge-blue">24 New Reports</span>
                                <span className="badge-orange">5 Critical</span>
                            </div>
                        </header>

                        {/* Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon-wrapper blue"><Flag size={20} /></div>
                                <p className="stat-label">TOTAL REPORTS</p>
                                <h3>1,284</h3>
                                <span className="trend positive">+12%</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper orange"><Clock size={20} /></div>
                                <p className="stat-label">PENDING APPROVAL</p>
                                <h3>42</h3>
                                <span className="trend stable">Stable</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper red"><Ban size={20} /></div>
                                <p className="stat-label">LOCKED ACCOUNTS</p>
                                <h3>156</h3>
                                <span className="trend negative">+2%</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper green"><ShieldCheck size={20} /></div>
                                <p className="stat-label">RESOLVED CASES</p>
                                <h3>1,120</h3>
                                <span className="trend positive">+24%</span>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="reports-section">
                            <div className="section-header">
                                <h2>Recent Violation Reports</h2>
                                <button className="btn-export"><Download size={16} /> Export CSV</button>
                            </div>
                            
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>REPORT DETAILS</th>
                                        <th>REPORTER</th>
                                        <th>REPORTED USER</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div className="report-detail">
                                                <div className="img-placeholder"></div>
                                                <div>
                                                    <span className="tag-scam">SCAM</span> <span className="ref-id">#REP-8821</span>
                                                    <p className="product-title">Report product: MacBook Pro 2021</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>Nguyen Lam</td>
                                        <td>Alex Tran</td>
                                        <td><span className="status-pending">Pending</span></td>
                                    </tr>
                                    {/* Thêm các dòng khác tương tự... */}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    // Fallback UI cho các Tab chưa phát triển
                    <div className="placeholder-section" style={{ padding: '20px' }}>
                        <h2>Tính năng đang phát triển</h2>
                        <p>Vui lòng chọn "Báo cáo vi phạm" hoặc "Danh sách sản phẩm".</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;