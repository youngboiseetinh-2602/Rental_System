vi.mock('./authService', () => {
    class AuthenticationExpiredError extends Error {}

    return {
        AuthenticationExpiredError,
        clearAuthSession: jest.fn(),
        getValidAccessToken: jest.fn(),
        redirectToLogin: jest.fn(),
    };
});

import {
    clearAuthSession,
    getValidAccessToken,
} from './authService';
import { apiFetch } from './apiClient';

const originalFetch = global.fetch;

describe('Resource Server API client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
        });
        getValidAccessToken.mockResolvedValue('access-jwt');
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('chỉ gửi Bearer JWT tới fixed Resource Server base URL', async () => {
        await apiFetch('/api/rooms');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toBe('http://localhost:8080/api/rooms');
        expect(options.credentials).toBe('omit');
        expect(options.headers.get('Authorization')).toBe('Bearer access-jwt');
    });

    it('từ chối absolute URL trước khi đọc hoặc gửi Access Token', async () => {
        await expect(
            apiFetch('https://attacker.example/collect'),
        ).rejects.toThrow('đường dẫn tương đối');

        expect(getValidAccessToken).not.toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('xóa phiên SPA khi Resource Server trả 401', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 401,
        });

        await apiFetch('/rooms');

        expect(clearAuthSession).toHaveBeenCalledTimes(1);
    });
});
