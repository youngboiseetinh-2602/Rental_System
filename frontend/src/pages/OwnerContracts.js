import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AccountMenuIcon from '../components/AccountMenuIcon';
import ChatNavLink from '../components/ChatNavLink';
import NotificationNavLink from '../components/NotificationNavLink';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import useAuth from '../hooks/useAuth';
import {
    getOwnerContracts,
    getOwnerProperties,
} from '../services/ownerService';
import { getMyProfile } from '../services/userService';

const statusLabels = {
    APPROVED: 'Đang hiệu lực',
    TERMINATED: 'Đã kết thúc',
    EXPIRED: 'Đã hết hạn',
};

function formatDate(value) {
    if (!value) return 'Không thời hạn';
    const [year, month, day] = String(value).split('T')[0].split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
}

function OwnerContracts() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [properties, setProperties] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([
            getMyProfile(),
            getOwnerContracts(),
            getOwnerProperties(),
        ])
            .then(([profileData, contractData, propertyData]) => {
                if (!active) return;
                setProfile(profileData);
                setContracts(Array.isArray(contractData) ? contractData : []);
                setProperties(Array.isArray(propertyData) ? propertyData : []);
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const displayName = profile?.fullName || user?.username || 'Chủ trọ';
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((word) => word[0]).join('').toUpperCase();
    const propertyNames = useMemo(() => new Map(
        properties.map((property) => [property.id, property.name]),
    ), [properties]);
    const counts = useMemo(() => contracts.reduce((result, contract) => ({
        ...result,
        [contract.status]: (result[contract.status] || 0) + 1,
    }), {}), [contracts]);
    const visibleContracts = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase('vi');
        return contracts.filter((contract) => {
            if (filter !== 'ALL' && contract.status !== filter) return false;
            if (!keyword) return true;
            const propertyName = propertyNames.get(contract.rentalPropertyId);
            return [
                propertyName,
                contract.roomName,
                contract.tenantName,
                contract.id,
            ].some((value) => String(value || '')
                .toLocaleLowerCase('vi').includes(keyword));
        });
    }, [contracts, filter, propertyNames, search]);

    return (
        <div className="owner-dashboard owner-contracts-page">
            <aside className="owner-sidebar">
                <NavLink className="owner-profile" to="/profile">
                    <span className="owner-avatar">{profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" /> : initials}</span>
                    <span><strong>{displayName}</strong><small>Chủ trọ</small></span>
                </NavLink>
                <nav>
                    <NavLink to="/owner/dashboard"><AccountMenuIcon name="home" />Tổng quan</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" />Thông tin cá nhân</NavLink>
                    <NavLink to="/owner/properties"><AccountMenuIcon name="properties" />Danh sách phòng trọ</NavLink>
                    <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" />Tạo phòng trọ</NavLink>
                    <OwnerRentalRequestNavLink icon={<AccountMenuIcon name="requests" />} />
                    <NavLink to="/owner/contracts"><AccountMenuIcon name="contract" />Hợp đồng thuê</NavLink>
                    <ChatNavLink />
                    <NotificationNavLink />
                </nav>
            </aside>

            <main className="owner-main">
                <header className="owner-properties-heading">
                    <div>
                        <p>QUẢN LÝ HỢP ĐỒNG</p>
                        <h1>Hợp đồng thuê</h1>
                        <span>Theo dõi hợp đồng tại tất cả nhà trọ của bạn</span>
                    </div>
                </header>

                {error && <div className="profile-alert is-error">{error}</div>}

                <section className="owner-contract-stats">
                    <article><span>Tổng hợp đồng</span><strong>{contracts.length}</strong></article>
                    <article><span>Đang hiệu lực</span><strong>{counts.APPROVED || 0}</strong></article>
                    <article><span>Đã kết thúc</span><strong>{counts.TERMINATED || 0}</strong></article>
                    <article><span>Đã hết hạn</span><strong>{counts.EXPIRED || 0}</strong></article>
                </section>

                <section className="owner-contract-card">
                    <div className="owner-contract-toolbar">
                        <input type="search" value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm theo nhà trọ, phòng, người thuê..." />
                        <select value={filter}
                            onChange={(event) => setFilter(event.target.value)}>
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="APPROVED">Đang hiệu lực</option>
                            <option value="TERMINATED">Đã kết thúc</option>
                            <option value="EXPIRED">Đã hết hạn</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="owner-contract-empty">Đang tải danh sách hợp đồng...</div>
                    ) : visibleContracts.length === 0 ? (
                        <div className="owner-contract-empty">
                            <span>▤</span>
                            <h2>Chưa có hợp đồng phù hợp</h2>
                            <p>Hợp đồng được chấp nhận sẽ xuất hiện tại đây.</p>
                        </div>
                    ) : (
                        <div className="owner-contract-table-wrap">
                            <table className="owner-contract-table">
                                <thead>
                                    <tr>
                                        <th>Hợp đồng</th>
                                        <th>Nhà trọ / Phòng</th>
                                        <th>Người thuê</th>
                                        <th>Bắt đầu</th>
                                        <th>Kết thúc</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleContracts.map((contract) => (
                                        <tr key={contract.id}>
                                            <td><strong>#{contract.id}</strong></td>
                                            <td>
                                                <strong>{propertyNames.get(contract.rentalPropertyId)
                                                    || `Nhà trọ #${contract.rentalPropertyId}`}</strong>
                                                <small>{contract.roomName
                                                    || `Phòng #${contract.roomId}`}</small>
                                            </td>
                                            <td>{contract.tenantName
                                                || `Người thuê #${contract.tenantId}`}</td>
                                            <td>{formatDate(contract.startDate)}</td>
                                            <td>{formatDate(contract.endDate)}</td>
                                            <td><span className={`owner-contract-status is-${String(
                                                contract.status).toLowerCase()}`}>
                                                {statusLabels[contract.status] || contract.status}
                                            </span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default OwnerContracts;
