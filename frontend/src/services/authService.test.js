import {
    TextDecoder as NodeTextDecoder,
    TextEncoder as NodeTextEncoder,
} from 'util';
import {
    AUTH_STORAGE_KEYS,
    AuthenticationExpiredError,
    authenticateWithCredentials,
    completeAuthorization,
    createAuthorizationRequest,
    loginWithCredentials,
    logout,
    restoreAuthenticatedUser,
} from './authService';

const originalCrypto = window.crypto;
const originalFetch = global.fetch;
const originalTextDecoder = global.TextDecoder;
const originalTextEncoder = global.TextEncoder;

function toBase64Url(value) {
    return window.btoa(JSON.stringify(value))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function createJwt(claims) {
    return `${toBase64Url({ alg: 'RS256' })}.${toBase64Url(claims)}.signature`;
}

function currentTransaction() {
    return JSON.parse(
        window.sessionStorage.getItem(AUTH_STORAGE_KEYS.transaction),
    );
}

function successfulTokenResponse(overrides = {}) {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    return {
        access_token: createJwt({
            sub: 'user-1',
            preferred_username: 'owner@example.com',
            roles: ['OWNER'],
            scope: 'room.read room.write',
            exp: expiresAt,
        }),
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'room.read room.write',
        ...overrides,
    };
}

describe('OAuth2 Authorization Code với PKCE', () => {
    beforeAll(() => {
        global.TextDecoder = global.TextDecoder || NodeTextDecoder;
        global.TextEncoder = global.TextEncoder || NodeTextEncoder;
    });

    beforeEach(() => {
        let randomSeed = 1;
        const cryptoMock = {
            getRandomValues: jest.fn((bytes) => {
                bytes.forEach((value, index) => {
                    bytes[index] = (index + randomSeed) % 256;
                });
                randomSeed += 1;
                return bytes;
            }),
            subtle: {
                digest: jest.fn(async () => Uint8Array.from(
                    { length: 32 },
                    (value, index) => index + 11,
                ).buffer),
            },
        };
        Object.defineProperty(window, 'crypto', {
            configurable: true,
            value: cryptoMock,
        });

        window.sessionStorage.clear();
        global.fetch = jest.fn();
    });

    afterAll(() => {
        Object.defineProperty(window, 'crypto', {
            configurable: true,
            value: originalCrypto,
        });
        global.fetch = originalFetch;
        global.TextDecoder = originalTextDecoder;
        global.TextEncoder = originalTextEncoder;
    });

    it('tạo authorize request có state và PKCE S256', async () => {
        const request = await createAuthorizationRequest('/rooms');
        const url = new URL(request);
        const transaction = currentTransaction();

        expect(`${url.origin}${url.pathname}`).toBe(
            'http://localhost:8080/oauth2/authorize',
        );
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('client_id')).toBe('rental-spa');
        expect(url.searchParams.get('redirect_uri')).toBe(
            'http://localhost:3000/callback',
        );
        expect(url.searchParams.get('scope')).toBe(
            'room.read room.write user.read user.write booking.read booking.write',
        );
        expect(url.searchParams.get('state')).toBe(transaction.state);
        expect(url.searchParams.has('nonce')).toBe(false);
        expect(transaction).not.toHaveProperty('nonce');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('code_challenge')).toBeTruthy();
        expect(transaction.codeVerifier.length).toBeGreaterThanOrEqual(43);
        expect(transaction.returnTo).toBe('/rooms');
        const [algorithm, challengeInput] =
            window.crypto.subtle.digest.mock.calls[0];
        expect(algorithm).toBe('SHA-256');
        expect(ArrayBuffer.isView(challengeInput)).toBe(true);
    });

    it('gửi form React và tiếp tục Authorization Code PKCE', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ redirectUrl: null }),
        });

        const redirectUrl = await loginWithCredentials(
            'owner@example.com',
            'secret-password',
            '/phong-tro?city=hanoi',
        );
        const transaction = currentTransaction();
        const loginRequest = global.fetch.mock.calls[0];

        expect(loginRequest[0]).toBe('http://localhost:8080/auth/login');
        expect(loginRequest[1]).toEqual(expect.objectContaining({
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }));
        expect(loginRequest[1].body).toBeInstanceOf(URLSearchParams);
        expect(loginRequest[1].body.get('username')).toBe('owner@example.com');
        expect(loginRequest[1].body.get('password')).toBe('secret-password');
        expect(new URL(redirectUrl).pathname).toBe('/oauth2/authorize');
        expect(transaction.returnTo).toBe('/phong-tro?city=hanoi');
    });

    it('ưu tiên redirectUrl do backend trả về sau khi đăng nhập', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                redirectUrl: 'http://localhost:8080/oauth2/authorize?saved=true',
            }),
        });

        await expect(
            loginWithCredentials('owner@example.com', 'secret-password', '/rooms'),
        ).resolves.toBe(
            'http://localhost:8080/oauth2/authorize?saved=true',
        );
        expect(window.sessionStorage.getItem(AUTH_STORAGE_KEYS.transaction)).toBeNull();
    });

    it('hiển thị lỗi chung khi username hoặc password không đúng', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({
                code: 'INVALID_CREDENTIALS',
                message: 'Tên đăng nhập hoặc mật khẩu không đúng.',
            }),
        });

        await expect(
            authenticateWithCredentials('owner@example.com', 'wrong-password'),
        ).rejects.toMatchObject({
            status: 401,
            code: 'INVALID_CREDENTIALS',
            message: 'Tên đăng nhập hoặc mật khẩu không đúng.',
        });
        expect(window.sessionStorage.getItem(AUTH_STORAGE_KEYS.transaction)).toBeNull();
    });

    it('validate state và chỉ exchange code một lần', async () => {
        const request = new URL(await createAuthorizationRequest('/rooms'));
        const transaction = currentTransaction();
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => successfulTokenResponse(),
        });

        const search =
            `?code=strict-mode-code&state=${encodeURIComponent(request.searchParams.get('state'))}`;
        const firstCallback = completeAuthorization(search);
        const secondCallback = completeAuthorization(search);

        expect(secondCallback).toBe(firstCallback);
        const [firstResult, secondResult] = await Promise.all([
            firstCallback,
            secondCallback,
        ]);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(firstResult.user.username).toBe('owner@example.com');
        expect(secondResult.returnTo).toBe('/rooms');
        expect(window.sessionStorage.getItem(AUTH_STORAGE_KEYS.transaction)).toBeNull();

        const tokenRequest = global.fetch.mock.calls[0];
        expect(tokenRequest[0]).toBe('http://localhost:8080/oauth2/token');
        expect(tokenRequest[1].credentials).toBe('omit');
        expect(tokenRequest[1].body.get('grant_type')).toBe('authorization_code');
        expect(tokenRequest[1].body.get('client_id')).toBe('rental-spa');
        expect(tokenRequest[1].body.get('code_verifier')).toBe(
            transaction.codeVerifier,
        );
        expect(tokenRequest[1].body.has('client_secret')).toBe(false);
        expect(tokenRequest[1].body.has('refresh_token')).toBe(false);

        const storedTokens = JSON.parse(
            window.sessionStorage.getItem(AUTH_STORAGE_KEYS.tokens),
        );
        expect(storedTokens.accessToken).toBeTruthy();
        expect(storedTokens).not.toHaveProperty('idToken');
        expect(storedTokens).not.toHaveProperty('refreshToken');
    });

    it('từ chối callback có state sai trước khi gọi token endpoint', async () => {
        await createAuthorizationRequest('/');

        await expect(
            completeAuthorization('?code=wrong-state-code&state=attacker'),
        ).rejects.toThrow('OAuth state không hợp lệ');

        expect(global.fetch).not.toHaveBeenCalled();
        expect(window.sessionStorage.getItem(AUTH_STORAGE_KEYS.tokens)).toBeNull();
        expect(window.sessionStorage.getItem(AUTH_STORAGE_KEYS.transaction)).toBeNull();
    });

    it('xóa JWT hết hạn thay vì sử dụng refresh token', async () => {
        window.sessionStorage.setItem(
            AUTH_STORAGE_KEYS.tokens,
            JSON.stringify({
                accessToken: createJwt({
                    sub: 'user-1',
                    exp: Math.floor(Date.now() / 1000) - 60,
                }),
                tokenType: 'Bearer',
                scope: 'room.read',
                expiresAt: Date.now() - 60_000,
            }),
        );

        await expect(restoreAuthenticatedUser()).rejects.toBeInstanceOf(
            AuthenticationExpiredError,
        );
        expect(window.sessionStorage.getItem(AUTH_STORAGE_KEYS.tokens)).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('đăng xuất chỉ xóa token và transaction của SPA', () => {
        window.sessionStorage.setItem(
            AUTH_STORAGE_KEYS.tokens,
            JSON.stringify({
                accessToken: createJwt({
                    sub: 'user-1',
                    exp: Math.floor(Date.now() / 1000) + 3600,
                }),
                tokenType: 'Bearer',
                scope: 'room.read',
                expiresAt: Date.now() + 3_600_000,
            }),
        );
        window.sessionStorage.setItem(
            AUTH_STORAGE_KEYS.transaction,
            JSON.stringify({ state: 'pending-state' }),
        );

        logout();

        expect(window.sessionStorage.getItem(AUTH_STORAGE_KEYS.tokens)).toBeNull();
        expect(window.sessionStorage.getItem(AUTH_STORAGE_KEYS.transaction)).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
