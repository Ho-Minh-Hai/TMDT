import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import UserSearchBar from '../components/UserSearchBar';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, User, LogOut, MessageSquare, Package, 
    ArrowLeft, Check, Sparkles, Zap, Crown, 
    QrCode, CreditCard, CheckCircle2, AlertCircle, Copy
} from 'lucide-react';
import './VipMember.css';

// Custom CSS-based Confetti component
const ConfettiEffect = () => {
    const [particles, setParticles] = useState([]);
    useEffect(() => {
        const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
        const newParticles = Array.from({ length: 80 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + 'vw',
            top: Math.random() * -20 - 5 + 'vh',
            size: Math.random() * 8 + 6 + 'px',
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 2 + 's',
            duration: Math.random() * 3 + 2.5 + 's',
            tilt: Math.random() * 360 + 'deg',
            shape: Math.random() > 0.5 ? 'circle' : 'square'
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="confetti-canvas" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999, overflow: 'hidden' }}>
            {particles.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: p.shape === 'circle' ? '50%' : '2px',
                        transform: `rotate(${p.tilt})`,
                        animation: `fall ${p.duration} linear forwards`,
                        animationDelay: p.delay,
                    }}
                />
            ))}
            <style>{`
                @keyframes fall {
                    0% { top: -10vh; transform: translateX(0) rotate(0deg); opacity: 1; }
                    50% { transform: translateX(25px) rotate(180deg); opacity: 0.9; }
                    100% { top: 110vh; transform: translateX(-25px) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const PLANS = [
    {
        id: 'starter',
        name: 'Gói Starter (Boost 3)',
        priceUSD: 10,
        priceVND: '250.000',
        boostLimit: 3,
        popular: false,
        gold: false,
        features: [
            'Boost tối đa 3 bài viết',
            'Đẩy bài đăng lên đầu danh sách',
            'Hiện nhãn "Được tài trợ" nổi bật',
            'Gói cước có hiệu lực 30 ngày',
            'Hỗ trợ kỹ thuật 24/7'
        ]
    },
    {
        id: 'popular',
        name: 'Gói Popular (Boost 5)',
        priceUSD: 15,
        priceVND: '370.000',
        boostLimit: 5,
        popular: true,
        gold: false,
        features: [
            'Boost tối đa 5 bài viết cùng lúc',
            'Đẩy bài đăng lên đầu danh sách',
            'Hiện nhãn "Được tài trợ" nổi bật',
            'Gói cước có hiệu lực 30 ngày',
            'Hỗ trợ ưu tiên hàng đầu',
            'Báo cáo hiệu quả tin đăng'
        ]
    },
    {
        id: 'unlimited',
        name: 'Gói VIP Unlimited',
        priceUSD: 50,
        priceVND: '1.250.000',
        boostLimit: 9999,
        popular: false,
        gold: true,
        features: [
            'Boost KHÔNG GIỚI HẠN bài viết',
            'Ưu tiên vị trí cao nhất trên trang chủ',
            'Nhãn "Tài trợ VIP" lấp lánh đặc biệt',
            'Gói cước có hiệu lực 30 ngày',
            'Hỗ trợ quản lý riêng chuyên nghiệp',
            'Miễn phí đăng tin không giới hạn'
        ]
    }
];

const VipMember = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    const [activePlan, setActivePlan] = useState(null);
    const [userProducts, setUserProducts] = useState([]);
    const [boostedIds, setBoostedIds] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Modal checkout state
    const [checkoutModal, setCheckoutModal] = useState({ open: false, plan: null });
    const [paymentMethod, setPaymentMethod] = useState('bank'); // bank, momo, vnpay
    const [isVerifying, setIsVerifying] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [toast, setToast] = useState(null);

    // Load active VIP membership and boosted products from localStorage
    useEffect(() => {
        if (user) {
            const storedMembership = localStorage.getItem(`vip_membership_${user.id}`);
            if (storedMembership) {
                try {
                    const parsed = JSON.parse(storedMembership);
                    // Check expiry (30 days from registration)
                    if (new Date(parsed.expiresAt) > new Date()) {
                        setActivePlan(parsed);
                    } else {
                        // Expired
                        localStorage.removeItem(`vip_membership_${user.id}`);
                    }
                } catch (e) {
                    console.error('Error parsing VIP membership', e);
                }
            }

            // Global boosted products list
            const storedBoosted = localStorage.getItem('boosted_products');
            if (storedBoosted) {
                try {
                    setBoostedIds(JSON.parse(storedBoosted));
                } catch (e) {
                    console.error('Error parsing boosted IDs', e);
                }
            }

            fetchUserProducts();
        }
    }, [user]);

    const fetchUserProducts = async () => {
        if (!user) return;
        setLoadingProducts(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUserProducts(data || []);
        } catch (err) {
            console.error('Error loading products:', err);
            showToast('Không thể tải danh sách sản phẩm', 'error');
        } finally {
            setLoadingProducts(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSelectPlan = (plan) => {
        setCheckoutModal({ open: true, plan });
        setPaymentMethod('bank');
    };

    const handleConfirmPayment = () => {
        setIsVerifying(true);
        setTimeout(() => {
            const now = new Date();
            const expires = new Date();
            expires.setDate(now.getDate() + 30); // 30 days active

            const newMembership = {
                planId: checkoutModal.plan.id,
                planName: checkoutModal.plan.name,
                boostLimit: checkoutModal.plan.boostLimit,
                boostsRemaining: checkoutModal.plan.boostLimit,
                registeredAt: now.toISOString(),
                expiresAt: expires.toISOString()
            };

            localStorage.setItem(`vip_membership_${user.id}`, JSON.stringify(newMembership));
            setActivePlan(newMembership);
            setIsVerifying(false);
            setCheckoutModal({ open: false, plan: null });

            // Trigger confetti
            setShowConfetti(true);
            showToast(`Đăng ký ${checkoutModal.plan.name} thành công! 🎉`, 'success');
            setTimeout(() => setShowConfetti(false), 5000);
        }, 1500); // 1.5s delay to simulate banking hook verification
    };

    const handleCancelVip = () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy gói thành viên VIP? Các bài viết đang boost sẽ mất nhãn tài trợ.')) {
            // Remove user's boosted products from the global boosted list
            const userProductIds = userProducts.map(p => p.id);
            const remainingGlobalBoosted = boostedIds.filter(id => !userProductIds.includes(id));
            
            localStorage.setItem('boosted_products', JSON.stringify(remainingGlobalBoosted));
            setBoostedIds(remainingGlobalBoosted);
            
            localStorage.removeItem(`vip_membership_${user.id}`);
            setActivePlan(null);
            showToast('Đã hủy gói thành viên VIP thành công!', 'info');
        }
    };

    // Toggle boosting for a product
    const handleToggleBoost = (productId) => {
        if (!activePlan) return;

        const isCurrentlyBoosted = boostedIds.includes(productId);

        if (isCurrentlyBoosted) {
            // Unboost
            const updatedBoosts = boostedIds.filter(id => id !== productId);
            localStorage.setItem('boosted_products', JSON.stringify(updatedBoosts));
            setBoostedIds(updatedBoosts);

            // Increment boosts remaining (if not unlimited)
            if (activePlan.planId !== 'unlimited') {
                const updatedMembership = {
                    ...activePlan,
                    boostsRemaining: Math.min(activePlan.boostLimit, activePlan.boostsRemaining + 1)
                };
                localStorage.setItem(`vip_membership_${user.id}`, JSON.stringify(updatedMembership));
                setActivePlan(updatedMembership);
            }
            showToast('Đã dừng tài trợ bài viết này');
        } else {
            // Boost
            // Check if user has boosts remaining
            if (activePlan.planId !== 'unlimited' && activePlan.boostsRemaining <= 0) {
                showToast('Bạn đã hết lượt boost! Hãy nâng cấp gói hoặc hủy các bài đang boost khác.', 'error');
                return;
            }

            const updatedBoosts = [...boostedIds, productId];
            localStorage.setItem('boosted_products', JSON.stringify(updatedBoosts));
            setBoostedIds(updatedBoosts);

            // Decrement boosts remaining (if not unlimited)
            if (activePlan.planId !== 'unlimited') {
                const updatedMembership = {
                    ...activePlan,
                    boostsRemaining: Math.max(0, activePlan.boostsRemaining - 1)
                };
                localStorage.setItem(`vip_membership_${user.id}`, JSON.stringify(updatedMembership));
                setActivePlan(updatedMembership);
            }
            showToast('Đã boost bài viết của bạn thành công! ✨', 'success');
        }
    };

    // Helper to calculate current active boosts of the user
    const getUserActiveBoostCount = () => {
        const userProductIds = userProducts.map(p => p.id);
        return boostedIds.filter(id => userProductIds.includes(id)).length;
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    return (
        <div className="vip-page">
            <div className="bg-mesh"></div>
            {showConfetti && <ConfettiEffect />}

            {/* Toast alerts */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)}>×</button>
                </div>
            )}

            {/* Checkout Modal */}
            <AnimatePresence>
                {checkoutModal.open && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="modal-content payment-modal"
                        >
                            <div className="payment-title">Thanh toán đăng ký</div>
                            <div className="payment-subtitle">Bạn đang chọn: <strong>{checkoutModal.plan?.name}</strong></div>

                            {/* Select payment method */}
                            <div className="payment-methods-grid">
                                <button 
                                    className={`pay-method-btn ${paymentMethod === 'bank' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('bank')}
                                >
                                    <CreditCard size={20} color="var(--primary)" />
                                    <span>Chuyển khoản</span>
                                </button>
                                <button 
                                    className={`pay-method-btn ${paymentMethod === 'momo' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('momo')}
                                >
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        backgroundColor: '#a50064',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '9px',
                                        fontWeight: '800',
                                        fontFamily: 'system-ui, sans-serif'
                                    }}>MoMo</div>
                                    <span>Ví MoMo</span>
                                </button>
                                <button 
                                    className={`pay-method-btn ${paymentMethod === 'vnpay' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('vnpay')}
                                >
                                    <div style={{
                                        width: '38px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        background: 'linear-gradient(135deg, #005baa, #00adef)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '8px',
                                        fontWeight: '800',
                                        fontFamily: 'system-ui, sans-serif'
                                    }}>VNPAY</div>
                                    <span>VNPAY QR</span>
                                </button>
                            </div>

                            {/* QR Code and Instructions */}
                            <div className="qr-code-wrapper">
                                <div className="qr-code-container">
                                    <img 
                                        className="mock-qr-img"
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                            `STU_HUB_VIP_${checkoutModal.plan?.id}_${user?.id}`
                                        )}`} 
                                        alt="QR Payment" 
                                    />
                                </div>
                                <div className="transfer-details">
                                    <div className="detail-row">
                                        <span className="detail-lbl">Số tiền cần thanh toán</span>
                                        <span className="detail-val" style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                                            {checkoutModal.plan?.priceVND} VNĐ
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-lbl">Tên tài khoản</span>
                                        <span className="detail-val">STUDENT HUB COMPANY</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-lbl">Số tài khoản</span>
                                        <span className="detail-val copyable" onClick={() => { navigator.clipboard.writeText('1028372619'); showToast('Đã copy số tài khoản!'); }}>
                                            1028372619 <Copy size={12} />
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-lbl">Ngân hàng</span>
                                        <span className="detail-val">Vietcombank</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-lbl">Cú pháp chuyển khoản</span>
                                        <span className="detail-val copyable" onClick={() => { navigator.clipboard.writeText(`STUHUB VIP ${checkoutModal.plan?.id}`); showToast('Đã copy cú pháp!'); }}>
                                            STUHUB VIP {checkoutModal.plan?.id} <Copy size={12} />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pay-alert">
                                <AlertCircle size={28} />
                                <span>Lưu ý: Đây là hệ thống thử nghiệm tĩnh của web. Bấm xác nhận phía dưới sẽ mô phỏng hoàn tất giao dịch tự động.</span>
                            </div>

                            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => setCheckoutModal({ open: false, plan: null })}
                                    disabled={isVerifying}
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleConfirmPayment}
                                    disabled={isVerifying}
                                    style={{ background: 'var(--primary)' }}
                                >
                                    {isVerifying ? 'Đang kiểm tra...' : 'Xác nhận đã chuyển khoản'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Navbar */}
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

            <div className="vip-container">
                <button className="vip-back-btn" onClick={() => navigate('/home')}>
                    <ArrowLeft size={18} />
                    <span>Quay lại Trang chủ</span>
                </button>

                <div className="vip-header">
                    <div className="vip-header-badge">
                        <Crown size={16} />
                        <span>TÍNH NĂNG TÀI TRỢ DOANH SỐ</span>
                    </div>
                    <h1 className="vip-title">Nâng cấp VIP Member & Boost Bài Viết</h1>
                    <p className="vip-subtitle">
                        Đẩy tin đăng của bạn lên vị trí đầu tiên của trang chủ và trang tìm kiếm để tiếp cận hàng ngàn sinh viên trong nháy mắt.
                    </p>
                </div>

                {/* Condition rendering based on Active plan */}
                {!activePlan ? (
                    /* Pricing Cards Grid */
                    <div className="vip-plans-grid">
                        {PLANS.map((plan) => (
                            <div key={plan.id} className={`vip-card ${plan.popular ? 'popular' : ''} ${plan.gold ? 'gold' : ''}`}>
                                {plan.popular && <span className="plan-badge popular-badge">Bán chạy nhất</span>}
                                {plan.gold && <span className="plan-badge gold-badge">Premium VIP</span>}
                                
                                <div className="plan-name">{plan.name}</div>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                    {plan.id === 'unlimited' ? 'Đầu tư hoàn hảo cho shop lớn' : 'Dễ dàng bắt đầu bán hàng nhanh'}
                                </p>

                                <div className="plan-price-box">
                                    <span className="plan-price">{plan.priceVND}đ</span>
                                    <span className="plan-price-usd">/ ${plan.priceUSD}</span>
                                </div>

                                <div className="plan-duration" style={{ marginBottom: '1.5rem', fontWeight: '600' }}>
                                    {plan.id === 'unlimited' ? 'Không giới hạn lượt boost / 30 ngày' : `Nhận ${plan.boostLimit} lượt boost bài / 30 ngày`}
                                </div>

                                <ul className="plan-features">
                                    {plan.features.map((feat, idx) => (
                                        <li key={idx} className="plan-feature-item">
                                            <CheckCircle2 size={16} color={plan.gold ? '#f59e0b' : 'var(--primary)'} />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button 
                                    className="plan-btn" 
                                    onClick={() => handleSelectPlan(plan)}
                                >
                                    <Sparkles size={16} />
                                    <span>Đăng ký ngay</span>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Active VIP Dashboard & Boosting tools */
                    <div>
                        <div className="active-dashboard">
                            <div className="active-header">
                                <div className="active-badge-card">
                                    <div className={`active-icon-box ${activePlan.planId === 'unlimited' ? 'gold' : ''}`}>
                                        {activePlan.planId === 'unlimited' ? <Crown size={28} /> : <Zap size={28} />}
                                    </div>
                                    <div className="active-details">
                                        <h2>
                                            {activePlan.planName}
                                            <span className="sponsored-badge-pill" style={{ 
                                                background: activePlan.planId === 'unlimited' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                                                color: activePlan.planId === 'unlimited' ? '#d97706' : 'var(--primary)',
                                                borderColor: activePlan.planId === 'unlimited' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)'
                                            }}>
                                                Hoạt động
                                            </span>
                                        </h2>
                                        <p>Ngày đăng ký: {formatDate(activePlan.registeredAt)} | Hạn dùng đến: <strong>{formatDate(activePlan.expiresAt)}</strong></p>
                                    </div>
                                </div>

                                <div className="dashboard-stats">
                                    <div className="stat-item">
                                        <span className="stat-val">
                                            {activePlan.planId === 'unlimited' ? 'Vô hạn' : activePlan.boostsRemaining}
                                        </span>
                                        <span className="stat-lbl">Lượt boost còn lại</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-val">{getUserActiveBoostCount()}</span>
                                        <span className="stat-lbl">Đang boost</span>
                                    </div>
                                </div>

                                <button className="cancel-plan-btn" onClick={handleCancelVip}>
                                    Hủy gói thành viên
                                </button>
                            </div>

                            {/* User Products Grid */}
                            <div className="user-products-section">
                                <h3>Chọn tin đăng cần tài trợ của bạn</h3>
                                
                                {loadingProducts ? (
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                                        <p>Đang tải sản phẩm của bạn...</p>
                                    </div>
                                ) : userProducts.length === 0 ? (
                                    <div className="no-products-msg">
                                        <h4>Bạn chưa đăng bán sản phẩm nào</h4>
                                        <p>Hãy vào mục Quản lý shop để thêm sản phẩm đầu tiên trước khi boost bài viết.</p>
                                        <Link to="/seller/products/new" className="btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
                                            Thêm sản phẩm mới ngay
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="boosting-grid">
                                        {userProducts.map((product) => {
                                            const isBoosted = boostedIds.includes(product.id);
                                            return (
                                                <div key={product.id} className={`boosting-product-card ${isBoosted ? 'boosted' : ''}`}>
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt="" className="boosting-img" />
                                                    ) : (
                                                        <div className="boosting-no-img">
                                                            <Package size={24} />
                                                        </div>
                                                    )}
                                                    <div className="boosting-info">
                                                        <h4>{product.name}</h4>
                                                        <div className="boosting-price">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0)}
                                                        </div>
                                                        <div className="boosting-badge-row">
                                                            {isBoosted && (
                                                                <span className="sponsored-badge-pill" style={{ 
                                                                    background: activePlan.planId === 'unlimited' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                                                                    color: activePlan.planId === 'unlimited' ? '#d97706' : 'var(--primary)'
                                                                }}>
                                                                    {activePlan.planId === 'unlimited' ? '✨ VIP Tài Trợ' : '✨ Được tài trợ'}
                                                                </span>
                                                            )}
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
                                                                Tình trạng: {product.status === 'available' ? 'Đang bán' : 'Đã bán'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="boosting-action">
                                                        <button 
                                                            className={`btn-boost-action ${isBoosted ? 'unboost' : 'boost'}`}
                                                            onClick={() => handleToggleBoost(product.id)}
                                                            disabled={!isBoosted && activePlan.planId !== 'unlimited' && activePlan.boostsRemaining <= 0}
                                                        >
                                                            {isBoosted ? 'Hủy Boost' : 'Boost bài'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VipMember;
