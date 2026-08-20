import React from 'react';
import { NavLink } from 'react-router-dom';
import AccountMenuIcon from './AccountMenuIcon';
import ChatNavLink from './ChatNavLink';
import NotificationNavLink from './NotificationNavLink';
import OwnerRentalRequestNavLink from './OwnerRentalRequestNavLink';
import { userHasRole } from '../utils/authRouting';

function AccountNavigation({ user }) {
    const isAdmin = userHasRole(user, 'ADMIN');
    const isOwner = userHasRole(user, 'OWNER');

    if (isAdmin) {
        return (
            <nav aria-label="Menu quản trị viên">
                <NavLink to="/admin" end><AccountMenuIcon name="home" /> Tổng quan</NavLink>
                <NavLink to="/profile"><AccountMenuIcon name="profile" /> Thông tin cá nhân</NavLink>
                <NavLink to="/admin/users"><AccountMenuIcon name="requests" /> Danh sách người dùng</NavLink>
                <NavLink to="/admin/properties"><AccountMenuIcon name="properties" /> Danh sách phòng trọ</NavLink>
                <NavLink to="/admin/rental-types"><AccountMenuIcon name="properties" /> Loại hình cho thuê</NavLink>
                <ChatNavLink />
                <NotificationNavLink />
            </nav>
        );
    }

    if (isOwner) {
        return (
            <nav aria-label="Menu chủ trọ">
                <NavLink to="/owner/dashboard" end><AccountMenuIcon name="home" /> Tổng quan</NavLink>
                <NavLink to="/profile"><AccountMenuIcon name="profile" /> Thông tin cá nhân</NavLink>
                <NavLink to="/owner/properties"><AccountMenuIcon name="properties" /> Danh sách phòng trọ</NavLink>
                <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" /> Tạo phòng trọ</NavLink>
                <OwnerRentalRequestNavLink icon={<AccountMenuIcon name="requests" />} />
                <NavLink to="/owner/contracts"><AccountMenuIcon name="contract" /> Hợp đồng thuê</NavLink>
                <ChatNavLink />
                <NotificationNavLink />
            </nav>
        );
    }

    return (
        <nav aria-label="Menu khách thuê">
            <NavLink to="/dashboard" end><AccountMenuIcon name="home" /> Trang chủ</NavLink>
            <NavLink to="/profile"><AccountMenuIcon name="profile" /> Thông tin cá nhân</NavLink>
            <NavLink to="/yeu-cau-thue-tro"><AccountMenuIcon name="requests" /> Yêu cầu thuê trọ</NavLink>
            <ChatNavLink />
            <NotificationNavLink />
        </nav>
    );
}

export default AccountNavigation;
