import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { userHasRole } from '../utils/authRouting';

function AdminRoute({ children }) {
    const location = useLocation();
    const { isAuthenticated, loading, user } = useAuth();
    if (loading) return <div className="admin-route-loading">Đang kiểm tra quyền quản trị...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
    if (!userHasRole(user, 'ADMIN')) return <Navigate to="/" replace />;
    return children;
}

export default AdminRoute;
