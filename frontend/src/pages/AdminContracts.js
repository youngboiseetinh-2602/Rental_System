import React from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminContractOverview from '../components/AdminContractOverview';

function AdminContracts() {
    return (
        <AdminLayout title="Thống kê hợp đồng" description="Theo dõi các hợp đồng còn hiệu lực trong tháng hiện tại.">
            <AdminContractOverview />
        </AdminLayout>
    );
}

export default AdminContracts;
