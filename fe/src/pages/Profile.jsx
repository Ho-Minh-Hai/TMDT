import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Calendar, Camera, Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const { user, profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        avatar_url: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        if (profile) {
            // eslint-disable-next-line
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile]);

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
                            <p className="profile-role">{profile?.role === 'seller' ? 'Chủ cửa hàng' : 'Khách hàng'}</p>
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
                                <label><Calendar size={16} /> Ngày tham gia</label>
                                <input 
                                    type="text" 
                                    value={formatDate(profile?.created_at)} 
                                    disabled 
                                    className="disabled-input"
                                />
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

            <style>{`
                .profile-page {
                    min-height: 100vh;
                    color: white;
                    padding: 2rem;
                    position: relative;
                    overflow-x: hidden;
                }

                .profile-container {
                    max-width: 800px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 1;
                }

                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: none;
                    border: none;
                    color: var(--text-dim);
                    cursor: pointer;
                    margin-bottom: 2rem;
                    font-weight: 500;
                    transition: color 0.3s;
                }

                .back-btn:hover {
                    color: white;
                }

                .profile-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 3rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .profile-header {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    margin-bottom: 3rem;
                    flex-wrap: wrap;
                }

                .profile-avatar-wrapper {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid var(--primary);
                    background: rgba(255, 255, 255, 0.05);
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: transform 0.3s;
                }

                .profile-avatar-wrapper:hover {
                    transform: scale(1.05);
                }

                .profile-avatar-wrapper:hover .avatar-edit-overlay {
                    opacity: 1;
                }

                .profile-avatar {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .profile-avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-dim);
                }

                .avatar-edit-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                    color: white;
                }

                .upload-spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .profile-title-section {
                    flex-grow: 1;
                }

                .profile-title-section h1 {
                    font-size: 2rem;
                    margin: 0;
                    background: linear-gradient(to right, #fff, #a5b4fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .profile-role {
                    color: var(--primary);
                    font-weight: 600;
                    margin-top: 0.25rem;
                }

                .edit-toggle-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s;
                }

                .edit-toggle-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .message-banner {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                }

                .message-banner.success {
                    background: rgba(34, 197, 94, 0.1);
                    color: #4ade80;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }

                .message-banner.error {
                    background: rgba(239, 68, 68, 0.1);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-group.full-width {
                    grid-column: 1 / -1;
                }

                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--text-dim);
                    font-weight: 500;
                }

                .form-group input {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 0.85rem 1rem;
                    color: white;
                    font-size: 1rem;
                    transition: all 0.3s;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: var(--primary);
                    background: rgba(255, 255, 255, 0.08);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                .form-group input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .disabled-input {
                    background: rgba(0, 0, 0, 0.2) !important;
                }

                .input-hint {
                    font-size: 0.75rem;
                    color: #666;
                    margin-top: 0.25rem;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 3rem;
                }

                .cancel-btn {
                    background: none;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .cancel-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .save-btn {
                    background: var(--primary);
                    border: none;
                    color: white;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s;
                }

                .save-btn:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                }

                .save-btn:disabled {
                    opacity: 0.5;
                    transform: none;
                    cursor: not-allowed;
                }

                @media (max-width: 640px) {
                    .profile-card {
                        padding: 1.5rem;
                    }
                    .profile-header {
                        flex-direction: column;
                        text-align: center;
                        gap: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Profile;
