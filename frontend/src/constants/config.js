function withoutTrailingSlash(value) {
    return value.replace(/\/+$/, '');
}

const BACKEND_BASE_URL = withoutTrailingSlash(
    import.meta.env.VITE_API_BASE_URL,
);

export const AUTHORIZATION_SERVER_URL = withoutTrailingSlash(
    import.meta.env.VITE_AUTHORIZATION_SERVER_URL || BACKEND_BASE_URL,
);
export const RESOURCE_SERVER_URL = withoutTrailingSlash(
    import.meta.env.VITE_RESOURCE_SERVER_URL || BACKEND_BASE_URL,
);

export const OAUTH_CLIENT_ID =
    import.meta.env.VITE_OAUTH_CLIENT_ID || 'rental-spa';
export const OAUTH_REDIRECT_URI =
    import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/callback`;

export const OAUTH_AUTHORIZATION_ENDPOINT =
    `${AUTHORIZATION_SERVER_URL}/oauth2/authorize`;
export const OAUTH_TOKEN_ENDPOINT =
    `${AUTHORIZATION_SERVER_URL}/oauth2/token`;
export const AUTH_LOGIN_ENDPOINT =
    `${AUTHORIZATION_SERVER_URL}/auth/login`;

export const OAUTH_SCOPES = [
    'room.read',
    'room.write',
    'user.read',
    'user.write',
    'booking.read',
    'booking.write',
];

export const API_BASE_URL = `${RESOURCE_SERVER_URL}/api`;
export const WEBSOCKET_URL = `${RESOURCE_SERVER_URL.replace(/^http/, 'ws')}/ws`;
