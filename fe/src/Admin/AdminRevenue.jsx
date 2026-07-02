import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const currentYear = new Date().getFullYear();
const revenuePerUser = 250000;

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ';

const AdminRevenue = () => {
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchRevenue = async (selectedYear) => {
        setIsLoading(true);
        setError('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`http://localhost:8080/api/admin/revenue/vip-memberships?year=${selectedYear}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu doanh thu');
            }

            const result = await response.json();
            setData(result.monthlyData || []);
            setTotalRevenue(result.totalRevenue || 0);
        } catch (fetchError) {
            console.error('Lỗi khi fetch doanh thu VIP:', fetchError);
            setError(fetchError.message || 'Đã xảy ra lỗi khi tải doanh thu');
            setData([]);
            setTotalRevenue(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenue(year);
    }, [year]);

    const chartMax = useMemo(() => {
        const maxValue = Math.max(...data.map((item) => item.revenue || 0), 0);
        return maxValue > 0 ? maxValue : 1;
    }, [data]);

    const uniqueUserTotal = useMemo(() => {
        return data.reduce((sum, item) => sum + (item.uniqueUsers || 0), 0);
    }, [data]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Doanh thu VIP</h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '4px 0 0 0' }}>
                        Mỗi user chỉ được tính một lần trong mỗi tháng. Mỗi lượt tính doanh thu tương ứng 250.000 đ.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        Năm
                        <input
                            type="number"
                            min="2000"
                            max={currentYear + 1}
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value) || currentYear)}
                            style={{
                                width: '120px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.95rem',
                                outline: 'none'
                            }}
                        />
                    </label>

                    <button
                        onClick={() => fetchRevenue(year)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                            backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px',
                            cursor: 'pointer', fontWeight: 600, color: '#334155'
                        }}
                    >
                        <RefreshCw size={16} /> Làm mới
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tổng doanh thu</p>
                    <h3 style={{ margin: 0, fontSize: '1.9rem', color: '#0f172a' }}>{formatCurrency(totalRevenue)}</h3>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tổng lượt tính doanh thu</p>
                    <h3 style={{ margin: 0, fontSize: '1.9rem', color: '#0f172a' }}>{uniqueUserTotal.toLocaleString('vi-VN')}</h3>
                </div>
            </div>

            <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                        <BarChart3 size={20} color="#2563eb" /> Biểu đồ doanh thu theo tháng - {year}
                    </h2>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Mỗi cột là tổng doanh thu tháng</span>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Đang tải dữ liệu doanh thu...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#b91c1c' }}>{error}</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(92px, 1fr))', gap: '12px', alignItems: 'end', minHeight: '420px', minWidth: '980px' }}>
                            {Array.from({ length: 12 }).map((_, index) => {
                                const monthData = data[index] || { month: index + 1, revenue: 0, uniqueUsers: 0 };
                                const height = Math.max(8, (monthData.revenue / chartMax) * 320);
                                const hasRevenue = monthData.revenue > 0;

                                return (
                                    <div key={monthData.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: hasRevenue ? '#0f172a' : '#94a3b8' }}>
                                            {formatCurrency(monthData.revenue || 0)}
                                        </div>

                                        <div style={{
                                            width: '100%',
                                            minHeight: '340px',
                                            display: 'flex',
                                            alignItems: 'end',
                                            justifyContent: 'center',
                                            background: 'linear-gradient(180deg, rgba(241,245,249,0.35), rgba(241,245,249,0.06))',
                                            borderRadius: '16px',
                                            padding: '16px 10px 10px',
                                            border: '1px solid #f1f5f9'
                                        }}>
                                            <div style={{
                                                width: '100%',
                                                maxWidth: '34px',
                                                height: `${height}px`,
                                                borderRadius: '12px 12px 6px 6px',
                                                background: hasRevenue ? 'linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)' : '#e2e8f0',
                                                boxShadow: hasRevenue ? '0 10px 20px rgba(37, 99, 235, 0.18)' : 'none',
                                                transition: 'height 0.2s ease'
                                            }} />
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Tháng {monthData.month}</div>
                                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{monthData.uniqueUsers || 0} user</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRevenue;