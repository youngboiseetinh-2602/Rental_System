import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getAdminDashboardContracts } from '../services/adminService';

function currentVietnamMonth() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit',
    }).formatToParts(new Date());
    const year = parts.find((part) => part.type === 'year').value;
    const month = parts.find((part) => part.type === 'month').value;
    return { key: `${year}-${month}`, label: `${month}/${year}` };
}

function formatDate(value) {
    if (!value) return 'Không thời hạn';
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
}

function AdminContractOverview({ preview = false }) {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        getAdminDashboardContracts()
            .then((result) => {
                if (active) setContracts(Array.isArray(result) ? result : []);
            })
            .catch((requestError) => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    const month = currentVietnamMonth();
    const endingThisMonth = contracts.filter((contract) => contract.endDate?.slice(0, 7) === month.key);
    const roomCount = new Set(contracts.map((contract) => contract.roomId)).size;
    const propertyCount = new Set(contracts.map((contract) => contract.rentalPropertyId)).size;
    const orderedContracts = [...contracts]
        .sort((a, b) => (a.endDate || '9999-12-31').localeCompare(b.endDate || '9999-12-31'));
    const visibleContracts = preview ? orderedContracts.slice(0, 5) : orderedContracts;

    return (
        <section className="admin-card admin-contract-dashboard" aria-labelledby="admin-contract-heading">
            <div className="admin-card-heading">
                <div><span>HỢP ĐỒNG THÁNG {month.label}</span><h2 id="admin-contract-heading">Thống kê hợp đồng</h2></div>
                {preview && <NavLink to="/admin/contracts">Xem tất cả →</NavLink>}
            </div>
            {error && <div className="admin-alert error">{error}</div>}
            {loading ? <p className="admin-contract-message">Đang tải thống kê hợp đồng...</p> : !error && <>
                <div className="admin-contract-stats">
                    <article><span>Hợp đồng trong tháng</span><strong>{contracts.length}</strong></article>
                    <article><span>Kết thúc trong tháng</span><strong>{endingThisMonth.length}</strong></article>
                    <article><span>Phòng có hợp đồng</span><strong>{roomCount}</strong></article>
                    <article><span>Nhà trọ có hợp đồng</span><strong>{propertyCount}</strong></article>
                </div>
                <div className="admin-contract-subheading">{preview ? '5 hợp đồng kết thúc sớm nhất' : 'Hợp đồng trong tháng'}</div>
                <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Hợp đồng</th><th>Phòng</th><th>Người thuê</th><th>Bắt đầu</th><th>Kết thúc</th></tr></thead><tbody>
                    {visibleContracts.map((contract) => <tr key={contract.id}><td><strong>#{contract.id}</strong></td><td>{contract.roomName || `Phòng #${contract.roomId}`}</td><td>{contract.tenantName || `Người thuê #${contract.tenantId}`}</td><td>{formatDate(contract.startDate)}</td><td>{formatDate(contract.endDate)}</td></tr>)}
                    {!visibleContracts.length && <tr><td colSpan="5" className="admin-empty">Chưa có hợp đồng hiệu lực trong tháng này.</td></tr>}
                </tbody></table></div>
            </>}
        </section>
    );
}

export default AdminContractOverview;
