import { API_BASE_URL } from '../constants/config';
import {
    AuthenticationExpiredError,
    clearAuthSession,
    getValidAccessToken,
    redirectToLogin,
} from './authService';

function toApiUrl(path) {
    if (typeof path !== 'string' || /^https?:\/\//i.test(path)) {
        throw new Error('API path phải là đường dẫn tương đối.');
    }

    let normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (normalizedPath === '/api') {
        normalizedPath = '';
    } else if (normalizedPath.startsWith('/api/')) {
        normalizedPath = normalizedPath.slice(4);
    }

    return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(path, options = {}) {
    const requestUrl = toApiUrl(path);
    let accessToken;
    try {
        accessToken = await getValidAccessToken();
    } catch (error) {
        if (error instanceof AuthenticationExpiredError) {
            const returnTo =
                `${window.location.pathname}${window.location.search}${window.location.hash}`;
            await redirectToLogin(returnTo);
        }
        throw error;
    }
    const headers = new Headers(options.headers || {});

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }
    headers.set('Authorization', `Bearer ${accessToken}`);

    const response = await fetch(requestUrl, {
        ...options,
        credentials: 'omit',
        headers,
    });

    if (response.status === 401) {
        clearAuthSession();
    }

    return response;
}
