import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
    createRentalType,
    deleteRentalType,
    getRentalTypes,
    updateRentalType,
} from '../services/adminService';

const EMPTY_FORM = { name: '', description: '' };

function AdminRentalTypes() {
    const [types, setTypes] = useState([]);
    const [dialog, setDialog] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [notice, setNotice] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        return getRentalTypes()
            .then((data) => setTypes(Array.isArray(data) ? data : []))
            .catch((error) => setNotice({ type: 'error', text: error.message }))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setDialog({ mode: 'create' });
        setForm(EMPTY_FORM);
        setNotice({ type: '', text: '' });
    };

    const openEdit = (item) => {
        setDialog({ mode: 'edit', item });
        setForm({ name: item.name || '', description: item.description || '' });
        setNotice({ type: '', text: '' });
    };

    const save = async (event) => {
        event.preventDefault();
        if (!form.name.trim()) {
            setNotice({ type: 'error', text: 'Tên loại hình không được để trống.' });
            return;
        }
        setSaving(true);
        setNotice({ type: '', text: '' });
        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
        };
        try {
            if (dialog.mode === 'create') {
                await createRentalType(payload);
                setNotice({ type: 'success', text: 'Đã thêm loại hình cho thuê.' });
            } else {
                await updateRentalType(dialog.item.id, payload);
                setNotice({ type: 'success', text: 'Đã cập nhật loại hình cho thuê.' });
            }
            setDialog(null);
            await load();
        } catch (error) {
            setNotice({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const remove = async (item) => {
        if (!window.confirm(`Xóa loại hình “${item.name}”?`)) return;
        setDeletingId(item.id);
        setNotice({ type: '', text: '' });
        try {
            await deleteRentalType(item.id);
            setNotice({ type: 'success', text: 'Đã xóa loại hình cho thuê.' });
            await load();
        } catch (error) {
            setNotice({ type: 'error', text: error.message });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <AdminLayout
            title="Loại hình cho thuê"
            description="Thêm, chỉnh sửa và quản lý danh mục dùng trên toàn bộ nền tảng."
            actions={<button className="admin-primary admin-add-type" type="button" onClick={openCreate}>＋ Thêm loại hình</button>}
        >
            {notice.text && <div className={`admin-alert ${notice.type}`}>{notice.text}</div>}
            <section className="admin-type-summary admin-card">
                <div><span>TỔNG DANH MỤC</span><strong>{types.length}</strong><small>Loại hình đang được quản lý</small></div>
                <p>Chỉ có thể xóa loại hình chưa được bất kỳ nhà trọ nào sử dụng.</p>
            </section>
            <section className="admin-type-grid">
                {types.map((item, index) => (
                    <article className="admin-type-card" key={item.id}>
                        <i>{String(index + 1).padStart(2, '0')}</i>
                        <div><span>LOẠI HÌNH #{item.id}</span><h2>{item.name}</h2><p>{item.description || 'Chưa có mô tả cho loại hình này.'}</p></div>
                        <footer>
                            <button type="button" onClick={() => openEdit(item)}>Chỉnh sửa</button>
                            <button className="danger" type="button" disabled={deletingId === item.id} onClick={() => remove(item)}>
                                {deletingId === item.id ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </footer>
                    </article>
                ))}
                {!loading && !types.length && <div className="admin-card admin-empty">Chưa có loại hình cho thuê.</div>}
                {loading && <div className="admin-card admin-empty">Đang tải danh mục...</div>}
            </section>
            {dialog && (
                <div className="admin-modal-backdrop" onMouseDown={() => !saving && setDialog(null)}>
                    <section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
                        <header>
                            <div><span>{dialog.mode === 'create' ? 'THÊM DANH MỤC' : 'CHỈNH SỬA DANH MỤC'}</span><h2>{dialog.mode === 'create' ? 'Loại hình mới' : dialog.item.name}</h2></div>
                            <button type="button" disabled={saving} onClick={() => setDialog(null)}>×</button>
                        </header>
                        <form onSubmit={save}>
                            <label><span>Tên loại hình *</span><input autoFocus maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                            <label><span>Mô tả</span><textarea rows="5" maxLength="2000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
                            <footer><button type="button" disabled={saving} onClick={() => setDialog(null)}>Hủy bỏ</button><button className="admin-primary" disabled={saving}>{saving ? 'Đang lưu...' : dialog.mode === 'create' ? 'Thêm loại hình' : 'Lưu thay đổi'}</button></footer>
                        </form>
                    </section>
                </div>
            )}
        </AdminLayout>
    );
}

export default AdminRentalTypes;
