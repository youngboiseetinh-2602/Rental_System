import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AuthContext from './AuthContext';
import {
    AUTH_SESSION_CHANGED_EVENT,
    AuthenticationExpiredError,
    completeAuthorization,
    loginWithCredentials,
    logout as logoutRequest,
    redirectToLogin,
    restoreAuthenticatedUser,
} from '../services/authService';
import { postLoginRoute } from '../utils/authRouting';
import { getMyProfile } from '../services/userService';

async function enrichAuthenticatedUser(tokenUser) {
    if (!tokenUser) return null;
    try {
        const profile = await getMyProfile();
        return {
            ...tokenUser,
            ...profile,
            roles: tokenUser.roles,
            scopes: tokenUser.scopes,
            expiresAt: tokenUser.expiresAt,
        };
    } catch (error) {
        return tokenUser;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState(null);

    const syncUser = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            const tokenUser = await restoreAuthenticatedUser();
            const currentUser = await enrichAuthenticatedUser(tokenUser);
            setUser(currentUser);
            return currentUser;
        } catch (requestError) {
            setUser(null);

            if (requestError instanceof AuthenticationExpiredError) {
                const returnTo =
                    `${window.location.pathname}${window.location.search}${window.location.hash}`;
                try {
                    await redirectToLogin(returnTo);
                    return null;
                } catch (redirectError) {
                    setError(redirectError);
                    throw redirectError;
                }
            }

            setError(requestError);
            throw requestError;
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        syncUser().catch(() => {
            // The error is exposed through context so the UI can remain usable.
        });

        const handleSessionChange = () => {
            syncUser(false).catch(() => {
                // The error is exposed through context so the UI can remain usable.
            });
        };
        window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);

        return () => {
            window.removeEventListener(
                AUTH_SESSION_CHANGED_EVENT,
                handleSessionChange,
            );
        };
    }, [syncUser]);

    useEffect(() => {
        if (!user?.expiresAt) {
            return undefined;
        }

        const reauthorizeAt = user.expiresAt - Date.now() - 30_000;
        const timeout = window.setTimeout(
            () => {
                syncUser(false).catch(() => {
                    // The error is exposed through context so the UI can remain usable.
                });
            },
            Math.max(0, Math.min(reauthorizeAt, 2_147_483_647)),
        );

        return () => window.clearTimeout(timeout);
    }, [syncUser, user?.expiresAt]);

    const authorize = useCallback((returnTo = '/') => {
        return redirectToLogin(returnTo);
    }, []);

    const login = useCallback(async (username, password, returnTo = '/') => {
        const redirectUrl = await loginWithCredentials(
            username,
            password,
            returnTo,
        );
        window.location.assign(redirectUrl);
    }, []);

    const logout = useCallback(async () => {
        setLoggingOut(true);
        setError(null);

        try {
            logoutRequest();
        } catch (requestError) {
            setError(requestError);
            throw requestError;
        } finally {
            setLoggingOut(false);
        }
    }, []);

    const handleCallback = useCallback(async (search) => {
        setLoading(true);
        setError(null);

        try {
            const result = await completeAuthorization(search);
            const currentUser = await enrichAuthenticatedUser(result.user);
            setUser(currentUser);
            return postLoginRoute(currentUser, result.returnTo);
        } catch (requestError) {
            setUser(null);
            setError(requestError);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, []);

    const auth = useMemo(() => ({
        user,
        loading,
        loggingOut,
        error,
        isAuthenticated: Boolean(user),
        authorize,
        login,
        logout,
        syncUser,
        handleCallback,
    }), [
        authorize,
        error,
        handleCallback,
        loading,
        loggingOut,
        login,
        logout,
        syncUser,
        user,
    ]);

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
}
