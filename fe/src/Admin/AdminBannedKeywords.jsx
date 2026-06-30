import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Plus, Search, User, Filter, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminBannedKeywords = () => {
    const [keywords, setKeywords] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchWarning, setSearchWarning] = useState('');
    const [activeSubTab, setActiveSubTab] = useState('keywords'); // 'keywords' | 'warnings'
    const [loading, setLoading] = useState(false);

    const fetchKeywords = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('http://localhost:8080/api/admin/banned-keywords', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setKeywords(data);
            }
        } catch (error) {
            console.error("Error fetching banned keywords:", error);
        }
    };

    const fetchWarnings = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('http://localhost:8080/api/admin/warnings', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWarnings(data);
            }
        } catch (error) {
            console.error("Error fetching warnings:", error);
        }
    };

    useEffect(() => {
        fetchKeywords();
        fetchWarnings();
    }, []);

    const handleAddKeyword = async (e) => {
        e.preventDefault();
        if (!newKeyword.trim()) return;

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('http://localhost:8080/api/admin/banned-keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ keyword: newKeyword.trim() })
            });

            if (response.ok) {
                setNewKeyword('');
                fetchKeywords();
            } else {
                const errData = await response.json();
                alert("Lỗi: " + (errData.error || "Không thể thêm từ khóa"));
            }
        } catch (error) {
            console.error("Error adding keyword:", error);
            alert("Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteKeyword = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa từ khóa cấm này?")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://localhost:8080/api/admin/banned-keywords/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (response.ok) {
                fetchKeywords();
            } else {
                alert("Không thể xóa từ khóa cấm");
            }
        } catch (error) {
            console.error("Error deleting keyword:", error);
        }
    };

    const filteredKeywords = keywords.filter(k => 
        k.keyword.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    const filteredWarnings = warnings.filter(w => 
        w.userFullName.toLowerCase().includes(searchWarning.toLowerCase()) ||
        w.detail?.toLowerCase().includes(searchWarning.toLowerCase()) ||
        w.reason.toLowerCase().includes(searchWarning.toLowerCase())
    );

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Hệ thống Kiểm duyệt Bình luận</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px', margin: 0 }}>Lọc bình luận vi phạm bằng từ khóa cấm và theo dõi lịch sử cảnh cáo.</p>
                </div>
                
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button 
                        onClick={() => setActiveSubTab('keywords')}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            backgroundColor: activeSubTab === 'keywords' ? '#fff' : 'transparent',
                            color: activeSubTab === 'keywords' ? '#0f172a' : '#64748b',
                            fontWeight: '600', transition: 'all 0.2s',
                            boxShadow: activeSubTab === 'keywords' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Từ khóa cấm ({keywords.length})
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('warnings')}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            backgroundColor: activeSubTab === 'warnings' ? '#fff' : 'transparent',
                            color: activeSubTab === 'warnings' ? '#0f172a' : '#64748b',
                            fontWeight: '600', transition: 'all 0.2s',
                            boxShadow: activeSubTab === 'warnings' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Lịch sử cảnh cáo ({warnings.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: TỪ KHÓA CẤM */}
            {activeSubTab === 'keywords' && (
                <div>
                    {/* Add Keyword Form & Search */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                        <form onSubmit={handleAddKeyword} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '300px' }}>
                            <input 
                                type="text"
                                placeholder="Nhập từ khóa cấm mới..."
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                style={{
                                    flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                    outline: 'none', fontSize: '0.95rem'
                                }}
                            />
                            <button 
                                type="submit"
                                disabled={loading || !newKeyword.trim()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                                    backgroundColor: '#ef4444', color: '#fff', fontWeight: '600',
                                    cursor: 'pointer', opacity: (loading || !newKeyword.trim()) ? 0.7 : 1
                                }}
                            >
                                <Plus size={18} /> Thêm từ cấm
                            </button>
                        </form>

                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm từ khóa..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px',
                                    border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Keywords Grid */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>TỪ KHÓA CẤM</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>NGÀY TẠO</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600', textAlign: 'right' }}>THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKeywords.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                            Không tìm thấy từ khóa cấm nào.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredKeywords.map((k) => (
                                        <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    backgroundColor: '#fee2e2', color: '#991b1b',
                                                    padding: '4px 10px', borderRadius: '6px',
                                                    fontWeight: '600', fontSize: '0.95rem'
                                                }}>
                                                    {k.keyword}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>
                                                {new Date(k.createdAt).toLocaleString('vi-VN')}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => handleDeleteKeyword(k.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', transition: '0.2s' }}
                                                    title="Xóa từ khóa"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: LỊCH SỬ CẢNH CÁO */}
            {activeSubTab === 'warnings' && (
                <div>
                    {/* Search Warnings */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text"
                                placeholder="Tìm theo tên hoặc nội dung..."
                                value={searchWarning}
                                onChange={(e) => setSearchWarning(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px',
                                    border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Warnings Table */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>NGƯỜI DÙNG BỊ CẢNH CÁO</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>LÝ DO</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>NGUỒN CẢNH BÁO</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>NỘI DUNG VI PHẠM</th>
                                    <th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>THỜI GIAN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWarnings.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                            Không có lịch sử cảnh cáo nào.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWarnings.map((w) => (
                                        <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1e293b' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={16} color="#64748b" />
                                                    {w.userFullName}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px',
                                                    fontSize: '0.9rem', fontWeight: '500'
                                                }}>
                                                    <AlertTriangle size={14} />
                                                    {w.reason}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>
                                                {w.source}
                                            </td>
                                            <td style={{ padding: '14px 16px', fontStyle: 'italic', color: '#475569', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={w.detail}>
                                                "{w.detail}"
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>
                                                {new Date(w.createdAt).toLocaleString('vi-VN')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBannedKeywords;
