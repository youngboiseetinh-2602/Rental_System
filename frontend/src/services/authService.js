import {
    AUTH_LOGIN_ENDPOINT,
    OAUTH_AUTHORIZATION_ENDPOINT,
    OAUTH_CLIENT_ID,
    OAUTH_REDIRECT_URI,
    OAUTH_SCOPES,
    OAUTH_TOKEN_ENDPOINT,
} from '../constants/config';

const EXPIRY_SKEW_MS = 30_000;
const TRANSACTION_MAX_AGE_MS = 10 * 60 * 1000;

export const AUTH_SESSION_CHANGED_EVENT = 'rental:auth-session-changed';
export const AUTH_STORAGE_KEYS = Object.freeze({
    tokens: 'rental.oauth.tokens',
    transaction: 'rental.oauth.transaction',
});

const authorizationCallbackRequests = new Map();

export class AuthenticationRequiredError extends Error {
    constructor(message = 'Phiên đăng nhập đã hết hạn.') {
        super(message);
        this.name = 'AuthenticationRequiredError';
    }
}

export class AuthenticationExpiredError extends AuthenticationRequiredError {
    constructor() {
        super('Access Token đã hết hạn.');
        this.name = 'AuthenticationExpiredError';
    }
}

function emitSessionChanged() {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function parseStoredJson(key) {
    const value = window.sessionStorage.getItem(key);
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        window.sessionStorage.removeItem(key);
        return null;
    }
}

function bytesToBase64Url(bytes) {
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return window.btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function createRandomValue(byteLength) {
    if (!window.crypto?.getRandomValues) {
        throw new Error('Trình duyệt không hỗ trợ Web Crypto.');
    }

    const bytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(bytes);
    return bytesToBase64Url(bytes);
}

async function createCodeChallenge(codeVerifier) {
    if (!window.crypto?.subtle) {
        throw new Error('Trình duyệt không hỗ trợ PKCE bằng Web Crypto.');
    }

    const input = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', input);
    return bytesToBase64Url(new Uint8Array(digest));
}

function normalizeReturnTo(returnTo) {
    if (
        typeof returnTo !== 'string'
        || !returnTo.startsWith('/')
        || returnTo.startsWith('//')
    ) {
        return '/';
    }

    return returnTo;
}

function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = window.atob(`${normalized}${padding}`);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

export function decodeJwtClaims(jwt) {
    if (typeof jwt !== 'string') {
        return null;
    }

    const segments = jwt.split('.');
    if (segments.length !== 3) {
        return null;
    }

    try {
        const claims = JSON.parse(decodeBase64Url(segments[1]));
        return claims && typeof claims === 'object' ? claims : null;
    } catch (error) {
        return null;
    }
}

function jwtExpiresAt(jwt) {
    const claims = decodeJwtClaims(jwt);
    const expiration = Number(claims?.exp);
    return Number.isFinite(expiration) ? expiration * 1000 : null;
}

function normalizeTokenResponse(payload) {
    if (!payload?.access_token || typeof payload.access_token !== 'string') {
        throw new Error('Authorization Server không trả về Access Token hợp lệ.');
    }

    if (
        payload.token_type
        && String(payload.token_type).toLowerCase() !== 'bearer'
    ) {
        throw new Error('Authorization Server trả về token type không được hỗ trợ.');
    }

    const claimsExpiry = jwtExpiresAt(payload.access_token);
    if (!claimsExpiry) {
        throw new Error('Access Token không phải JWT có thời hạn hợp lệ.');
    }

    const expiresIn = Number(payload.expires_in);
    const responseExpiry = Number.isFinite(expiresIn) && expiresIn > 0
        ? Date.now() + (expiresIn * 1000)
        : null;
    const expiresAt = responseExpiry
        ? Math.min(responseExpiry, claimsExpiry)
        : claimsExpiry;

    return {
        accessToken: payload.access_token,
        tokenType: payload.token_type || 'Bearer',
        scope: payload.scope || '',
        expiresAt,
    };
}

function readTokenSet() {
    const tokens = parseStoredJson(AUTH_STORAGE_KEYS.tokens);
    const claimsExpiry = jwtExpiresAt(tokens?.accessToken);
    if (
        !tokens
        || typeof tokens.accessToken !== 'string'
        || !claimsExpiry
        || !Number.isFinite(Number(tokens.expiresAt))
    ) {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.tokens);
        return null;
    }

    return {
        ...tokens,
        expiresAt: Math.min(Number(tokens.expiresAt), claimsExpiry),
    };
}

function storeTokenSet(tokens) {
    window.sessionStorage.setItem(
        AUTH_STORAGE_KEYS.tokens,
        JSON.stringify(tokens),
    );
    emitSessionChanged();
}

export function clearAuthSession(emitChange = true) {
    const hadTokens = window.sessionStorage.getItem(AUTH_STORAGE_KEYS.tokens) !== null;
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.tokens);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.transaction);

    if (hadTokens && emitChange) {
        emitSessionChanged();
    }
}

function tokenNeedsRenewal(tokens) {
    return tokens.expiresAt <= Date.now() + EXPIRY_SKEW_MS;
}

async function readTokenResponse(response) {
    let payload;

    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        const message = payload?.error_description
            || payload?.error
            || `Token endpoint trả về HTTP ${response.status}.`;
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
    }

    return payload;
}

async function requestTokens(parameters) {
    const response = await fetch(OAUTH_TOKEN_ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(parameters),
    });

    return readTokenResponse(response);
}

async function readAuthenticationResponse(response, fallbackMessage) {
    let payload;

    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        const requestError = new Error(payload?.message || fallbackMessage);
        requestError.status = response.status;
        requestError.code = payload?.code;
        throw requestError;
    }

    if (!payload || typeof payload !== 'object') {
        throw new Error(fallbackMessage);
    }

    return payload;
}

export async function authenticateWithCredentials(username, password) {
    const response = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            username,
            password,
        }),
    });
    const payload = await readAuthenticationResponse(
        response,
        'Không thể đăng nhập. Vui lòng thử lại.',
    );

    return {
        redirectUrl:
            typeof payload.redirectUrl === 'string' && payload.redirectUrl
                ? payload.redirectUrl
                : null,
    };
}

export async function loginWithCredentials(
    username,
    password,
    returnTo = '/',
) {
    const result = await authenticateWithCredentials(username, password);

    if (result.redirectUrl) {
        return result.redirectUrl;
    }

    return createAuthorizationRequest(returnTo);
}

function rolesFromClaims(claims) {
    const roles = claims.roles ?? claims.role ?? [];
    return (Array.isArray(roles) ? roles : [roles])
        .filter(Boolean)
        .map(String);
}

function scopesFromClaims(claims, tokenScope) {
    const scopes = claims.scope ?? claims.scp ?? tokenScope ?? [];
    if (Array.isArray(scopes)) {
        return scopes.map(String);
    }

    return String(scopes).split(/\s+/).filter(Boolean);
}

export function userFromTokenSet(tokens) {
    const claims = decodeJwtClaims(tokens?.accessToken);
    if (!claims) {
        throw new Error('Không thể đọc claims từ Access Token.');
    }

    return {
        sub: claims.sub,
        userId: claims.userId || claims.user_id,
        username:
            claims.preferred_username
            || claims.username
            || claims.name
            || claims.sub,
        fullName: claims.fullName || claims.name || '',
        name: claims.name,
        roles: rolesFromClaims(claims),
        scopes: scopesFromClaims(claims, tokens.scope),
        expiresAt: tokens.expiresAt,
    };
}

export async function createAuthorizationRequest(returnTo = '/') {
    const state = createRandomValue(32);
    const codeVerifier = createRandomValue(64);
    const codeChallenge = await createCodeChallenge(codeVerifier);

    window.sessionStorage.setItem(
        AUTH_STORAGE_KEYS.transaction,
        JSON.stringify({
            state,
            codeVerifier,
            returnTo: normalizeReturnTo(returnTo),
            createdAt: Date.now(),
        }),
    );

    const authorizationUrl = new URL(OAUTH_AUTHORIZATION_ENDPOINT);
    authorizationUrl.search = new URLSearchParams({
        response_type: 'code',
        client_id: OAUTH_CLIENT_ID,
        redirect_uri: OAUTH_REDIRECT_URI,
        scope: OAUTH_SCOPES.join(' '),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    }).toString();

    return authorizationUrl.toString();
}

export async function redirectToLogin(returnTo = '/') {
    const authorizationUrl = await createAuthorizationRequest(returnTo);
    window.location.assign(authorizationUrl);
}

async function completeAuthorizationOnce(search) {
    const parameters = new URLSearchParams(search);
    const transaction = parseStoredJson(AUTH_STORAGE_KEYS.transaction);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.transaction);

    const returnedState = parameters.get('state');
    const createdAt = Number(transaction?.createdAt);
    if (
        !transaction
        || !returnedState
        || returnedState !== transaction.state
        || !Number.isFinite(createdAt)
        || Date.now() - createdAt > TRANSACTION_MAX_AGE_MS
        || createdAt > Date.now()
    ) {
        throw new Error('OAuth state không hợp lệ hoặc đã hết hạn.');
    }

    if (parameters.has('error')) {
        throw new Error(
            parameters.get('error_description')
            || parameters.get('error')
            || 'Authorization Server từ chối đăng nhập.',
        );
    }

    const authorizationCode = parameters.get('code');
    if (!authorizationCode || !transaction.codeVerifier) {
        throw new Error('Authorization callback không chứa code hợp lệ.');
    }

    const payload = await requestTokens({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: OAUTH_REDIRECT_URI,
        client_id: OAUTH_CLIENT_ID,
        code_verifier: transaction.codeVerifier,
    });

    const tokens = normalizeTokenResponse(payload);
    storeTokenSet(tokens);

    return {
        user: userFromTokenSet(tokens),
        returnTo: normalizeReturnTo(transaction.returnTo),
    };
}

export function completeAuthorization(search) {
    if (!authorizationCallbackRequests.has(search)) {
        authorizationCallbackRequests.set(
            search,
            completeAuthorizationOnce(search),
        );
    }

    return authorizationCallbackRequests.get(search);
}

async function validTokenSet() {
    const tokens = readTokenSet();
    if (!tokens) {
        throw new AuthenticationRequiredError();
    }

    if (!tokenNeedsRenewal(tokens)) {
        return tokens;
    }

    clearAuthSession();
    throw new AuthenticationExpiredError();
}

export async function restoreAuthenticatedUser() {
    try {
        const tokens = await validTokenSet();
        return userFromTokenSet(tokens);
    } catch (error) {
        if (error instanceof AuthenticationExpiredError) {
            throw error;
        }
        if (error instanceof AuthenticationRequiredError) {
            return null;
        }
        clearAuthSession();
        throw error;
    }
}

export async function getValidAccessToken() {
    const tokens = await validTokenSet();
    return tokens.accessToken;
}

export function logout() {
    clearAuthSession(false);
}
