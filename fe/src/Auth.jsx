import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#EA4335" d="M12 9.5v5h6.9c-.3 1.8-1.8 4.3-6.9 4.3-4.2 0-7.7-3.5-7.7-7.8S7.8 3.2 12 3.2c2.4 0 4 1 5 1.9l3.4-3.3C18.3.7 15.5-.5 12-.5 5.4-.5.1 4.8.1 11.5S5.4 23.5 12 23.5c6.8 0 11.3-4.8 11.3-11.6 0-.8-.1-1.4-.2-2.1H12z" />
        <path fill="#4285F4" d="M23.1 11.8c0-.7-.1-1.4-.2-2.1H12v4h6.2c-.3 1.5-1.2 2.8-2.5 3.6l3.8 2.9c2.2-2 3.6-5 3.6-8.4z" />
        <path fill="#FBBC05" d="M5.8 14.3c-.3-.8-.5-1.6-.5-2.6s.2-1.8.5-2.6L2 6.2C1.2 7.7.7 9.4.7 11.7s.5 4 .4 5.5l4.7-2.9z" />
        <path fill="#34A853" d="M12 23.5c3.5 0 6.3-1.2 8.4-3.3l-3.8-2.9c-1 .7-2.3 1.2-4.6 1.2-5.1 0-6.9-2.5-7.9-4.3l-4.7 2.9c1.8 3.5 5.5 6.4 12.6 6.4z" />
    </svg>
);

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    
    const { signIn, signUp, signInWithGoogle, fetchProfile, user, profile } = useAuth(); 
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
    });

    useEffect(() => {
        if (!user) {
            return;
        }

        if (profile?.role === 'admin') {
            navigate('/admin', { replace: true });
            return;
        }

        if (profile) {
            navigate('/home', { replace: true });
        }
    }, [user, profile, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (isLogin) {
                // Xử lý đăng nhập
                const { data, error } = await signIn({
                    email: formData.email,
                    password: formData.password,
                });
                
                if (error) throw error;

                // Kiểm tra Role ngay lập tức để chuyển hướng mượt mà
                if (data?.user) {
                    const userProfile = await fetchProfile(data.user.id);
                    if (userProfile?.role === 'admin') {
                        navigate('/admin'); // Role admin -> Chuyển sang Dashboard Admin
                    } else {
                        navigate('/home'); // Role user -> Chuyển sang trang Home (đồng bộ với App.jsx)
                    }
                }
            } else {
                // Xử lý đăng ký
                const { error } = await signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.username,
                            role: 'user', // Mặc định tài khoản mới là user thường
                        },
                        emailRedirectTo: window.location.origin
                    }
                });
                
                if (error) throw error;
                setSuccessMsg('Vui lòng kiểm tra email của bạn để xác nhận đăng ký! Một đường link xác nhận đã được gửi đi.');
            }
        } catch (err) {
            // Tùy chỉnh thông báo lỗi cho thân thiện hơn
            if (err.message.includes('Invalid login credentials')) {
                setError('Email hoặc mật khẩu không chính xác.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            const { error } = await signInWithGoogle();
            if (error) {
                throw error;
            }
        } catch (err) {
            setError(err.message || 'Không thể đăng nhập bằng Google.');
            setLoading(false);
        }
    };



    return (
        <div className="auth-container">
            <div className="bg-mesh"></div>
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="auth-card"
            >
                <div className="auth-header">
                    <h2 className="auth-title">{isLogin ? 'Chào mừng trở lại' : 'Tham gia cùng N5'}</h2>
                    <p className="auth-subtitle">{isLogin ? 'Đăng nhập để khám phá các sản phẩm mới nhất' : 'Sáng tạo tài khoản cá nhân của bạn ngay hôm nay'}</p>
                </div>

                <AnimatePresence mode="wait">
                    {successMsg ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="success-card"
                        >
                            <CheckCircle className="success-icon" />
                            <h3 className="success-title">Đăng ký thành công!</h3>
                            <p className="success-text">{successMsg}</p>
                            <button 
                                onClick={() => { setSuccessMsg(null); setIsLogin(true); }}
                                className="auth-switch"
                                style={{ marginTop: '2rem', color: 'var(--primary)', fontWeight: '600' }}
                            >
                                Quay lại đăng nhập
                            </button>
                        </motion.div>
                    ) : (
                        <motion.form 
                            key="form"
                            onSubmit={handleSubmit} 
                            className="auth-form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {!isLogin && (
                                <div className="input-group">
                                    <User className="input-icon" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Họ và tên" 
                                        className="auth-input"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    />
                                </div>
                            )}
                            <div className="input-group">
                                <Mail className="input-icon" size={20} />
                                <input 
                                    type="email" 
                                    placeholder="Địa chỉ Email" 
                                    className="auth-input"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="input-group">
                                <Lock className="input-icon" size={20} />
                                <input 
                                    type="password" 
                                    placeholder="Mật khẩu" 
                                    className="auth-input"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>



                            {error && (
                                <div className="error-message">{error}</div>
                            )}

                            <button type="submit" disabled={loading} className="btn-auth">
                                {loading ? 'Đang xác thực...' : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
                                <ArrowRight size={20} />
                            </button>

                            {isLogin && (
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="btn-auth"
                                    style={{
                                        marginTop: '12px',
                                        background: '#fff',
                                        color: '#0f172a',
                                        border: '1px solid #cbd5e1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                    }}
                                >
                                    {loading ? 'Đang kết nối Google...' : 'Đăng nhập với Google'}
                                    <GoogleIcon />
                                </button>
                            )}

                            <div className="auth-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="auth-switch"
                                >
                                    {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập tại đây'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Auth;