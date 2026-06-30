// src/pages/AdminProduct.jsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, CheckCircle, Search } from 'lucide-react';
import './Admin.css';
// 1. THÊM DÒNG IMPORT NÀY VÀO:
import { supabase } from '../supabaseClient';

const AdminProduct = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10; // Số sản phẩm trên 1 trang

    // Nếu bạn có file cấu hình supabase (ví dụ: src/supabaseClient.js)
    // Nhớ import nó vào đầu file AdminProduct.jsx:
    // import { supabase } from '../supabaseClient'; 

    const fetchProducts = async (currentPage) => {
        setLoading(true);
        try {
            // Lấy session hiện tại từ Supabase
            // (Thay thế cho dòng const token = localStorage...)
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            const token = session?.access_token;

            if (!token) {
                console.error("Không tìm thấy token. Vui lòng đăng nhập lại!");
                alert("Vui lòng đăng nhập bằng tài khoản Admin!");
                setLoading(false);
                return; // Dừng luôn không gọi API nữa
            }

            const response = await fetch(`http://localhost:8080/api/products/admin?page=${currentPage}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                setProducts(result.content || []);
                setTotalPages(result.totalPages || 1);
            } else if (response.status === 403) {
                console.error("Lỗi 403: Backend từ chối token này.");
                alert("Tài khoản của bạn không có quyền Admin!");
            } else {
                console.error("Lỗi server:", response.status);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách sản phẩm:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(page);
    }, [page]);

    // Các Actions cơ bản
    const handleAdd = () => alert("Mở form/modal Thêm sản phẩm mới");
    const handleEdit = (id) => alert(`Mở form Sửa sản phẩm ID: ${id}`);
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xoá sản phẩm này?")) {
            try {
                const token = localStorage.getItem('access_token') || localStorage.getItem('token');
                const response = await fetch(`http://localhost:8080/api/admin/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    alert(`Đã xoá thành công sản phẩm ID: ${id}`);
                    fetchProducts(page); // Load lại data sau khi xoá
                } else {
                    alert("Có lỗi xảy ra khi xoá sản phẩm.");
                }
            } catch (error) {
                console.error("Lỗi xoá sản phẩm:", error);
            }
        }
    };

    return (
        <div className="reports-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Quản lý Danh sách Sản phẩm</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px' }}>
                        <Search size={18} color="#64748b" />
                        <input type="text" placeholder="Tìm sản phẩm..." style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '8px' }} />
                    </div>
                    <button
                        onClick={handleAdd}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    >
                        <Plus size={18} /> Thêm sản phẩm
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
            ) : (
                <table className="reports-table">
                    <thead>
                        <tr>
                            <th>SẢN PHẨM</th>
                            <th>GIÁ BÁN</th>
                            <th>NGƯỜI BÁN</th>
                            <th>TRẠNG THÁI</th>
                            <th>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Không có sản phẩm nào.</td>
                            </tr>
                        ) : (
                            products.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="report-detail" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <img
                                                src={item.imageUrl || 'https://via.placeholder.com/50'}
                                                alt={item.name}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{item.name}</p>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>ID: {item.id?.substring(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600', color: '#3b82f6' }}>
                                        {Number(item.price).toLocaleString('vi-VN')}đ
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <img
                                                src={item.sellerAvatar || 'https://via.placeholder.com/30'}
                                                alt="seller"
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{item.sellerName || 'Người dùng ẩn danh'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                            backgroundColor: item.status === 'available' ? '#dcfce7' : '#fef08a',
                                            color: item.status === 'available' ? '#166534' : '#854d0e'
                                        }}>
                                            {item.status === 'available' ? 'Đang bán' : item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <button onClick={() => handleEdit(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Sửa">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Xoá">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {/* Điều hướng Phân trang */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px 0' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                    Hiển thị trang {page} trên tổng số {totalPages} trang
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Trước
                    </button>
                    <button
                        disabled={page === totalPages || totalPages === 0}
                        onClick={() => setPage(page + 1)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#3b82f6', color: 'white', cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminProduct;