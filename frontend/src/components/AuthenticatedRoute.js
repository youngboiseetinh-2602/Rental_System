import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function AuthenticatedRoute({ children }) {
    const location = useLocation();
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="container py-5 text-center" role="status">Đang kiểm tra phiên đăng nhập...</div>;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return children;
}

export default AuthenticatedRoute;
