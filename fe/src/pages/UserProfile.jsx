import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User, Mail, Phone, Calendar, BookOpen, Star,
    ShoppingBag, MessageSquare, Package, LogOut,
    ArrowLeft, Flag, X, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './Profile.css';
import './UserProfile.css';

const UserProfile = () => {
    const { id } = useParams();
    const { user, profile: myProfile, signOut } = useAuth();
    const navigate = useNavigate();

    const [targetProfile, setTargetProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [avgRating, setAvgRating] = useState(null);
    const [ratingCount, setRatingCount] = useState(0);

    // Report state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportMessage, setReportMessage] = useState({ type: '', text: '' });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Fetch target user profile
    useEffect(() => {
        const fetchTargetProfile = async () => {
            if (!id) return;
            setLoadingProfile(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();
            if (!error && data) setTargetProfile(data);
            setLoadingProfile(false);
        };
        fetchTargetProfile();
    }, [id]);

    // Fetch average rating for target user
    useEffect(() => {
        const fetchAvgRating = async () => {
            if (!id) return;
            const { data: products, error: prodError } = await supabase
                .from('products')
                .select('id')
                .eq('seller_id', id);

            if (prodError || !products || products.length === 0) {
                setAvgRating(null); setRatingCount(0); return;
            }
            const productIds = products.map(p => p.id);

            const { data: reviews, error: revError } = await supabase
                .from('reviews')
                .select('rating')
                .in('product_id', productIds);

            if (revError || !reviews || reviews.length === 0) {
                setAvgRating(null); setRatingCount(0); return;
            }
            const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            setAvgRating((total / reviews.length).toFixed(1));
            setRatingCount(reviews.length);
        };
        fetchAvgRating();
    }, [id]);

    const handleReport = async () => {
        if (!reportReason.trim()) {
            setReportMessage({ type: 'error', text: 'Vui lòng nhập lý do báo cáo!' });
            return;
        }
        setReportLoading(true);
        setReportMessage({ type: '', text: '' });

        const { error } = await supabase.from('report').insert({
            reporter_id: user.id,
            reported_user_id: id,
            reason: reportReason.trim(),
        });

        setReportLoading(false);
        if (error) {
            setReportMessage({ type: 'error', text: 'Gửi báo cáo thất bại: ' + error.message });
        } else {
            setReportMessage({ type: 'success', text: 'Báo cáo đã được gửi thành công!' });
            setReportReason('');
            setTimeout(() => {
                setShowReportModal(false);
                setReportMessage({ type: '', text: '' });
            }, 2000);
        }
    };

    if (loadingProfile) {
        return (
            <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="up-spinner"></div>
            </div>
        );
    }

    if (!targetProfile) {
        return (
            <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
                <User size={48} color="#9ca3af" />
                <p style={{ color: '#6b7280' }}>Không tìm thấy người dùng này.</p>
                <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Quay lại</button>
            </div>
        );
    }

    const isOwnProfile = user?.id === id;

    return (
        <div className="profile-page">
            <div className="bg-mesh"></div>

            {/* Navbar */}
            <nav className="navbar">
                <button
                    className="logo"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => navigate('/home')}
                >
                    <div className="logo-icon"><ShoppingBag size={24} color="white" /></div>
                    <span>Student<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                </button>
                <div className="nav-links">
                    <a href="#" className="nav-link">Bộ sưu tập</a>
                    <a href="#" className="nav-link">Ưu đãi</a>
                    <a href="#" className="nav-link">Xu hướng</a>
                    <Link to="/chat" className="nav-icon-link" title="Tin nhắn"><MessageSquare size={20} /></Link>
                    <Link to="/seller" className="nav-icon-link" title="Shop"><Package size={20} /></Link>
                </div>
                <Link to="/profile" className="user-tag" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <User size={18} />
                    <span style={{ fontSize: '0.9rem' }}>{myProfile?.full_name || user?.email?.split('@')[0]}</span>
                    <button onClick={(e) => { e.preventDefault(); signOut(); }} className="auth-switch" style={{ marginLeft: '1rem' }}>
                        <LogOut size={16} />
                    </button>
                </Link>
            </nav>

            <div className="profile-container">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="back-btn"
                >
                    <ArrowLeft size={20} /><span>Quay lại</span>
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="profile-card"
                >
                    {/* Header */}
                    <div className="profile-header">
                        <div className="profile-avatar-wrapper" style={{ cursor: 'default' }}>
                            {targetProfile.avatar_url ? (
                                <img src={targetProfile.avatar_url} alt="Avatar" className="profile-avatar" />
                            ) : (
                                <div className="profile-avatar-placeholder"><User size={64} /></div>
                            )}
                        </div>
                        <div className="profile-title-section">
                            <h1>{targetProfile.full_name || 'Người dùng'}</h1>
                            <p className="profile-role">{targetProfile.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</p>
                        </div>
                        {!isOwnProfile && (
                            <button
                                className="report-btn"
                                onClick={() => setShowReportModal(true)}
                            >
                                <Flag size={16} />
                                Báo cáo
                            </button>
                        )}
                        {isOwnProfile && (
                            <button
                                className="edit-toggle-btn"
                                onClick={() => navigate('/profile')}
                            >
                                Chỉnh sửa hồ sơ
                            </button>
                        )}
                    </div>

                    {/* Info grid — read only */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label><User size={16} /> Họ và tên</label>
                            <input type="text" value={targetProfile.full_name || ''} disabled className="disabled-input" />
                        </div>

                        <div className="form-group">
                            <label><Mail size={16} /> Email</label>
                            <input type="text" value={targetProfile.email || '—'} disabled className="disabled-input" />
                        </div>

                        <div className="form-group">
                            <label><Phone size={16} /> Số điện thoại</label>
                            <input type="text" value={targetProfile.phone || '—'} disabled className="disabled-input" />
                        </div>

                        <div className="form-group">
                            <label><BookOpen size={16} /> Trường đại học</label>
                            <input type="text" value={targetProfile.school || '—'} disabled className="disabled-input" />
                        </div>

                        <div className="form-group">
                            <label><Calendar size={16} /> Ngày tham gia</label>
                            <input type="text" value={formatDate(targetProfile.created_at)} disabled className="disabled-input" />
                        </div>

                        <div className="form-group">
                            <label><Star size={16} /> Đánh giá</label>
                            <div className="rating-display disabled-input">
                                {avgRating !== null ? (
                                    <>
                                        <span className="rating-stars">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    size={18}
                                                    fill={parseFloat(avgRating) >= s ? '#f59e0b' : 'none'}
                                                    color={parseFloat(avgRating) >= s ? '#f59e0b' : '#d1d5db'}
                                                />
                                            ))}
                                        </span>
                                        <span className="rating-value">{avgRating} / 5</span>
                                        <span className="rating-count">({ratingCount} đánh giá)</span>
                                    </>
                                ) : (
                                    <span className="rating-none">Chưa có đánh giá</span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div
                        className="report-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => e.target === e.currentTarget && setShowReportModal(false)}
                    >
                        <motion.div
                            className="report-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        >
                            <div className="report-modal-header">
                                <div className="report-modal-title">
                                    <AlertTriangle size={22} color="#ef4444" />
                                    <h2>Báo cáo người dùng</h2>
                                </div>
                                <button className="report-close-btn" onClick={() => { setShowReportModal(false); setReportMessage({ type: '', text: '' }); setReportReason(''); }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="report-target-name">
                                Đối tượng: <strong>{targetProfile.full_name || 'Người dùng'}</strong>
                            </p>

                            <div className="report-form-group">
                                <label>Lý do báo cáo <span style={{ color: '#ef4444' }}>*</span></label>
                                <textarea
                                    className="report-textarea"
                                    placeholder="Mô tả chi tiết lý do bạn muốn báo cáo người dùng này..."
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    rows={5}
                                    maxLength={1000}
                                />
                                <span className="report-char-count">{reportReason.length}/1000</span>
                            </div>

                            <AnimatePresence>
                                {reportMessage.text && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`message-banner ${reportMessage.type}`}
                                        style={{ marginBottom: '1rem' }}
                                    >
                                        {reportMessage.type === 'success'
                                            ? <CheckCircle2 size={16} />
                                            : <AlertTriangle size={16} />}
                                        <span>{reportMessage.text}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="report-modal-actions">
                                <button
                                    className="cancel-btn"
                                    onClick={() => { setShowReportModal(false); setReportMessage({ type: '', text: '' }); setReportReason(''); }}
                                    disabled={reportLoading}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    className="report-submit-btn"
                                    onClick={handleReport}
                                    disabled={reportLoading || !reportReason.trim()}
                                >
                                    {reportLoading ? 'Đang gửi...' : (
                                        <><Flag size={16} /><span>Gửi báo cáo</span></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserProfile;
