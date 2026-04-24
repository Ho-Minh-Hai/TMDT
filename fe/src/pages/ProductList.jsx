import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/api';
import { Package, PlusCircle, Edit3, Trash2, Search, AlertTriangle, X } from 'lucide-react';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [delModal, setDelModal] = useState({ open: false, product: null });
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);
    const nav = useNavigate();

    useEffect(() => { fetchProducts(); }, []);
    useEffect(() => {
        setFiltered(products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
        ));
    }, [search, products]);

    const fetchProducts = async () => {
        try { setProducts(await getProducts()); }
        catch { showToast('Không thể tải sản phẩm', 'error'); }
        finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!delModal.product) return;
        setDeleting(true);
        try {
            await deleteProduct(delModal.product.id);
            setProducts(p => p.filter(x => x.id !== delModal.product.id));
            showToast('Xóa thành công!', 'success');
        } catch { showToast('Xóa thất bại', 'error'); }
        finally { setDeleting(false); setDelModal({ open: false, product: null }); }
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
    const statusLabel = { available: 'Đang bán', sold: 'Đã bán', pending: 'Chờ duyệt', inactive: 'Ẩn' };

    if (loading) return <div className="dashboard-loading"><div className="loading-spinner" /><p>Đang tải...</p></div>;

    return (
        <div className="product-list-page">
            {toast && <div className={`toast toast-${toast.type}`}><span>{toast.message}</span><button onClick={() => setToast(null)}><X size={16} /></button></div>}

            {delModal.open && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon-warning"><AlertTriangle size={32} /></div>
                        <h3>Xác nhận xóa</h3>
                        <p>Bạn có chắc muốn xóa <strong>"{delModal.product?.name}"</strong>?</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDelModal({ open: false, product: null })} disabled={deleting}>Hủy</button>
                            <button className="btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Đang xóa...' : 'Xóa'}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-header">
                <div><h1 className="dashboard-title">Sản phẩm của tôi</h1><p className="dashboard-subtitle">Quản lý sản phẩm đang bán</p></div>
                <Link to="/seller/products/new" className="btn-primary"><PlusCircle size={20} /><span>Thêm sản phẩm</span></Link>
            </div>

            <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
                {search && <button className="search-clear" onClick={() => setSearch('')}><X size={16} /></button>}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Package size={48} /></div>
                    <h3>{search ? 'Không tìm thấy' : 'Chưa có sản phẩm'}</h3>
                    <p>{search ? 'Thử từ khóa khác' : 'Thêm sản phẩm đầu tiên!'}</p>
                    {!search && <Link to="/seller/products/new" className="btn-primary" style={{ marginTop: '1rem' }}><PlusCircle size={18} /><span>Thêm sản phẩm</span></Link>}
                </div>
            ) : (
                <div className="table-container">
                    <table className="products-table">
                        <thead><tr><th>Ảnh</th><th>Tên</th><th>Giá</th><th>Danh mục</th><th>SL</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id}>
                                    <td><div className="table-img">{p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="img-placeholder-sm"><Package size={20} /></div>}</div></td>
                                    <td><div className="table-product-name">{p.name}</div>{p.description && <div className="table-product-desc">{p.description.substring(0, 50)}{p.description.length > 50 ? '...' : ''}</div>}</td>
                                    <td className="table-price">{fmt(p.price)}</td>
                                    <td>{p.category || '—'}</td>
                                    <td>{p.quantity}</td>
                                    <td><span className={`status-badge status-${p.status}`}>{statusLabel[p.status] || p.status}</span></td>
                                    <td><div className="table-actions">
                                        <button className="btn-icon btn-edit" onClick={() => nav(`/seller/products/${p.id}/edit`)} title="Sửa"><Edit3 size={16} /></button>
                                        <button className="btn-icon btn-delete" onClick={() => setDelModal({ open: true, product: p })} title="Xóa"><Trash2 size={16} /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="table-footer"><span className="table-count">Hiển thị {filtered.length} / {products.length} sản phẩm</span></div>
        </div>
    );
};

export default ProductList;
