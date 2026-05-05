import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, createProduct, updateProduct, uploadImage } from '../services/api';
import { Save, ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

const CATEGORIES = ['Điện tử', 'Sách vở', 'Quần áo', 'Đồ gia dụng', 'Thể thao', 'Xe cộ', 'Khác'];
const CONDITIONS = [
    { value: 'new', label: 'Mới' },
    { value: 'like_new', label: 'Như mới' },
    { value: 'good', label: 'Tốt' },
    { value: 'fair', label: 'Trung bình' },
];
const STATUSES = [
    { value: 'available', label: 'Đang bán' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'sold', label: 'Đã bán' },
    { value: 'inactive', label: 'Ẩn' },
];

const ProductForm = () => {
    const { id } = useParams();
    const nav = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        name: '', description: '', price: '', category: '',
        condition: 'new', quantity: 1, imageUrl: '',
        location: '', deadline: '', status: 'available',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (isEdit) fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const p = await getProduct(id);
            setForm({
                name: p.name || '',
                description: p.description || '',
                price: p.price?.toString() || '',
                category: p.category || '',
                condition: p.condition || 'new',
                quantity: p.quantity || 1,
                imageUrl: p.image_url || '',
                location: p.location || '',
                deadline: p.deadline ? p.deadline.substring(0, 16) : '',
                status: p.status || 'available',
            });
        } catch { showToast('Không thể tải sản phẩm', 'error'); }
        finally { setFetching(false); }
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Tên sản phẩm là bắt buộc';
        if (!form.price || parseFloat(form.price) <= 0) e.price = 'Giá phải lớn hơn 0';
        if (form.quantity < 0) e.quantity = 'Số lượng không hợp lệ';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const data = {
                name: form.name, description: form.description,
                price: parseFloat(form.price), category: form.category,
                condition: form.condition, quantity: parseInt(form.quantity),
                imageUrl: form.imageUrl, location: form.location,
                deadline: form.deadline || null, status: form.status,
            };
            if (isEdit) { await updateProduct(id, data); showToast('Cập nhật thành công!', 'success'); }
            else { await createProduct(data); showToast('Thêm sản phẩm thành công!', 'success'); }
            setTimeout(() => nav('/seller/products'), 1000);
        } catch (err) { showToast(err.message || 'Có lỗi xảy ra', 'error'); }
        finally { setLoading(false); }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast('Chỉ chấp nhận file ảnh', 'error'); return; }
        if (file.size > 10 * 1024 * 1024) { showToast('Ảnh không được quá 10MB', 'error'); return; }
        setUploading(true);
        try {
            const result = await uploadImage(file);
            setForm(f => ({ ...f, imageUrl: result.url }));
            showToast('Tải ảnh thành công!', 'success');
        } catch { showToast('Tải ảnh thất bại', 'error'); }
        finally { setUploading(false); }
    };

    const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
    const onChange = (field, value) => { setForm(f => ({ ...f, [field]: value })); if (errors[field]) setErrors(e => ({ ...e, [field]: null })); };

    if (fetching) return <div className="dashboard-loading"><div className="loading-spinner" /><p>Đang tải...</p></div>;

    return (
        <div className="product-form-page">
            {toast && <div className={`toast toast-${toast.type}`}><span>{toast.message}</span><button onClick={() => setToast(null)}><X size={16} /></button></div>}

            <div className="form-header">
                <button className="btn-back" onClick={() => nav('/seller/products')}><ArrowLeft size={20} /><span>Quay lại</span></button>
                <h1 className="dashboard-title">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-grid">
                    {/* Left column */}
                    <div className="form-section">
                        <h3 className="form-section-title">Thông tin cơ bản</h3>
                        <div className="form-group">
                            <label>Tên sản phẩm <span className="required">*</span></label>
                            <input type="text" value={form.name} onChange={e => onChange('name', e.target.value)} placeholder="Nhập tên sản phẩm" className={errors.name ? 'input-error' : ''} />
                            {errors.name && <span className="field-error">{errors.name}</span>}
                        </div>
                        <div className="form-group">
                            <label>Mô tả</label>
                            <textarea value={form.description} onChange={e => onChange('description', e.target.value)} placeholder="Mô tả chi tiết sản phẩm..." rows={4} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Giá (VNĐ) <span className="required">*</span></label>
                                <input type="number" value={form.price} onChange={e => onChange('price', e.target.value)} placeholder="0" min="0" step="1000" className={errors.price ? 'input-error' : ''} />
                                {errors.price && <span className="field-error">{errors.price}</span>}
                            </div>
                            <div className="form-group">
                                <label>Số lượng</label>
                                <input type="number" value={form.quantity} onChange={e => onChange('quantity', e.target.value)} min="0" />
                                {errors.quantity && <span className="field-error">{errors.quantity}</span>}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Danh mục</label>
                                <select value={form.category} onChange={e => onChange('category', e.target.value)}>
                                    <option value="">Chọn danh mục</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tình trạng</label>
                                <select value={form.condition} onChange={e => onChange('condition', e.target.value)}>
                                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="form-section">
                        <h3 className="form-section-title">Hình ảnh & Chi tiết</h3>
                        <div className="form-group">
                            <label>Hình ảnh sản phẩm</label>
                            <div className="image-upload-area">
                                {form.imageUrl ? (
                                    <div className="image-preview">
                                        <img src={form.imageUrl} alt="Preview" />
                                        <button type="button" className="image-remove" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}><X size={16} /></button>
                                    </div>
                                ) : (
                                    <label className="upload-placeholder">
                                        {uploading ? <><Loader2 size={32} className="spin" /><span>Đang tải lên...</span></> : <><Upload size={32} /><span>Click để tải ảnh lên</span><span className="upload-hint">JPG, PNG (max 10MB)</span></>}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Địa điểm</label>
                            <input type="text" value={form.location} onChange={e => onChange('location', e.target.value)} placeholder="VD: TP.HCM, Quận 1" />
                        </div>
                        <div className="form-group">
                            <label>Hạn bán</label>
                            <input type="datetime-local" value={form.deadline} onChange={e => onChange('deadline', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Trạng thái</label>
                            <select value={form.status} onChange={e => onChange('status', e.target.value)}>
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={() => nav('/seller/products')}>Hủy</button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <><Loader2 size={18} className="spin" /><span>Đang lưu...</span></> : <><Save size={18} /><span>{isEdit ? 'Cập nhật' : 'Tạo sản phẩm'}</span></>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
