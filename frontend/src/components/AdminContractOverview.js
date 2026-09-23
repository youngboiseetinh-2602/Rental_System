import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getAdminDashboardContracts } from '../services/adminService';

const statusLabels = {
    APPROVED: 'Đã duyệt',
    TERMINATED: 'Đã kết thúc',
    EXPIRED: 'Hết hạn',
};

function formatDate(value) {
    if (!value) return 'Không thời hạn';
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
}

function formatMonth(value) {
    if (!value) return '';
    const [year, month] = String(value).split('-');
    return `${month}/${year}`;
}

function periodLabel(from, to) {
    if (!to) return 'Hợp đồng';
    if (!from) return `ĐẾN TRƯỚC THÁNG ${formatMonth(to)}`;
    return `TỪ THÁNG ${formatMonth(from)} ĐẾN TRƯỚC THÁNG ${formatMonth(to)}`;
}

function currentVietnamMonth() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit',
    }).formatToParts(new Date());
    return `${parts.find((part) => part.type === 'year').value}-${parts.find((part) => part.type === 'month').value}`;
}

function nextMonth(month) {
    const [year, number] = month.split('-').map(Number);
    return number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, '0')}`;
}

function AdminContractOverview({ preview = false }) {
    const [draft, setDraft] = useState({ from: '', to: '' });
    const [applied, setApplied] = useState({ from: '', to: '' });
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        getAdminDashboardContracts({ ...applied, page })
            .then((response) => {
                if (active) setResult(response);
            })
            .catch((requestError) => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [applied, page]);

    const search = (event) => {
        event.preventDefault();
        if (draft.from && draft.to && draft.from >= draft.to) {
            setValidationError('Tháng bắt đầu phải trước tháng kết thúc.');
            return;
        }
        setValidationError('');
        setPage(0);
        setApplied({ ...draft });
    };

    const clear = () => {
        setDraft({ from: '', to: '' });
        setApplied({ from: '', to: '' });
        setStatus('');
        setPage(0);
        setValidationError('');
    };

    const contracts = result || { content: [], totalElements: 0, totalPages: 0 };
    const pageContracts = preview ? contracts.content.slice(0, 5) : contracts.content;
    const visibleContracts = status
        ? pageContracts.filter((contract) => contract.status === status) : pageContracts;
    const counts = pageContracts.reduce((totals, contract) => ({
        ...totals,
        [contract.status]: (totals[contract.status] || 0) + 1,
    }), {});
    const currentMonth = currentVietnamMonth();
    const periodFrom = applied.from || (applied.to ? null : currentMonth);
    const periodTo = applied.to || nextMonth(currentMonth);

    return (
        <section className="admin-card admin-contract-dashboard" aria-labelledby="admin-contract-heading">
            <div className="admin-card-heading">
                <div><span>{periodLabel(periodFrom, periodTo)}</span><h2 id="admin-contract-heading">Thống kê hợp đồng</h2></div>
                {preview && <NavLink to="/admin/contracts">Xem tất cả →</NavLink>}
            </div>

            {!preview && <form className="admin-contract-filters" onSubmit={search}>
                <label><span>Từ tháng</span><input type="month" value={draft.from}
                    onChange={(event) => setDraft({ ...draft, from: event.target.value })} /></label>
                <label><span>Trước tháng</span><input type="month" value={draft.to}
                    onChange={(event) => setDraft({ ...draft, to: event.target.value })} /></label>
                <button className="admin-primary" type="submit">Tìm kiếm</button>
                <button className="admin-contract-reset" type="button" onClick={clear}>Tháng hiện tại</button>
                <p>Để trống cả hai ô: tháng hiện tại. Chỉ nhập một ô: tìm đến hết tháng hiện tại hoặc đến trước tháng đã chọn.</p>
            </form>}

            {validationError && <div className="admin-alert error">{validationError}</div>}
            {error && <div className="admin-alert error">{error}</div>}
            {loading ? <p className="admin-contract-message">Đang tải thống kê hợp đồng...</p> : !error && result && <>
                <div className="admin-contract-subheading">{preview ? 'Trong 5 hợp đồng xem trước' : 'Trạng thái trong trang hiện tại'}</div>
                <div className="admin-contract-stats">
                    {Object.entries(statusLabels).map(([key, label]) => (
                        <button type="button" key={key} disabled={preview}
                            className={status === key ? 'is-selected' : ''}
                            onClick={() => { setStatus(status === key ? '' : key); setPage(0); }}
                            aria-pressed={!preview && status === key}>
                            <span>{label}</span><strong>{counts[key] || 0}</strong>
                        </button>
                    ))}
                </div>
                <div className="admin-contract-subheading">
                    {preview ? '5 hợp đồng mới nhất' : <>
                        <span>{status ? `${statusLabels[status]} trên trang này: ${visibleContracts.length}` : `Tất cả hợp đồng: ${contracts.totalElements}`}</span>
                        {status && <button type="button" onClick={() => { setStatus(''); setPage(0); }}>Xem tất cả</button>}
                    </>}
                </div>
                <div className="admin-table-wrap"><table className="admin-table"><thead><tr>
                    <th>Hợp đồng</th><th>Phòng</th><th>Người thuê</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th>
                </tr></thead><tbody>
                    {visibleContracts.map((contract) => <tr key={contract.id}>
                        <td><strong>#{contract.id}</strong></td>
                        <td>{contract.roomName || `Phòng #${contract.roomId}`}</td>
                        <td>{contract.tenantName || `Người thuê #${contract.tenantId}`}</td>
                        <td>{formatDate(contract.startDate)}</td>
                        <td>{formatDate(contract.endDate)}</td>
                        <td>{statusLabels[contract.status] || contract.status}</td>
                    </tr>)}
                    {!visibleContracts.length && <tr><td colSpan="6" className="admin-empty">Không có hợp đồng phù hợp.</td></tr>}
                </tbody></table></div>
                {!preview && <div className="admin-pagination">
                    <span>Trang {contracts.totalPages ? page + 1 : 0} / {contracts.totalPages || 0} · 10 hợp đồng mỗi trang</span>
                    <div>
                        <button type="button" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>← Trước</button>
                        <button type="button" disabled={page + 1 >= contracts.totalPages || loading} onClick={() => setPage(page + 1)}>Sau →</button>
                    </div>
                </div>}
            </>}
        </section>
    );
}

export default AdminContractOverview;
