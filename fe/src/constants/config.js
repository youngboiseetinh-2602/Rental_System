function withoutTrailingSlash(value) {
    return value.replace(/\/+$/, '');
}

export const AUTHORIZATION_SERVER_URL = withoutTrailingSlash(
    process.env.REACT_APP_AUTHORIZATION_SERVER_URL || 'http://localhost:8080',
);
export const RESOURCE_SERVER_URL = withoutTrailingSlash(
    process.env.REACT_APP_RESOURCE_SERVER_URL || 'http://localhost:8080',
);

export const OAUTH_CLIENT_ID =
    process.env.REACT_APP_OAUTH_CLIENT_ID || 'rental-spa';
export const OAUTH_REDIRECT_URI =
    process.env.REACT_APP_OAUTH_REDIRECT_URI || 'http://localhost:3000/callback';

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
