import React, { useEffect, useState } from 'react';
import { AlertCircle, User, CheckCircle2 } from 'lucide-react';
import { getAuthHeaders } from '../services/api';

const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !isNaN(date.getTime()) ? date.toLocaleString('vi-VN') : 'Không xác định';
};

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [approving, setApproving] = useState(null);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch('http://localhost:8080/api/admin/reports', { headers });
            if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`Không thể tải báo cáo: ${response.status} ${response.statusText} ${body}`);
            }
            const data = await response.json();
            setReports(data || []);
        } catch (err) {
            setError(err.message || 'Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    };

    const approveReport = async (reportId) => {
        setApproving(reportId);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`http://localhost:8080/api/admin/reports/${reportId}/approve`, {
                method: 'POST',
                headers,
            });
            if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`Không thể duyệt báo cáo: ${response.status} ${response.statusText} ${body}`);
            }
            await response.json();
            setReports((prev) => prev.filter((report) => report.id !== reportId));
        } catch (err) {
            console.error(err);
            setError(err.message || 'Lỗi duyệt báo cáo');
        } finally {
            setApproving(null);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="reports-section">
            <div className="section-header">
                <div>
                    <h2>Báo cáo vi phạm</h2>
                    <p style={{ color: '#64748b', margin: '8px 0 0' }}>Danh sách báo cáo từ người dùng, nhấn Duyệt để tạo cảnh báo.</p>
                </div>
                <button className="btn-export" onClick={fetchReports} disabled={loading}>
                    <AlertCircle size={16} /> Làm mới
                </button>
            </div>

            {error && <div style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</div>}

            <table className="reports-table">
                <thead>
                    <tr>
                        <th>Lý do</th>
                        <th>Ngày báo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Đang tải...</td></tr>
                    ) : reports.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Chưa có báo cáo nào.</td></tr>
                    ) : reports.map((report) => (
                        <tr key={report.id}>
                            <td>{report.reason || 'Không có lý do'}</td>
                            <td>{formatDate(report.createdAt || report.created_at)}</td>
                            <td>
                                <button
                                    className="btn-approve"
                                    onClick={() => approveReport(report.id)}
                                    disabled={approving === report.id}
                                >
                                    <CheckCircle2 size={14} /> {approving === report.id ? 'Đang xử lý' : 'Duyệt'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminReports;
