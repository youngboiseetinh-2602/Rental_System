import React from 'react';
import { NavLink } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import AccountNavigation from '../components/AccountNavigation';
import RevenueOverview from '../components/RevenueOverview';
import useAuth from '../hooks/useAuth';

export default function RevenueStatistics({ admin = false }) {
    const { user } = useAuth();
    if (admin) {
        return <AdminLayout title="Thống kê" description="Theo dõi doanh thu chủ trọ và hoa hồng nền tảng theo tháng.">
            <RevenueOverview admin />
        </AdminLayout>;
    }
    const name = user?.fullName || user?.username || 'Chủ trọ';
    const initials = name.trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();
    return <div className="owner-dashboard">
        <aside className="owner-sidebar">
            <NavLink className="owner-profile" to="/profile">
                <span className="owner-avatar">{initials}</span>
                <span><strong>{name}</strong><small>Chủ trọ</small></span>
            </NavLink>
            <AccountNavigation user={user} />
        </aside>
        <section className="owner-main">
            <header className="owner-heading"><div><p>TRANG QUẢN LÝ CHỦ TRỌ</p><h1>Thống kê</h1></div></header>
            <RevenueOverview />
        </section>
    </div>;
}
