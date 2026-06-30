import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserSearchBar from '../components/UserSearchBar';
import { supabase } from '../supabaseClient';
import {
    ShoppingBag, MapPin, Clock, User, LogOut,
    MessageSquare, Package, ChevronRight, Heart, Share2,
    Shield, Star, Tag, AlertCircle, CheckCircle, MoreVertical, Image, DollarSign, X,
    TrendingUp, Eye, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../hooks/useWishlist';
import './ProductDetail.css';

const CONDITIONS_MAP = {
    'new': { label: 'Mới 100%', color: '#22c55e' },
    'like_new': { label: 'Như mới (99%)', color: '#6366f1' },
    'good': { label: 'Tốt', color: '#f59e0b' },
    'fair': { label: 'Trung bình', color: '#6b7280' },
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile, signOut, getAccessToken } = useAuth();
    const { isWishlisted, toggleWishlist, wishlistCount } = useWishlist();

    // -- State cho Sản phẩm --
    const [product, setProduct] = useState(null);
    const [seller, setSeller] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedSellers, setRelatedSellers] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [wishlistToast, setWishlistToast] = useState(null);
    const [copied, setCopied] = useState(false);

    // -- State cho Make Offer --
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    const [offerError, setOfferError] = useState('');
    const [offerLoading, setOfferLoading] = useState(false);

    // -- State cho Reviews (Bình luận & Đánh giá) --
    const [reviews, setReviews] = useState([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length).toFixed(1)
        : 0;
    const visualRating = Math.round(averageRating);
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editComment, setEditComment] = useState('');
    const [editRating, setEditRating] = useState(5);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null); // File được chọn
    const [previewUrl, setPreviewUrl] = useState(null);     // URL để xem trước ảnh
    const [isUploading, setIsUploading] = useState(false);  // Trạng thái upload
    const [editSelectedFile, setEditSelectedFile] = useState(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState(null);
    const [removeExistingMedia, setRemoveExistingMedia] = useState(false);

    // -- State cho Xác nhận giao dịch (Người bán) --
    const [buyerSearchTerm, setBuyerSearchTerm] = useState(''); // Chứa nội dung text đang gõ
    const [buyerSuggestions, setBuyerSuggestions] = useState([]); // Chứa danh sách gợi ý
    const [selectedBuyer, setSelectedBuyer] = useState(null); // Chứa user đã được chọn
    const [showSuggestions, setShowSuggestions] = useState(false); // Ẩn/hiện khung Auto-complete
    const [isConfirmingSale, setIsConfirmingSale] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProduct();
            fetchReviews(); // Gọi thêm hàm lấy đánh giá khi load trang
        }
    }, [id]);

    // ==================== FETCH PRODUCT ====================
    const fetchProduct = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProduct(data);

            if (data.seller_id) {
                const { data: sellerData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, created_at')
                    .eq('id', data.seller_id)
                    .single();
                setSeller(sellerData);
            }

            if (data.category) {
                const { data: related } = await supabase
                    .from('products')
                    .select('*')
                    .eq('category', data.category)
                    .eq('status', 'available')
                    .neq('id', id)
                    .limit(4)
                    .order('created_at', { ascending: false });
                const relatedList = related || [];
                setRelatedProducts(relatedList);

                // Fetch seller profiles for related products
                if (relatedList.length > 0) {
                    const sellerIds = [...new Set(relatedList.map(r => r.seller_id).filter(Boolean))];
                    if (sellerIds.length > 0) {
                        const { data: sellersData } = await supabase
                            .from('profiles')
                            .select('id, full_name, avatar_url')
                            .in('id', sellerIds);
                        const map = {};
                        (sellersData || []).forEach(s => { map[s.id] = s; });
                        setRelatedSellers(map);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching product:', err);
        } finally {
            setLoading(false);
        }
    };

    // ==================== FETCH REVIEWS ====================
    const fetchReviews = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/reviews/product/${id}`);
            if (response.ok) {
                const reviewData = await response.json();

                if (!reviewData || reviewData.length === 0) {
                    setReviews([]);
                    return;
                }

                // 1. Lấy danh sách ID người dùng (không trùng lặp)
                const reviewerIds = [...new Set(reviewData.map(r => r.reviewer_id))];

                // 2. Gọi Supabase để lấy Tên và Avatar
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', reviewerIds);

                // 3. Ghép tên vào đánh giá
                const enrichedReviews = reviewData.map(review => {
                    const userProfile = profilesData?.find(p => p.id === review.reviewer_id);
                    return {
                        ...review,
                        reviewerName: userProfile?.full_name || 'Khách',
                        reviewerAvatar: userProfile?.avatar_url || null
                    };
                });

                setReviews(enrichedReviews);
            }
        } catch (error) {
            console.error('Lỗi khi tải đánh giá:', error);
        }
    };

    // ==================== SUBMIT REVIEW ====================
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!user) {
            setReviewError("Bạn cần đăng nhập để đánh giá.");
            return;
        }

        if (!newComment.trim() && !selectedFile) {
            setReviewError("Vui lòng nhập nội dung hoặc hình ảnh đánh giá.");
            return;
        }

        setIsSubmittingReview(true);
        setIsUploading(true);
        setReviewError('');

        try {
            let mediaUrlToSave = null;

            // Nếu có chọn file thì upload trước
            if (selectedFile) {
                mediaUrlToSave = await uploadImage(selectedFile);
            }

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('http://localhost:8080/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: id,
                    rating: newRating,
                    comment: newComment,
                    mediaUrl: mediaUrlToSave // Gửi kèm URL ảnh
                })
            });

            if (response.ok) {
                const newRev = await response.json();
                newRev.reviewerName = profile?.full_name || user?.email?.split('@')[0];
                newRev.reviewerAvatar = profile?.avatar_url;

                // Đảm bảo review mới cũng có ảnh hiển thị ngay
                if (mediaUrlToSave) {
                    newRev.media_url = mediaUrlToSave;
                }

                setReviews([newRev, ...reviews]);

                if (newRev.warning) {
                    alert("⚠️ Cảnh báo: Bình luận của bạn chứa từ khóa không phù hợp và hệ thống đã ghi nhận 1 lần cảnh cáo. Vui lòng giữ lịch sự khi giao tiếp!");
                }

                // Reset form
                setNewComment('');
                setNewRating(5);
                setSelectedFile(null);
                setPreviewUrl(null);
            } else {
                const errorMsg = await response.text();
                setReviewError(errorMsg || "Lỗi khi gửi đánh giá.");
            }
        } catch (error) {
            console.error('Lỗi submit đánh giá:', error);
            setReviewError(error.message || "Không thể kết nối đến máy chủ.");
        } finally {
            setIsSubmittingReview(false);
            setIsUploading(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                setReviews(reviews.filter(r => r.id !== reviewId));
            } else {
                alert("Lỗi khi xóa đánh giá");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Hàm chọn ảnh khi đang ở chế độ Sửa
    const handleEditFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setEditSelectedFile(file);
        setEditPreviewUrl(URL.createObjectURL(file));
        setRemoveExistingMedia(false); // Nếu chọn ảnh mới thì hủy lệnh xóa ảnh cũ
    };

    // Hàm lưu chỉnh sửa
    const submitEditReview = async (reviewId, existingMediaUrl) => {
        try {
            let finalMediaUrl = existingMediaUrl;

            // Nếu người dùng bấm xóa ảnh cũ
            if (removeExistingMedia) {
                finalMediaUrl = null;
            }

            // Nếu người dùng chọn ảnh mới
            if (editSelectedFile) {
                finalMediaUrl = await uploadImage(editSelectedFile); // Tái sử dụng hàm uploadImage cũ
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    rating: editRating,
                    comment: editComment,
                    productId: id,
                    mediaUrl: finalMediaUrl // Gửi link ảnh cuối cùng xuống Backend
                })
            });

            if (response.ok) {
                const updatedRev = await response.json();
                // Cập nhật lại giao diện ngay lập tức
                setReviews(reviews.map(r => r.id === reviewId ? {
                    ...updatedRev,
                    reviewerName: r.reviewerName,
                    reviewerAvatar: r.reviewerAvatar,
                    media_url: finalMediaUrl
                } : r));
                setEditingReviewId(null);

                if (updatedRev.warning) {
                    alert("⚠️ Cảnh báo: Bình luận của bạn chứa từ khóa không phù hợp và hệ thống đã ghi nhận 1 lần cảnh cáo. Vui lòng giữ lịch sự khi giao tiếp!");
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Kiểm tra dung lượng (ví dụ: giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setReviewError("Kích thước file không được vượt quá 5MB.");
            return;
        }

        setSelectedFile(file);
        // Tạo URL tạm thời để hiển thị ngay lập tức
        setPreviewUrl(URL.createObjectURL(file));
        setReviewError('');
    };

    const uploadImage = async (file) => {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        // Tạo tên file duy nhất để tránh trùng lặp
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `reviews/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('review-media') // Tên bucket bạn đã tạo ở Bước 1
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Lấy URL public của ảnh vừa upload
            const { data: { publicUrl } } = supabase.storage
                .from('review-media')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Lỗi upload ảnh:', error);
            throw new Error('Không thể tải ảnh lên.');
        }
    };

    // ==================== HELPERS ====================
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 0) return 'Vừa xong';

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
    };

    const handleChatWithSeller = async () => {
        if (!user || !seller || seller.id === user.id) return;
        try {
            const response = await fetch(`http://localhost:8080/api/chat/conversations/get-or-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user1_id: user.id, user2_id: seller.id })
            });
            if (response.ok) navigate('/chat');
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    const handleMakeOffer = () => {
        if (!user) { alert('Vui lòng đăng nhập để đề xuất giá!'); return; }
        if (!seller || seller.id === user.id) return;
        setOfferPrice(Math.round(product.price * 0.9).toString()); // Gợi ý 90% giá gốc
        setOfferError('');
        setShowOfferModal(true);
    };

    const handleSubmitOffer = async () => {
        const priceNum = Number(offerPrice);
        if (!offerPrice || isNaN(priceNum) || priceNum <= 0) {
            setOfferError('Vui lòng nhập giá hợp lệ!');
            return;
        }
        if (priceNum >= product.price) {
            setOfferError('Giá đề xuất phải thấp hơn giá gốc!');
            return;
        }

        setOfferLoading(true);
        try {
            // 1. Get or create conversation
            const convRes = await fetch('http://localhost:8080/api/chat/conversations/get-or-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user1_id: user.id, user2_id: seller.id })
            });
            if (!convRes.ok) throw new Error('Không thể tạo cuộc trò chuyện');
            const conversation = await convRes.json();

            // 2. Create price offer record
            const offerRes = await fetch('http://localhost:8080/api/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: product.id,
                    conversation_id: conversation.id,
                    buyer_id: user.id,
                    seller_id: seller.id,
                    original_price: product.price,
                    offer_price: priceNum
                })
            });
            if (!offerRes.ok) throw new Error('Không thể tạo offer');

            // 3. Gửi tin nhắn mẫu vào cuộc trò chuyện
            const formatVND = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
            const offerMessage = `💰 Đề xuất giá cho "${product.name}"\nGiá gốc: ${formatVND(product.price)}\nGiá đề xuất: ${formatVND(priceNum)}\n\nBạn có đồng ý không?`;

            await fetch('http://localhost:8080/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversation.id,
                    sender_id: user.id,
                    content: offerMessage,
                    message_type: 'offer'
                })
            });

            setShowOfferModal(false);
            navigate('/chat');
        } catch (err) {
            setOfferError(err.message);
        } finally {
            setOfferLoading(false);
        }
    };

    const handleToggleSoldStatus = async () => {
        if (!user || !product || product.seller_id !== user.id) return;

        try {
            const token = await getAccessToken();
            const response = await fetch(`http://localhost:8080/api/products/${product.id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                setProduct(updatedProduct);
            } else {
                const error = await response.json();
                alert(error.error || 'Không thể cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Error toggling sold status:', error);
            alert('Lỗi kết nối server');
        }
    };

    const handleToggleWishlist = async () => {
        if (!user) {
            setWishlistToast({ msg: 'Vui lòng đăng nhập để yêu thích!', type: 'error' });
            setTimeout(() => setWishlistToast(null), 2500);
            return;
        }
        const result = await toggleWishlist(id);
        if (result.success) {
            setWishlistToast({
                msg: result.added ? '❤️ Đã thêm vào yêu thích!' : '💔 Đã xóa khỏi yêu thích!',
                type: result.added ? 'success' : 'info'
            });
            setTimeout(() => setWishlistToast(null), 2000);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ==================== XỬ LÝ XÁC NHẬN BÁN HÀNG CỦA SELLER ====================
    // Hàm gọi Supabase để tìm user theo tên mỗi khi gõ phím
    const handleSearchBuyerChange = async (e) => {
        const val = e.target.value;
        setBuyerSearchTerm(val);
        setSelectedBuyer(null); // Reset người đã chọn nếu gõ lại tên khác

        if (!val.trim()) {
            setBuyerSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            // Tìm kiếm trong bảng profiles (không phân biệt hoa thường)
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .ilike('full_name', `%${val}%`)
                .limit(5); // Lấy tối đa 5 người

            if (!error && data) {
                setBuyerSuggestions(data);
                setShowSuggestions(true);
            }
        } catch (err) {
            console.error("Lỗi tìm kiếm người dùng", err);
        }
    };

    // Hàm khi click chọn 1 người từ danh sách gợi ý
    const handleSelectBuyer = (buyer) => {
        setSelectedBuyer(buyer);
        setBuyerSearchTerm(buyer.full_name); // Đẩy tên lên ô input
        setShowSuggestions(false); // Đóng menu
    };
    // ==================== XỬ LÝ XÁC NHẬN BÁN HÀNG CỦA SELLER ====================
    const handleSellerConfirmSale = async () => {
        if (!selectedBuyer || !selectedBuyer.id) {
            alert("Vui lòng chọn người mua từ danh sách gợi ý!");
            return;
        }

        if (!window.confirm(`Xác nhận tạo hóa đơn và gửi tin nhắn cho "${selectedBuyer.full_name}"?`)) return;

        setIsConfirmingSale(true);
        try {
            const token = await getAccessToken();

            // Bước 1: Gọi API tạo Lịch sử mua hàng cho người mua
            const orderRes = await fetch(`http://localhost:8080/api/orders/seller-confirm/${product.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ buyerId: selectedBuyer.id }) // Gửi ID ngầm
            });

            if (!orderRes.ok) {
                const errText = await orderRes.text();
                throw new Error(errText);
            }

            // Bước 2: Tự động gửi tin nhắn cho người mua qua Chat
            const convRes = await fetch('http://localhost:8080/api/chat/conversations/get-or-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user1_id: user.id, user2_id: selectedBuyer.id })
            });

            if (convRes.ok) {
                const conversation = await convRes.json();
                const formatVND = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

                const msgContent = `🎉 XÁC NHẬN GIAO DỊCH THÀNH CÔNG!\n\nSản phẩm: "${product.name}"\nSố tiền: ${formatVND(product.price)}\n\nCảm ơn bạn đã mua hàng. Hóa đơn đã được lưu vào Lịch sử mua hàng của bạn!`;

                await fetch('http://localhost:8080/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversation_id: conversation.id,
                        sender_id: user.id,
                        content: msgContent,
                        message_type: 'system'
                    })
                });
            }

            alert("Giao dịch hoàn tất! Đã lưu hóa đơn và gửi tin nhắn cho người mua.");
            // Reset form
            setBuyerSearchTerm('');
            setSelectedBuyer(null);
        } catch (error) {
            console.error("Lỗi xác nhận:", error);
            alert("Lỗi: " + error.message);
        } finally {
            setIsConfirmingSale(false);
        }
    };

    const images = product?.image_url ? [product.image_url] : [];

    if (loading) {
        return (
            <div className="detail-page">
                <div className="bg-mesh"></div>
                <div className="detail-loading">
                    <div className="loading-spinner" />
                    <p>Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="detail-page">
                <div className="bg-mesh"></div>
                <div className="detail-not-found">
                    <AlertCircle size={56} strokeWidth={1.2} />
                    <h2>Không tìm thấy sản phẩm</h2>
                    <p>Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng.</p>
                    <Link to="/shop" className="btn-primary">Quay lại cửa hàng</Link>
                </div>
            </div>
        );
    }

    const conditionInfo = CONDITIONS_MAP[product.condition] || { label: product.condition, color: '#6b7280' };

    return (
        <div className="detail-page">
            <div className="bg-mesh"></div>

            {/* Make Offer Modal */}
            <AnimatePresence>
                {showOfferModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="offer-modal-overlay"
                        onClick={() => setShowOfferModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 30 }}
                            className="offer-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="offer-modal-header">
                                <h2><DollarSign size={22} /> Đề xuất giá</h2>
                                <button className="offer-modal-close" onClick={() => setShowOfferModal(false)}><X size={22} /></button>
                            </div>
                            <div className="offer-modal-body">
                                <div className="offer-product-info">
                                    <span className="offer-product-name">{product.name}</span>
                                    <span className="offer-original-price">Giá gốc: {formatPrice(product.price)}</span>
                                </div>
                                <div className="offer-input-group">
                                    <label>Giá bạn muốn đề xuất (₫)</label>
                                    <input
                                        type="number"
                                        value={offerPrice}
                                        onChange={e => { setOfferPrice(e.target.value); setOfferError(''); }}
                                        placeholder="Nhập giá đề xuất..."
                                        min="1000"
                                        max={product.price - 1}
                                    />
                                    {offerError && <p className="offer-error">{offerError}</p>}
                                    {offerPrice && !isNaN(Number(offerPrice)) && Number(offerPrice) > 0 && (
                                        <p className="offer-discount-hint">
                                            Tiết kiệm: {formatPrice(product.price - Number(offerPrice))} ({Math.round((1 - Number(offerPrice)/product.price)*100)}%)
                                        </p>
                                    )}
                                </div>
                                <p className="offer-note">💬 Đề xuất sẽ được gửi qua tin nhắn đến người bán. Sau khi cả hai bên đồng ý, giá sản phẩm sẽ được cập nhật.</p>
                            </div>
                            <div className="offer-modal-footer">
                                <button className="offer-btn-cancel" onClick={() => setShowOfferModal(false)}>Hủy</button>
                                <button className="offer-btn-submit" onClick={handleSubmitOffer} disabled={offerLoading}>
                                    {offerLoading ? 'Đang gửi...' : '🚀 Gửi đề xuất'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navbar */}
            <nav className="navbar">
                <Link to="/home" className="logo" style={{ textDecoration: 'none' }}>
                    <div className="logo-icon">
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <span>Student<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                </Link>

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

            {/* Breadcrumb */}
            <div className="detail-breadcrumb">
                <Link to="/home">Trang chủ</Link>
                <ChevronRight size={14} />
                <Link to="/shop">Bộ sưu tập</Link>
                <ChevronRight size={14} />
                {product.category && (
                    <>
                        <Link to={`/shop?category=${product.category}`}>{product.category}</Link>
                        <ChevronRight size={14} />
                    </>
                )}
                <span className="breadcrumb-current">{product.name}</span>
            </div>

            {/* Main Content */}
            <div className="detail-content">
                {/* Left: Image Gallery */}
                <motion.div className="detail-gallery" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="gallery-main">
                        {images.length > 0 ? (
                            <img src={images[selectedImageIndex]} alt={product.name} className="gallery-main-image" />
                        ) : (
                            <div className="gallery-placeholder">
                                <Package size={80} strokeWidth={1} />
                                <span>Chưa có hình ảnh</span>
                            </div>
                        )}
                        <motion.button
                            className={`fav-btn ${isWishlisted(id) ? 'active' : ''}`}
                            onClick={handleToggleWishlist}
                            whileTap={{ scale: 0.85 }}
                            title={isWishlisted(id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                        >
                            <Heart size={22} fill={isWishlisted(id) ? '#ef4444' : 'none'} color={isWishlisted(id) ? '#ef4444' : 'currentColor'} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Right: Product Info */}
                <motion.div className="detail-info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="detail-status-row">
                        {product.status === 'sold' ? (
                            <span className="detail-status-badge sold" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                                <AlertCircle size={14} /> Đã bán
                            </span>
                        ) : (
                            <span className="detail-status-badge available"><CheckCircle size={14} /> Đang bán</span>
                        )}
                        <span className="detail-posted"><Clock size={14} /> Đăng {formatTimeAgo(product.created_at)}</span>
                    </div>

                    <h1 className="detail-title">{product.name}</h1>

                    {product.location && (
                        <div className="detail-location"><MapPin size={16} /><span>{product.location}</span></div>
                    )}

                    <div className="detail-price-block">
                        <span className="detail-price">{formatPrice(product.price)}</span>
                    </div>

                    <div className="detail-actions">
                        {user && seller && seller.id === user.id ? (
                            <button
                                className={`btn-toggle-sold ${product.status === 'sold' ? 'is-sold' : ''}`}
                                onClick={handleToggleSoldStatus}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.6rem',
                                    padding: '0.9rem 1.5rem',
                                    background: product.status === 'sold' ? '#22c55e' : '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontSize: '0.95rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {product.status === 'sold' ? (
                                    <> <CheckCircle size={20} /> Đánh dấu còn hàng </>
                                ) : (
                                    <> <Package size={20} /> Đánh dấu đã bán </>
                                )}
                            </button>
                        ) : (
                            <button className="btn-chat-seller" onClick={handleChatWithSeller}>
                                <MessageSquare size={20} /> Chat với người bán
                            </button>
                        )}
                        {/* Nút Yêu thích - bên trái nút Chia sẻ */}
                        <motion.button
                            className={`btn-wishlist-detail ${isWishlisted(id) ? 'active' : ''}`}
                            onClick={handleToggleWishlist}
                            whileTap={{ scale: 0.9 }}
                            title={isWishlisted(id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                        >
                            <Heart
                                size={20}
                                fill={isWishlisted(id) ? '#ef4444' : 'none'}
                                color={isWishlisted(id) ? '#ef4444' : 'currentColor'}
                            />
                        </motion.button>
                        <button className="btn-share-link" onClick={handleCopyLink}>
                            {copied ? <><CheckCircle size={18} /> Đã sao chép!</> : <><Share2 size={18} /> Chia sẻ</>}
                        </button>
                    </div>
                    {/* Make Offer button - chỉ hiện nếu không phải seller */}
                    {user && seller && seller.id !== user.id && (
                        <button className="btn-make-offer" onClick={handleMakeOffer}>
                            <DollarSign size={20} /> Đề xuất giá
                        </button>
                    )}

                    {/* KHU VỰC XÁC NHẬN NGƯỜI MUA (CHỈ DÀNH CHO NGƯỜI BÁN) */}
                    {product.status === 'sold' && user && seller && user.id === seller.id && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                marginTop: '1.5rem',
                                padding: '1.25rem',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '16px',
                                border: '1px solid #dcfce7',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.06)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                                <div style={{ padding: '6px', backgroundColor: '#bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={18} color="#16a34a" />
                                </div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#14532d' }}>
                                    Hoàn tất đơn hàng
                                </h4>
                            </div>

                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#166534', lineHeight: '1.5' }}>
                                Để sản phẩm được ghi nhận vào lịch sử của người mua, vui lòng copy ID của họ (trong phần Chat) và dán vào đây:
                            </p>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {/* Ô Auto-complete */}
                                <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                                    <input
                                        type="text"
                                        value={buyerSearchTerm}
                                        onChange={handleSearchBuyerChange}
                                        placeholder="Gõ tên người mua để tìm kiếm..."
                                        style={{
                                            width: '100%', padding: '0.75rem', boxSizing: 'border-box',
                                            borderRadius: '10px', border: '1px solid #a7f3d0',
                                            outline: 'none', color: '#064e3b', backgroundColor: '#ffffff'
                                        }}
                                    />

                                    {/* Khung Dropdown gợi ý người dùng */}
                                    {showSuggestions && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                                            backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden'
                                        }}>
                                            {buyerSuggestions.length > 0 ? (
                                                buyerSuggestions.map(b => (
                                                    <div
                                                        key={b.id}
                                                        onClick={() => handleSelectBuyer(b)}
                                                        style={{
                                                            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px',
                                                            cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                                    >
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {b.avatar_url ? <img src={b.avatar_url} alt="avt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} color="#9ca3af" />}
                                                        </div>
                                                        <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '600' }}>{b.full_name || 'Người dùng ẩn danh'}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
                                                    Không tìm thấy người dùng phù hợp.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSellerConfirmSale}
                                    disabled={isConfirmingSale}
                                    style={{
                                        padding: '0.75rem 1.25rem', backgroundColor: '#10b981', color: 'white',
                                        border: 'none', borderRadius: '10px', cursor: 'pointer',
                                        fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px',
                                        opacity: isConfirmingSale ? 0.7 : 1
                                    }}
                                >
                                    <CheckCircle size={18} /> {isConfirmingSale ? 'Đang xử lý...' : 'Xác nhận'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {seller && (
                        <div className="detail-seller-card">
                            <div className="seller-card-header"><h3>Thông tin người bán</h3></div>
                            <div className="seller-card-body">
                                <div className="seller-card-avatar">
                                    {seller.avatar_url ? <img src={seller.avatar_url} alt="" /> : <User size={24} />}
                                </div>
                                <div className="seller-card-info">
                                    <span className="seller-card-name">{seller.full_name || 'Người bán'}</span>
                                    <span className="seller-card-since">Tham gia từ {formatDate(seller.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="detail-specs">
                        <h3 className="specs-title">Chi tiết sản phẩm</h3>
                        <div className="specs-grid">
                            {product.condition && (
                                <div className="spec-item">
                                    <span className="spec-label">Tình trạng</span>
                                    <span className="spec-value" style={{ color: conditionInfo.color, fontWeight: 600 }}>{conditionInfo.label}</span>
                                </div>
                            )}
                            {product.category && (
                                <div className="spec-item"><span className="spec-label">Danh mục</span><span className="spec-value"><Tag size={14} /> {product.category}</span></div>
                            )}
                        </div>
                    </div>

                    {product.description && (
                        <div className="detail-description">
                            <h3 className="desc-title">Mô tả sản phẩm</h3>
                            <div className="desc-content">
                                {product.description.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                        </div>
                    )}

                    <div className="detail-safety">
                        <Shield size={18} />
                        <div><strong>Mẹo an toàn:</strong><span> Hẹn gặp ở nơi công cộng, kiểm tra hàng trước khi thanh toán.</span></div>
                    </div>
                </motion.div>
            </div>

            {/* ==================== REVIEWS SECTION (GIAO DIỆN NỀN SÁNG) ==================== */}
            <section className="detail-reviews" style={{
                maxWidth: '1200px', margin: '3rem auto', padding: '2rem',
                backgroundColor: '#ffffff', // Nền trắng tinh
                borderRadius: '24px',
                border: '1px solid #e5e7eb', // Viền xám nhạt
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' // Bóng đổ nhẹ tạo chiều sâu
            }}>
                {/* Tiêu đề & Tổng quan đánh giá */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#111827', margin: 0, fontWeight: '700' }}>
                        Đánh giá & Bình luận ({reviews.length})
                    </h2>

                    {reviews.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#d97706' }}>
                    {averageRating}
                </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={20}
                                        fill={visualRating >= star ? '#f59e0b' : 'transparent'}
                                        color={visualRating >= star ? '#f59e0b' : '#d1d5db'} // Sao trống màu xám nhạt
                                    />
                                ))}
                            </div>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem', marginLeft: '4px' }}>
                    trên 5
                </span>
                        </div>
                    )}
                </div>

                {/* Khung nhập đánh giá */}
                <div style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    {user ? (
                        <form onSubmit={handleSubmitReview}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <span style={{ color: '#4b5563', fontWeight: '500' }}>Chất lượng sản phẩm:</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={28}
                                            fill={(hoverRating || newRating) >= star ? '#f59e0b' : 'transparent'}
                                            color={(hoverRating || newRating) >= star ? '#f59e0b' : '#d1d5db'}
                                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setNewRating(star)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div style={{ width: '100%', marginBottom: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé..."
                            rows="4"
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px',
                                backgroundColor: '#f9fafb', // Nền ô nhập xám rất nhạt
                                border: '1px solid #d1d5db',
                                color: '#111827', // Chữ đen
                                outline: 'none', resize: 'vertical',
                                fontSize: '0.95rem'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        />

                                    {/* Nút chọn ảnh */}
                                    <label
                                        style={{
                                            position: 'absolute', bottom: '12px', right: '12px',
                                            cursor: 'pointer', color: '#6b7280', padding: '6px',
                                            backgroundColor: 'white', borderRadius: '8px',
                                            border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                                        }}
                                        title="Đính kèm hình ảnh"
                                    >
                                        <Image size={18} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>

                                {/* Hiển thị ảnh xem trước */}
                                {previewUrl && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #e5e7eb' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                                style={{
                                                    position: 'absolute', top: '-8px', right: '-8px',
                                                    background: '#ef4444', color: 'white', border: 'none',
                                                    borderRadius: '50%', width: '24px', height: '24px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {reviewError && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '500' }}>{reviewError}</p>}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReview || (!newComment.trim() && !selectedFile)}
                                    style={{
                                        padding: '0.75rem 2rem', backgroundColor: 'var(--primary)', color: 'white',
                                        border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                                        opacity: (isSubmittingReview || (!newComment.trim() && !selectedFile)) ? 0.5 : 1,
                                        boxShadow: '0 4px 6px -1px rgba(var(--primary-rgb), 0.2)'
                                    }}
                                >
                                    {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'center', border: '1px dashed #d1d5db' }}>
                            <p style={{ color: '#4b5563', margin: 0 }}>Vui lòng <Link to="/auth" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>đăng nhập</Link> để để lại đánh giá của bạn.</p>
                        </div>
                    )}
                </div>

                {/* Danh sách đánh giá */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {reviews.length > 0 ? (
                        reviews.map((rev) => (
                            <div key={rev.id || Math.random()} style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>

                                {/* Header đánh giá */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                            {rev.reviewerAvatar ? (
                                                <img src={rev.reviewerAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={22} color="#9ca3af" />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>{rev.reviewerName}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>• {formatTimeAgo(rev.created_at)}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} size={14} fill={rev.rating >= star ? '#f59e0b' : 'transparent'} color={rev.rating >= star ? '#f59e0b' : '#d1d5db'} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu 3 chấm (Chỉ chủ nhân) */}
                                    {user?.id === rev.reviewer_id && (
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={() => setOpenDropdownId(openDropdownId === rev.id ? null : rev.id)}
                                                style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {/* Dropdown Nền Sáng */}
                                            {openDropdownId === rev.id && (
                                                <div style={{
                                                    position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                                                    backgroundColor: '#ffffff', borderRadius: '8px', padding: '4px',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                                                    zIndex: 10, minWidth: '140px', border: '1px solid #e5e7eb'
                                                }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingReviewId(rev.id);
                                                            setEditComment(rev.comment);
                                                            setEditRating(rev.rating);
                                                            setEditSelectedFile(null);
                                                            setEditPreviewUrl(null);
                                                            setRemoveExistingMedia(false);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#374151', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '6px', fontWeight: '500' }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                    >
                                                        Chỉnh sửa
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleDeleteReview(rev.id);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '6px', fontWeight: '500' }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                    >
                                                        Xóa đánh giá
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Nội dung đánh giá */}
                                {editingReviewId === rev.id ? (
                                    <div style={{ marginTop: '12px', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                        <div style={{ position: 'relative' }}>
                                <textarea
                                    value={editComment}
                                    onChange={(e) => setEditComment(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', backgroundColor: '#ffffff', color: '#111827', border: '1px solid #d1d5db', outline: 'none', resize: 'vertical' }}
                                    rows="3"
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                                            <label style={{ position: 'absolute', bottom: '12px', right: '12px', cursor: 'pointer', color: '#6b7280', padding: '6px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                <Image size={18} />
                                                <input type="file" accept="image/*" onChange={handleEditFileChange} style={{ display: 'none' }} />
                                            </label>
                                        </div>

                                        {/* Hiển thị ảnh cũ / ảnh mới khi sửa */}
                                        {rev.media_url && !removeExistingMedia && !editPreviewUrl && (
                                            <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Ảnh đính kèm hiện tại:</span>
                                                <img src={rev.media_url} alt="attached" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', opacity: 0.8 }} />
                                                <button onClick={() => setRemoveExistingMedia(true)} style={{ position: 'absolute', top: '24px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
                                            </div>
                                        )}

                                        {editPreviewUrl && (
                                            <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Ảnh mới thay thế:</span>
                                                <img src={editPreviewUrl} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--primary)' }} />
                                                <button onClick={() => { setEditSelectedFile(null); setEditPreviewUrl(null); }} style={{ position: 'absolute', top: '24px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '12px', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setEditingReviewId(null)} style={{ padding: '0.5rem 1.25rem', background: '#ffffff', color: '#374151', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
                                            <button onClick={() => submitEditReview(rev.id, rev.media_url)} style={{ padding: '0.5rem 1.25rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Lưu thay đổi</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '4px' }}>
                                        {rev.comment && (
                                            <p style={{ color: '#374151', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>{rev.comment}</p>
                                        )}

                                        {rev.media_url && (
                                            <div style={{ marginTop: '16px' }}>
                                                <img
                                                    src={rev.media_url}
                                                    alt="Review attachment"
                                                    style={{
                                                        maxWidth: '100%', maxHeight: '320px', objectFit: 'contain',
                                                        borderRadius: '12px', border: '1px solid #f3f4f6'
                                                    }}
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px dashed #d1d5db' }}>
                            <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 0 }}>Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét về sản phẩm này!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Related Products - Sản phẩm liên quan */}
            <section className="detail-related">
                <div className="related-header">
                    <div className="related-title-group">
                        <div className="related-title-icon">
                            <TrendingUp size={20} color="white" />
                        </div>
                        <div>
                            <h2>Sản phẩm liên quan</h2>
                            <p>Cùng danh mục &ldquo;{product?.category}&rdquo;</p>
                        </div>
                    </div>
                    <Link to={`/shop?category=${encodeURIComponent(product?.category || '')}`} className="related-view-all">
                        Xem tất cả <ArrowRight size={16} />
                    </Link>
                </div>

                {relatedProducts.length === 0 ? (
                    <div className="related-empty">
                        <Package size={40} strokeWidth={1.2} />
                        <p>Chưa có sản phẩm liên quan nào trong danh mục này.</p>
                        <Link to="/shop" className="related-browse-btn">
                            Khám phá sản phẩm khác
                        </Link>
                    </div>
                ) : (
                    <div className="related-grid">
                        {relatedProducts.map((rp, i) => {
                            const rpSeller = relatedSellers[rp.seller_id];
                            const condition = CONDITIONS_MAP[rp.condition];
                            const favorited = isWishlisted(rp.id);
                            return (
                                <motion.div
                                    key={rp.id}
                                    className="related-card"
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    onClick={() => navigate(`/product/${rp.id}`)}
                                >
                                    {/* Ảnh sản phẩm */}
                                    <div className="related-card-image">
                                        {rp.image_url ? (
                                            <img src={rp.image_url} alt={rp.name} loading="lazy" />
                                        ) : (
                                            <div className="related-card-placeholder">
                                                <Package size={36} strokeWidth={1} />
                                            </div>
                                        )}

                                        {/* Condition badge */}
                                        {condition && (
                                            <span
                                                className="related-condition-badge"
                                                style={{ background: condition.color }}
                                            >
                                                {condition.label}
                                            </span>
                                        )}

                                        {/* Wishlist button */}
                                        <motion.button
                                            className={`related-heart-btn ${favorited ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!user) return;
                                                toggleWishlist(rp.id);
                                            }}
                                            whileTap={{ scale: 0.85 }}
                                            title={favorited ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                        >
                                            <Heart
                                                size={15}
                                                fill={favorited ? '#ef4444' : 'none'}
                                                color={favorited ? '#ef4444' : 'white'}
                                            />
                                        </motion.button>

                                        {/* Hover overlay */}
                                        <div className="related-card-overlay">
                                            <Eye size={18} />
                                            <span>Xem chi tiết</span>
                                        </div>
                                    </div>

                                    {/* Thông tin sản phẩm */}
                                    <div className="related-card-body">
                                        <h4 className="related-card-title">{rp.name}</h4>

                                        <div className="related-card-price">
                                            {formatPrice(rp.price)}
                                        </div>

                                        <div className="related-card-footer">
                                            {rp.location && (
                                                <span className="related-card-location">
                                                    <MapPin size={12} />
                                                    {rp.location}
                                                </span>
                                            )}
                                            {rpSeller && (
                                                <span className="related-card-seller">
                                                    {rpSeller.avatar_url ? (
                                                        <img src={rpSeller.avatar_url} alt={rpSeller.full_name} />
                                                    ) : (
                                                        <User size={11} />
                                                    )}
                                                    {rpSeller.full_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="shop-footer">
                <div className="shop-footer-content">
                    <div className="footer-brand">
                        <div className="logo" style={{ marginBottom: '0.75rem' }}>
                            <div className="logo-icon" style={{ width: '32px', height: '32px' }}><ShoppingBag size={18} color="white" /></div>
                            <span style={{ fontSize: '1.1rem' }}>Student<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                        </div>
                        <p>Nền tảng trao đổi và mua bán vật dụng dành cho cộng đồng sinh viên Việt Nam.</p>
                    </div>
                </div>
            </footer>

            {/* Toast thông báo Wishlist */}
            <AnimatePresence>
                {wishlistToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 40, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: wishlistToast.type === 'error'
                                ? 'rgba(239, 68, 68, 0.92)'
                                : wishlistToast.type === 'success'
                                    ? 'rgba(34, 197, 94, 0.92)'
                                    : 'rgba(99, 102, 241, 0.92)',
                            backdropFilter: 'blur(12px)',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '50px',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            zIndex: 9999,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {wishlistToast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetail;