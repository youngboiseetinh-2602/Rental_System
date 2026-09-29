// /new/ - File moi cho thong ke doanh thu.
import React, { useEffect, useState } from 'react';
import { getCurrentRevenue, getRevenueHistory, getOwnersMissingRevenue, remindOwnerRevenue } from '../services/revenueService';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function RevenueOverview({ admin = false }) {
    const revenueLabel = admin ? 'Tổng doanh thu chủ trọ' : 'Doanh thu tiền thuê';
    const incomeLabel = admin ? 'Hoa hồng nền tảng' : 'Thu nhập sau hoa hồng';
    const [current, setCurrent] = useState(null);
    const [history, setHistory] = useState(null);
    const [missing, setMissing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loadingSaved, setLoadingSaved] = useState(!admin);

    useEffect(() => {
        if (admin) return;
        let active = true;
        setLoadingSaved(true);
        // Read saved rows only: the current endpoint initializes a missing owner month.
        getRevenueHistory(false).then((rows) => {
            if (!active) return;
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'numeric',
            }).formatToParts(new Date());
            const year = Number(parts.find(part => part.type === 'year').value);
            const month = Number(parts.find(part => part.type === 'month').value);
            setCurrent(rows.find(row => Number(row.year) === year && Number(row.month) === month) || null);
        }).catch((e) => {
            if (active) setError(e.message);
        }).finally(() => {
            if (active) setLoadingSaved(false);
        });
        return () => { active = false; };
    }, [admin]);

    async function run(action) {
        setBusy(true);
        setError('');
        setNotice('');
        try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); }
    }

    return (
        <section className={admin ? 'admin-card p-4 mb-4' : 'owner-panel mb-4'} aria-label="Thống kê doanh thu">
            <div className="d-flex flex-wrap justify-content-between gap-3 align-items-center">
                <h2>{admin ? 'Doanh thu và hoa hồng' : 'Doanh thu tiền thuê theo tháng'}</h2>
                <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-success" disabled={busy || loadingSaved}
                        onClick={() => run(async () => {
                            setCurrent(await getCurrentRevenue(admin));
                            if (history !== null) setHistory(await getRevenueHistory(admin));
                        })}>Thống kê</button>
                    <button type="button" className="btn btn-outline-secondary" disabled={busy || loadingSaved}
                        onClick={() => run(async () => setHistory(await getRevenueHistory(admin)))}>Lịch sử doanh thu</button>
                    {admin && <button type="button" className="btn btn-outline-secondary" disabled={busy}
                        onClick={() => run(async () => setMissing(await getOwnersMissingRevenue()))}>Chủ trọ chưa thống kê</button>}
                </div>
            </div>
            <p className="text-muted">{admin
                ? 'Hoa hồng nền tảng bằng 5% tổng doanh thu chủ trọ đã thống kê trong tháng.'
                : 'Thu nhập sau hoa hồng bằng 95% doanh thu tiền thuê, chưa trừ các chi phí vận hành khác.'}</p>
            {busy && <p role="status">Đang xử lý…</p>}
            {loadingSaved && <p role="status">Đang tải thống kê đã lưu…</p>}
            {!admin && !loadingSaved && !busy && !error && !current && <p>Chưa có thống kê tháng hiện tại. Bấm “Thống kê” để tạo.</p>}
            {admin && !busy && !error && !current && <p>Bấm “Thống kê” để xem tổng doanh thu và hoa hồng tháng hiện tại.</p>}
            {error && <p className="text-danger" role="alert">{error}</p>}
            {notice && <p className="text-success" role="status">{notice}</p>}
            {current && <div className="my-4">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <h3 className="h5 mb-0">Tháng {current.month}/{current.year}</h3>
                    <span className="badge bg-light text-secondary border">Số liệu đã lưu</span>
                </div>
                <div className="row g-3">
                    <div className={admin ? 'col-12 col-md-6' : 'col-12 col-md-4'}>
                        <div className="border rounded p-3 h-100">
                            <p className="text-muted mb-2">{revenueLabel}</p>
                            <strong className="fs-4">{money(current.revenue)}</strong>
                        </div>
                    </div>
                    {!admin && <div className="col-12 col-md-4">
                        <div className="border rounded p-3 h-100">
                            <p className="text-muted mb-2">Hoa hồng nền tảng</p>
                            <strong className="fs-4">{money(Number(current.revenue) - Number(current.profit))}</strong>
                        </div>
                    </div>}
                    <div className={admin ? 'col-12 col-md-6' : 'col-12 col-md-4'}>
                        <div className="border rounded p-3 h-100 bg-light">
                            <p className="text-muted mb-2">{incomeLabel}</p>
                            <strong className="fs-4 text-success">{money(current.profit)}</strong>
                        </div>
                    </div>
                </div>
            </div>}
            <details className="border rounded p-3 my-3">
                <summary className="fw-semibold">Cách tính doanh thu tháng</summary>
                <div className="mt-3">
                    {admin ? <p>Chỉ tổng hợp các thống kê tháng đã lưu của chủ trọ. Chủ trọ chưa có thống kê tháng đó chưa được đưa vào tổng.</p> : <>
                        <p>Mỗi hợp đồng được tính một lần giá thuê tháng đã chốt khi gửi yêu cầu, nếu thời gian thuê có giao với tháng thống kê. Hợp đồng nhiều tháng không được cộng toàn bộ giá trị vào tháng duyệt.</p>
                        <p>Ví dụ: một hợp đồng thuê tháng 9 và một hợp đồng thuê tháng 9–10, cùng giá 2.500.000đ/tháng, đóng góp 5.000.000đ vào tháng 9 và 2.500.000đ vào tháng 10.</p>
                        <p>Hợp đồng đã duyệt, đã hết hạn hoặc đã chấm dứt đều được tính nếu có thời gian thuê trong tháng. Khi chấm dứt, ngày kết thúc là ngày chấm dứt. Yêu cầu chờ duyệt hoặc đã hủy không được tính.</p>
                        <p>Hiện hệ thống tính trọn giá thuê tháng, không chia theo số ngày ở. Đây là doanh thu theo hợp đồng, không phải xác nhận tiền đã thanh toán.</p>
                    </>}
                    <p className="text-muted mb-0">{admin
                        ? 'Lịch sử hiển thị doanh thu và hoa hồng từ số liệu đã lưu của từng tháng.'
                        : 'Nút “Thống kê” xem số liệu tháng hiện tại hoặc tạo thống kê nếu chưa có. Số liệu đã lưu được cộng thêm khi duyệt hợp đồng có hiệu lực trong tháng; nút này không tính lại toàn bộ lịch sử.'}</p>
                </div>
            </details>
            {history !== null && <div className="table-responsive">
                <table className="table"><caption>Lịch sử doanh thu đã lưu</caption>
                    <thead><tr><th scope="col">Tháng</th><th scope="col">{revenueLabel}</th><th scope="col">{incomeLabel}</th></tr></thead>
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
