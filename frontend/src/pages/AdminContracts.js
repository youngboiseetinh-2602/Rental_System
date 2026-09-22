import React from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminContractOverview from '../components/AdminContractOverview';

function AdminContracts() {
    return (
        <AdminLayout title="Thống kê hợp đồng" description="Tìm kiếm hợp đồng theo khoảng tháng và trạng thái.">
            <AdminContractOverview />
        </AdminLayout>
    );
}

export default AdminContracts;
