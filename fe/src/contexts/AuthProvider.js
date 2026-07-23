import React from 'react';
import AuthContext from './AuthContext';
import useAuth from '../hooks/useAuth';

export function AuthProvider({ children }) {
    const auth = useAuth();

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
}
