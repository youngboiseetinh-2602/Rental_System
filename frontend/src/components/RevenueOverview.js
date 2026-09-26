// /new/ - File moi cho thong ke doanh thu.
import React, { useState } from 'react';
import { getCurrentRevenue, getRevenueHistory, getOwnersMissingRevenue, remindOwnerRevenue } from '../services/revenueService';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function RevenueOverview({ admin = false }) {
    const [current, setCurrent] = useState(null);
    const [history, setHistory] = useState(null);
    const [missing, setMissing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    async function run(action) {
        setBusy(true);
        setError('');
        setNotice('');
        try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); }
    }

    return (
        <section className={admin ? 'admin-card mb-4' : 'owner-panel mb-4'} aria-label="Thống kê doanh thu">
            <div className="d-flex flex-wrap justify-content-between gap-3 align-items-center">
                <h2>Doanh thu và lợi nhuận</h2>
                <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-success" disabled={busy}
                        onClick={() => run(async () => {
                            setCurrent(await getCurrentRevenue(admin));
                            if (history !== null) setHistory(await getRevenueHistory(admin));
                        })}>Thống kê</button>
                    <button type="button" className="btn btn-outline-secondary" disabled={busy}
                        onClick={() => run(async () => setHistory(await getRevenueHistory(admin)))}>Lịch sử doanh thu</button>
                    {admin && <button type="button" className="btn btn-outline-secondary" disabled={busy}
                        onClick={() => run(async () => setMissing(await getOwnersMissingRevenue()))}>Chủ trọ chưa thống kê</button>}
                </div>
            </div>
            <p className="text-muted">{admin ? 'Lợi nhuận bằng 5% tổng doanh thu chủ trọ đã thống kê.' : 'Lợi nhuận bằng 95% doanh thu, sau hoa hồng 5%.'}</p>
            {busy && <p role="status">Đang xử lý…</p>}
            {error && <p className="text-danger" role="alert">{error}</p>}
            {notice && <p className="text-success" role="status">{notice}</p>}
            {current && <div className="row my-3">
                <p className="col">Tháng {current.month}/{current.year}</p>
                <p className="col">Doanh thu: <strong>{money(current.revenue)}</strong></p>
                <p className="col">Lợi nhuận: <strong>{money(current.profit)}</strong></p>
            </div>}
            {history !== null && <div className="table-responsive">
                <table className="table"><caption>Lịch sử doanh thu đã lưu</caption>
                    <thead><tr><th>Tháng</th><th>Doanh thu</th><th>Lợi nhuận</th></tr></thead>
                    <tbody>{history.map((row) => <tr key={`${row.year}-${row.month}`}>
                        <td>{row.month}/{row.year}</td><td>{money(row.revenue)}</td><td>{money(row.profit)}</td>
                    </tr>)}{!history.length && <tr><td colSpan="3">Chưa có thống kê được lưu.</td></tr>}</tbody>
                </table>
            </div>}
            {missing !== null && <div>
                <h3>Chủ trọ chưa thống kê tháng hiện tại</h3>
                {!missing.length && <p>Tất cả chủ trọ đã có thống kê.</p>}
                <ul className="list-group list-group-flush">{missing.map((owner) => <li key={owner.id}
                    className="list-group-item d-flex justify-content-between align-items-center gap-3">
                    <span>{owner.fullName || owner.username} (@{owner.username})</span>
                    <button type="button" className="btn btn-outline-primary btn-sm" disabled={busy}
                        onClick={() => run(async () => {
                            await remindOwnerRevenue(owner.id);
                            setNotice(`Đã gửi nhắc thống kê cho ${owner.fullName || owner.username}.`);
                        })}>Gửi nhắc thống kê</button>
                </li>)}</ul>
            </div>}
        </section>
    );
}
