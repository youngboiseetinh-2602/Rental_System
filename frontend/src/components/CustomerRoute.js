import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { userHasRole } from '../utils/authRouting';

function CustomerRoute({ children }) {
    const location = useLocation();
    const {
        isAuthenticated,
        loading,
        user,
    } = useAuth();

    if (loading) {
        return (
            <div className="container py-5 text-center" role="status">
                Đang kiểm tra phiên đăng nhập...
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    if (!userHasRole(user, 'CUSTOMER')) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default CustomerRoute;
