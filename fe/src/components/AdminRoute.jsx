import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, userRole, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Đang kiểm tra quyền truy cập...
            </div>
        );
    }

    // Nếu chưa đăng nhập -> Đẩy về trang đăng nhập (Auth)
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Nếu đã đăng nhập nhưng KHÔNG phải admin -> Đẩy về trang chủ
    if (userRole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // Hợp lệ -> Cho phép hiển thị giao diện Admin
    return children;
};

export default AdminRoute;