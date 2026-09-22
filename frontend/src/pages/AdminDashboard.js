import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getAdminDashboardContracts, getAdminUsers, getRentalTypes } from '../services/adminService';

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

const labels = { ADMIN: 'Quản trị viên', OWNER: 'Chủ trọ', CUSTOMER: 'Khách thuê', ACTIVE: 'Hoạt động', INACTIVE: 'Tạm ngưng', LOCKED: 'Đã khóa' };

function AdminDashboard() {
    const [data, setData] = useState({ users: [], total: 0, owners: 0, customers: 0, locked: 0, types: 0 });
    const [contracts, setContracts] = useState([]);
    const [contractsLoading, setContractsLoading] = useState(true);
    const [contractsError, setContractsError] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        Promise.all([
            getAdminUsers({ page: 0, size: 6, sort: 'id,desc' }),
            getAdminUsers({ role: 'OWNER', size: 1 }),
            getAdminUsers({ role: 'CUSTOMER', size: 1 }),
            getAdminUsers({ status: 'LOCKED', size: 1 }),
            getRentalTypes(),
        ]).then(([all, owners, customers, locked, types]) => setData({
            users: all.content || [], total: all.totalElements || 0,
            owners: owners.totalElements || 0, customers: customers.totalElements || 0,
            locked: locked.totalElements || 0, types: types.length || 0,
        })).catch((e) => setError(e.message));
    }, []);
    useEffect(() => {
        let active = true;
        getAdminDashboardContracts()
            .then((result) => {
                if (active) setContracts(Array.isArray(result) ? result : []);
            })
            .catch((requestError) => {
                if (active) setContractsError(requestError.message);
            })
            .finally(() => {
                if (active) setContractsLoading(false);
            });
        return () => { active = false; };
    }, []);
    const month = currentVietnamMonth();
    const endingThisMonth = contracts.filter((contract) => contract.endDate?.slice(0, 7) === month.key);
    const roomCount = new Set(contracts.map((contract) => contract.roomId)).size;
    const propertyCount = new Set(contracts.map((contract) => contract.rentalPropertyId)).size;
    const upcomingContracts = [...contracts]
        .sort((a, b) => (a.endDate || '9999-12-31').localeCompare(b.endDate || '9999-12-31'))
        .slice(0, 5);
    const roleTotal = Math.max(1, data.owners + data.customers);
    const ownerPercent = Math.round(data.owners * 100 / roleTotal);
    return (
        <AdminLayout title="Tổng quan hệ thống" description="Theo dõi người dùng và cấu hình nền tảng tại một nơi." actions={<span className="admin-live">● Dữ liệu trực tiếp</span>}>
            {error && <div className="admin-alert error">{error}</div>}
            <section className="admin-stats">
                <NavLink to="/admin/users"><article className="blue"><span>Tổng tài khoản</span><strong>{data.total}</strong><small>Xem tất cả người dùng →</small><i>01</i></article></NavLink>
                <NavLink to="/admin/users?status=ACTIVE"><article className="green"><span>Đang hoạt động</span><strong>{Math.max(0, data.total - data.locked)}</strong><small>Xem tài khoản hoạt động →</small><i>02</i></article></NavLink>
                <NavLink to="/admin/users?role=OWNER"><article className="purple"><span>Chủ trọ</span><strong>{data.owners}</strong><small>Xem danh sách chủ trọ →</small><i>03</i></article></NavLink>
                <NavLink to="/admin/rental-types"><article className="orange"><span>Loại hình cho thuê</span><strong>{data.types}</strong><small>Quản lý danh mục →</small><i>04</i></article></NavLink>
            </section>
            <section className="admin-dashboard-grid">
                <article className="admin-card admin-users-preview">
                    <div className="admin-card-heading"><div><span>TÀI KHOẢN GẦN ĐÂY</span><h2>Người dùng mới</h2></div><NavLink to="/admin/users">Xem tất cả →</NavLink></div>
                    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th></tr></thead><tbody>
                        {data.users.map((user) => <tr key={user.id}><td><div className="admin-user-cell"><i>{(user.fullName || user.username || 'U')[0]}</i><span><strong>{user.fullName || 'Chưa cập nhật'}</strong><small>@{user.username}</small></span></div></td><td>{labels[user.role]}</td><td><b className={`admin-status ${String(user.status).toLowerCase()}`}>{labels[user.status]}</b></td></tr>)}
                        {!data.users.length && <tr><td colSpan="3" className="admin-empty">Chưa có dữ liệu.</td></tr>}
                    </tbody></table></div>
                </article>
                <article className="admin-card admin-role-card">
                    <div className="admin-card-heading"><div><span>PHÂN BỔ</span><h2>Vai trò người dùng</h2></div></div>
                    <div className="admin-donut" style={{ background: `conic-gradient(#7259d6 0 ${ownerPercent}%, #2e80da ${ownerPercent}% 100%)` }}><span><strong>{data.total}</strong><small>Tài khoản</small></span></div>
                    <ul><li><i className="customer" /><span>Khách thuê<small>{100 - ownerPercent}% tổng số</small></span><strong>{data.customers}</strong></li><li><i className="owner" /><span>Chủ trọ<small>{ownerPercent}% tổng số</small></span><strong>{data.owners}</strong></li><li><i className="locked" /><span>Đã khóa<small>Cần kiểm tra</small></span><strong>{data.locked}</strong></li></ul>
                </article>
            </section>
            <section className="admin-card admin-contract-dashboard" aria-labelledby="admin-contract-heading">
                <div className="admin-card-heading">
                    <div><span>HỢP ĐỒNG THÁNG {month.label}</span><h2 id="admin-contract-heading">Thống kê hợp đồng</h2></div>
                </div>
                {contractsError && <div className="admin-alert error">{contractsError}</div>}
                {contractsLoading ? <p className="admin-contract-message">Đang tải thống kê hợp đồng...</p> : !contractsError && <>
                    <div className="admin-contract-stats">
                        <article><span>Hợp đồng trong tháng</span><strong>{contracts.length}</strong></article>
                        <article><span>Kết thúc trong tháng</span><strong>{endingThisMonth.length}</strong></article>
                        <article><span>Phòng có hợp đồng</span><strong>{roomCount}</strong></article>
                        <article><span>Nhà trọ có hợp đồng</span><strong>{propertyCount}</strong></article>
                    </div>
                    <div className="admin-contract-subheading">5 hợp đồng kết thúc sớm nhất</div>
                    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Hợp đồng</th><th>Phòng</th><th>Người thuê</th><th>Bắt đầu</th><th>Kết thúc</th></tr></thead><tbody>
                        {upcomingContracts.map((contract) => <tr key={contract.id}><td><strong>#{contract.id}</strong></td><td>{contract.roomName || `Phòng #${contract.roomId}`}</td><td>{contract.tenantName || `Người thuê #${contract.tenantId}`}</td><td>{formatDate(contract.startDate)}</td><td>{formatDate(contract.endDate)}</td></tr>)}
                        {!upcomingContracts.length && <tr><td colSpan="5" className="admin-empty">Chưa có hợp đồng hiệu lực trong tháng này.</td></tr>}
                    </tbody></table></div>
                </>}
            </section>
        </AdminLayout>
    );
}
export default AdminDashboard;
