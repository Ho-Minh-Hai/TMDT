import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ProductDetailPage = ({ productId = 1 }) => {
    // --- State quản lý dữ liệu ---
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0); // Số sao user đang chọn
    const [hover, setHover] = useState(0);   // Hiệu ứng hover khi chọn sao
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Biến dùng để kích hoạt tải lại danh sách đánh giá sau khi submit thành công
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // --- Gọi API lấy danh sách đánh giá ---
    useEffect(() => {
        // Khai báo hàm fetch bên trong useEffect để tránh lỗi ESLint (Temporal Dead Zone & Cascading Renders)
        const loadReviews = async () => {
            try {
                // Gọi API GET của Spring Boot (Nhớ đổi cổng nếu Spring Boot không chạy ở 8080)
                const response = await fetch('http://localhost:8080/api/reviews/product/${productId}');
                if (response.ok) {
                    const data = await response.json();
                    setReviews(data);
                }
            } catch (err) {
                console.error("Lỗi khi tải đánh giá:", err);
            }
        };

        loadReviews();
    }, [productId, refreshTrigger]); // useEffect sẽ chạy lại khi productId hoặc refreshTrigger thay đổi

    // --- Xử lý gửi đánh giá mới (ĐÃ TÍCH HỢP SUPABASE AUTH) ---
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Vui lòng chọn số sao đánh giá!");
            return;
        }

        setIsSubmitting(true);
        setError('');

        // Payload gửi xuống Backend (Backend tự lấy UUID từ Token)
        const newReview = {
            productId: productId,
            transactionId: 9999, // ID giao dịch giả lập (sau này lấy từ CSDL giao dịch thực tế)
            rating: rating,
            comment: comment
        };

        try {
            // 1. Lấy Access Token từ phiên đăng nhập Supabase Auth
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                setError("Bạn cần đăng nhập để thực hiện đánh giá!");
                setIsSubmitting(false);
                return;
            }

            const accessToken = session.access_token;

            // 2. Gọi API POST xuống Spring Boot có kèm Token bảo mật
            const response = await fetch('http://localhost:8080/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}` // Kẹp token vào header
                },
                body: JSON.stringify(newReview),
            });

            if (response.ok) {
                // Đăng thành công -> Tăng trigger để useEffect tự động tải lại danh sách
                setRefreshTrigger(prev => prev + 1);

                // Reset form
                setRating(0);
                setComment('');
            } else {
                const errorText = await response.text();
                setError(errorText || "Có lỗi xảy ra khi gửi đánh giá.");
            }
        } catch (err) {
            setError("Không thể kết nối đến máy chủ Backend.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">

            {/* 1. KHU VỰC CHI TIẾT SẢN PHẨM */}
            <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center mb-12 border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">
                    [ Khu vực hiển thị thông tin, hình ảnh, giá cả của Sản Phẩm... ]
                </p>
            </div>

            <hr className="my-8 border-gray-200" />

            {/* 2. KHU VỰC RATING & COMMENT */}
            <div className="bg-white rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Đánh giá sản phẩm</h2>

                {/* --- Form Viết Đánh Giá --- */}
                <div className="mb-10 bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <h3 className="font-semibold mb-4 text-gray-700">Viết đánh giá của bạn</h3>

                    {error && <div className="text-red-500 mb-4 text-sm font-medium">{error}</div>}

                    <form onSubmit={handleSubmitReview}>
                        {/* Chọn Sao */}
                        <div className="flex items-center mb-4">
                            <span className="mr-3 text-gray-600 font-medium">Chất lượng:</span>
                            {[...Array(5)].map((_, index) => {
                                index += 1;
                                return (
                                    <button
                                        type="button"
                                        key={index}
                                        className={`text-2xl cursor-pointer outline-none transition-colors duration-150 ${
                                            index <= (hover || rating) ? "text-yellow-400" : "text-gray-300"
                                        }`}
                                        onClick={() => setRating(index)}
                                        onMouseEnter={() => setHover(index)}
                                        onMouseLeave={() => setHover(rating)}
                                    >
                                        ★
                                    </button>
                                );
                            })}
                        </div>

                        {/* Khung nhập Comment */}
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows="4"
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>

                        {/* Nút Submit */}
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-150 disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- Danh Sách Các Đánh Giá Cũ --- */}
                <div>
                    <h3 className="text-xl font-bold mb-6 text-gray-800">
                        Khách hàng nói gì ({reviews.length})
                    </h3>

                    {reviews.length === 0 ? (
                        <p className="text-gray-500 italic bg-gray-50 p-4 rounded-md">Chưa có đánh giá nào cho sản phẩm này.</p>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((rev) => (
                                <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                                    <div className="flex items-center justify-between mb-2">
                                        {/* ID của Supabase là chuỗi UUID dài, ta cắt ngắn 8 ký tự đầu để hiển thị */}
                                        <span className="font-semibold text-gray-800">
                      Khách hàng: {rev.reviewerId ? rev.reviewerId.substring(0, 8) + '...' : 'Ẩn danh'}
                    </span>
                                        <span className="text-sm text-gray-500">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                    </span>
                                    </div>

                                    {/* Hiển thị số sao của comment này */}
                                    <div className="flex mb-2">
                                        {[...Array(5)].map((_, index) => (
                                            <span key={index} className={`text-lg ${index < rev.rating ? "text-yellow-400" : "text-gray-300"}`}>
                        ★
                      </span>
                                        ))}
                                    </div>

                                    {/* Nội dung comment */}
                                    <p className="text-gray-700 leading-relaxed">
                                        {rev.comment || <span className="italic text-gray-400">Người dùng không để lại bình luận chữ.</span>}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProductDetailPage;