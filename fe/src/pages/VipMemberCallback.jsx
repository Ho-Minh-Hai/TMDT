import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyVnPayReturn } from '../services/api';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import './VipMember.css';

const VipMemberCallback = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('pending');
    const [message, setMessage] = useState('Đang xác thực kết quả thanh toán...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const processPayment = async () => {
            const queryString = location.search.startsWith('?') ? location.search.substring(1) : location.search;
            if (!queryString) {
                setStatus('error');
                setMessage('Không có dữ liệu thanh toán trả về.');
                setLoading(false);
                return;
            }

            try {
                const result = await verifyVnPayReturn(queryString);
                if (result.success) {
                    setStatus('success');
                    setMessage('Thanh toán VNPay thành công! Gói VIP của bạn đã được kích hoạt.');
                } else {
                    setStatus('error');
                    setMessage(result.message || 'Thanh toán không thành công.');
                }
            } catch (error) {
                console.error('Callback verification failed:', error);
                setStatus('error');
                setMessage('Lỗi xác thực thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            processPayment();
        } else {
            setStatus('error');
            setMessage('Bạn cần đăng nhập để xác nhận thanh toán.');
            setLoading(false);
        }
    }, [location.search, user]);

    return (
        <div className="vip-callback-page">
            <div className="vip-callback-shell">
                <div className="vip-callback-card">
                    <div className="vip-callback-header">
                        <div>
                            <p className="vip-callback-label">Kết quả thanh toán VNPay</p>
                            <h1>Gói VIP của bạn</h1>
                        </div>
                        <div className="vip-callback-status-pill">
                            {loading ? 'Đang xử lý' : status === 'success' ? 'Thành công' : 'Thất bại'}
                        </div>
                    </div>

                    <div className={`vip-callback-body ${status === 'success' ? 'success' : 'error'}`}>
                        {loading ? (
                            <div className="vip-callback-loading">
                                <Loader2 className="spin" size={48} />
                                <p>{message}</p>
                            </div>
                        ) : (
                            <>
                                <div className="vip-callback-result-icon">
                                    {status === 'success' ? (
                                        <CheckCircle2 size={60} />
                                    ) : (
                                        <AlertCircle size={60} />
                                    )}
                                </div>
                                <h2>{status === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại'}</h2>
                                <p className="vip-callback-message">{message}</p>
                                <div className="vip-callback-actions">
                                    <button className="btn-primary callback-button" onClick={() => navigate('/home')}>
                                        Quay lại Trang chủ
                                    </button>
                                    <Link to="/shop" className="btn-secondary callback-button">
                                        Về trang mua sắm
                                    </Link>
                                </div>
                                <button className="vip-back-btn" onClick={() => navigate(-1)}>
                                    <ArrowLeft size={16} /> Quay lại trang trước
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VipMemberCallback;
