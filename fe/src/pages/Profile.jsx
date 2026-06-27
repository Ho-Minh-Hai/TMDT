import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Calendar, Camera, Save, ArrowLeft, CheckCircle2, AlertCircle, ShoppingBag, MessageSquare, Package, LogOut, BookOpen, Star } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { getUniversitiesList } from '../constants/universities';
import UserSearchBar from '../components/UserSearchBar';
import './Profile.css';

const Profile = () => {
    const { user, profile, updateProfile, signOut } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        school: '',
        avatar_url: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [avgRating, setAvgRating] = useState(null);
    const [ratingCount, setRatingCount] = useState(0);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        if (profile) {
            // eslint-disable-next-line
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                school: profile.school || '',
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile]);

    // Fetch average rating from reviews via user's products
    useEffect(() => {
        const fetchAvgRating = async () => {
            if (!user?.id) return;
            try {
                // Get all product IDs belonging to this user (seller_id is the correct column)
                const { data: products, error: prodError } = await supabase
                    .from('products')
                    .select('id')
                    .eq('seller_id', user.id);

                if (prodError || !products || products.length === 0) {
                    setAvgRating(null);
                    setRatingCount(0);
                    return;
                }

                const productIds = products.map(p => p.id);

                // Get all reviews for those products
                const { data: reviews, error: revError } = await supabase
                    .from('reviews')
                    .select('rating')
                    .in('product_id', productIds);

                if (revError || !reviews || reviews.length === 0) {
                    setAvgRating(null);
                    setRatingCount(0);
                    return;
                }

                const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                setAvgRating((total / reviews.length).toFixed(1));
                setRatingCount(reviews.length);
            } catch (err) {
                console.error('Lỗi lấy đánh giá:', err);
            }
        };

        fetchAvgRating();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validating file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Vui lòng chọn một tệp ảnh!' });
            return;
        }

        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const cloudinaryData = new FormData();
            cloudinaryData.append('file', file);
            cloudinaryData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            cloudinaryData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: cloudinaryData,
                }
            );

            const data = await response.json();
            
            if (data.secure_url) {
                setFormData(prev => ({ ...prev, avatar_url: data.secure_url }));
                
                // Auto-save the new avatar URL to the profile immediately
                await updateProfile({
                    avatar_url: data.secure_url
                });

                setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                throw new Error(data.error?.message || 'Tải ảnh lên thất bại');
            }
        } catch (err) {
            console.error('Cloudinary error:', err);
            setMessage({ type: 'error', text: 'Lỗi tải ảnh: ' + err.message });
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const { error } = await updateProfile({
            full_name: formData.full_name,
            phone: formData.phone,
            school: formData.school,
            avatar_url: formData.avatar_url
        });

        setLoading(false);
        if (error) {
            setMessage({ type: 'error', text: 'Cập nhật thất bại: ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
            setIsEditing(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="profile-page">
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
            
            <div className="profile-container">
                <motion.button 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)} 
                    className="back-btn"
                >
                    <ArrowLeft size={20} />
                    <span>Quay lại</span>
                </motion.button>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="profile-card"
                >
                    <div className="profile-header">
                        <div className="profile-avatar-wrapper" onClick={triggerFileInput}>
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" className="profile-avatar" />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    <User size={64} />
                                </div>
                            )}
                            <div className="avatar-edit-overlay">
                                {uploading ? (
                                    <div className="upload-spinner"></div>
                                ) : (
                                    <Camera size={24} />
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                            />
                        </div>
                        <div className="profile-title-section">
                            <h1>{profile?.full_name || 'Người dùng'}</h1>
                            <p className="profile-role">{profile?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</p>
                        </div>
                        {!isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="edit-toggle-btn"
                            >
                                Chỉnh sửa hồ sơ
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {message.text && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`message-banner ${message.type}`}
                            >
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                <span>{message.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label><User size={16} /> Họ và tên</label>
                                <input 
                                    type="text" 
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="Nhập họ tên của bạn"
                                />
                            </div>

                            <div className="form-group">
                                <label><Mail size={16} /> Email</label>
                                <input 
                                    type="email" 
                                    value={user?.email || ''} 
                                    disabled 
                                    className="disabled-input"
                                />
                                <span className="input-hint">Email không thể thay đổi</span>
                            </div>

                            <div className="form-group">
                                <label><Phone size={16} /> Số điện thoại</label>
                                <input 
                                    type="text" 
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div className="form-group">
                                <label><BookOpen size={16} /> Trường đại học</label>
                                <select 
                                    name="school"
                                    value={formData.school}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="school-select"
                                >
                                    <option value="">-- Chọn trường đại học --</option>
                                    {getUniversitiesList().map((university) => (
                                        <option key={university} value={university}>
                                            {university}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label><Calendar size={16} /> Ngày tham gia</label>
                                <input 
                                    type="text" 
                                    value={formatDate(profile?.created_at)} 
                                    disabled 
                                    className="disabled-input"
                                />
                            </div>

                            <div className="form-group">
                                <label><Star size={16} /> Đánh giá</label>
                                <div className="rating-display disabled-input">
                                    {avgRating !== null ? (
                                        <>
                                            <span className="rating-stars">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star
                                                        key={s}
                                                        size={18}
                                                        className={parseFloat(avgRating) >= s ? 'star-filled' : 'star-empty'}
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

                        {isEditing && (
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditing(false)} 
                                    className="cancel-btn"
                                    disabled={loading}
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit" 
                                    className="save-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang lưu...' : (
                                        <>
                                            <Save size={18} />
                                            <span>Lưu thay đổi</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </motion.div>
            </div>


        </div>
    );
};

export default Profile;
