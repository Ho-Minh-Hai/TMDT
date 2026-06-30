import React, { useState, useEffect } from 'react';
import { Lock, Unlock, UserCircle, ShieldAlert, CheckCircle } from 'lucide-react';
// import { api } from '../services/api'; // Hãy thay bằng file config axios của bạn
import { supabase } from '../supabaseClient';
const AdminUser = () => {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Quản lý Tab: '0' là Đang hoạt động, '1' là Bị khóa
    const [filterStatus, setFilterStatus] = useState('0');

    const fetchUsers = async (currentPage) => {
        setIsLoading(true);
        try {
            // LẤY TOKEN CHÍNH XÁC
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
                return;
            }

            const response = await fetch(`http://localhost:8080/api/admin/users?page=${currentPage}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // KIỂM TRA DỮ LIỆU TRƯỚC KHI FILTER
                if (data && data.content) {
                    const filteredUsers = data.content.filter(u => {
                        // Xử lý cả trường hợp null/undefined cho isDelete
                        const isDeletedVal = (u.isDelete === null || u.isDelete === undefined) ? '0' : String(u.isDelete);
                        return isDeletedVal === filterStatus;
                    });
                    setUsers(filteredUsers);
                    setTotalPages(data.totalPages || 1);
                }
            } else {
                console.error("Server trả về lỗi:", response.status);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách người dùng:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(page);
    }, [page, filterStatus]);

    useEffect(() => {
        fetchUsers(page);
    }, [page, filterStatus]);

    // Xử lý Khóa / Mở khóa
    const handleToggleLock = async (userId, currentStatus) => {
    // Chuyển đổi trạng thái hiện tại (String)
    // Nếu currentStatus là '0' hoặc null/undefined thì targetStatus sẽ là '1' (Khóa)
    const targetStatus = (currentStatus === '1') ? '0' : '1';
    const actionName = targetStatus === '1' ? "KHÓA" : "MỞ KHÓA";

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản này không?`)) {
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(
            `http://localhost:8080/api/admin/users/${userId}/toggle-lock?status=${targetStatus}`, 
            {
                method: 'PATCH', // Phải khớp với @PatchMapping ở Backend
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = await response.json();

        if (response.ok) {
            // Thông báo thành công từ server
            alert(result.message); 
            // Gọi lại hàm fetchUsers để cập nhật lại danh sách ngay lập tức trên UI
            fetchUsers(page); 
        } else {
            alert("Lỗi: " + (result.error || "Không thể thực hiện thao tác"));
        }
    } catch (error) {
        console.error("Lỗi kết nối server:", error);
        alert("Không thể kết nối đến máy chủ Backend!");
    }
};
    return (
        <div className="admin-wrapper" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Quản lý Người dùng</h2>
                
                {/* Bộ lọc trạng thái (Tabs) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => { setFilterStatus('0'); setPage(1); }}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            backgroundColor: filterStatus === '0' ? '#eef2ff' : '#f3f4f6',
                            color: filterStatus === '0' ? '#4f46e5' : '#6b7280',
                            fontWeight: filterStatus === '0' ? '600' : 'normal'
                        }}
                    >
                        Đang hoạt động
                    </button>
                    <button 
                        onClick={() => { setFilterStatus('1'); setPage(1); }}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            backgroundColor: filterStatus === '1' ? '#fef2f2' : '#f3f4f6',
                            color: filterStatus === '1' ? '#dc2626' : '#6b7280',
                            fontWeight: filterStatus === '1' ? '600' : 'normal'
                        }}
                    >
                        Tài khoản bị khóa
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ borderBottom: '2px solid #f3f4f6', color: '#6b7280' }}>
                            <tr>
                                <th style={{ padding: '12px' }}>NGƯỜI DÙNG</th>
                                <th style={{ padding: '12px' }}>SỐ ĐIỆN THOẠI</th>
                                <th style={{ padding: '12px' }}>VAI TRÒ</th>
                                <th style={{ padding: '12px' }}>TRẠNG THÁI</th>
                                <th style={{ padding: '12px' }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                        Không có người dùng nào trong danh sách này.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const isLocked = user.isDelete === '1';
                                    
                                    return (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {user.avatarUrl && user.avatarUrl !== 'NULL' && user.avatarUrl !== 'EMPTY' ? (
                                                    <img src={user.avatarUrl} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <UserCircle size={40} color="#9ca3af" />
                                                )}
                                                <span style={{ fontWeight: '500' }}>{user.fullName}</span>
                                            </td>
                                            <td style={{ padding: '12px' }}>{user.phone && user.phone !== 'NULL' ? user.phone : 'Chưa cập nhật'}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'uppercase',
                                                    backgroundColor: user.role === 'admin' ? '#fef3c7' : '#f3f4f6',
                                                    color: user.role === 'admin' ? '#d97706' : '#4b5563'
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {isLocked ? (
                                                    <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                                                        <ShieldAlert size={16} /> Bị khóa
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                                                        <CheckCircle size={16} /> Hoạt động
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {/* Không cho phép tự khóa tài khoản Admin/Chính mình nếu cần thiết */}
                                                {user.role !== 'admin' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ 
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                                                            backgroundColor: user.warningCount >= 3 ? '#fee2e2' : user.warningCount > 0 ? '#fef3c7' : '#f3f4f6',
                                                            color: user.warningCount >= 3 ? '#ef4444' : user.warningCount > 0 ? '#d97706' : '#64748b'
                                                        }} title="Số lần vi phạm từ khóa hoặc bị báo cáo">
                                                            ⚠️ {user.warningCount || 0} Cảnh cáo
                                                        </span>
                                                        <button 
                                                            onClick={() => handleToggleLock(user.id, user.isDelete || '0')}
                                                            style={{ 
                                                                display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer',
                                                                backgroundColor: isLocked ? '#10b981' : '#ef4444', 
                                                                color: 'white', padding: '8px 12px', borderRadius: '6px'
                                                            }}
                                                        >
                                                            {isLocked ? <><Unlock size={16} /> Mở khóa</> : <><Lock size={16} /> Khóa TK</>}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* Phân trang */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(p => p - 1)}
                                style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Trước
                            </button>
                            <span style={{ padding: '8px 16px' }}>Trang {page} / {totalPages}</span>
                            <button 
                                disabled={page === totalPages} 
                                onClick={() => setPage(p => p + 1)}
                                style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminUser;