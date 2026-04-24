import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const { signIn, signUp } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) throw error;
            } else {
                const { error } = await signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.username,
                            role: 'user',
                        },
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                setSuccessMsg('Vui lòng kiểm tra email của bạn để xác nhận đăng ký! Một đường link xác nhận đã được gửi đi.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
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
