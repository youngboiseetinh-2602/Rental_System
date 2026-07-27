import { registerUser } from './userService';

const originalFetch = global.fetch;

describe('registerUser', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('gửi đúng payload tới API đăng ký public', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => 'dang ki thanh cong',
        });
        const payload = {
            username: 'customer01',
            fullName: 'Nguyen Van A',
            phoneNumber: null,
            password: 'secret123',
            citizenCode: '012345678901',
            gender: null,
            role: 'CUSTOMER',
        };

        await expect(registerUser(payload)).resolves.toBe('dang ki thanh cong');
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/auth/register',
            expect.objectContaining({
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }),
        );
    });

    it('chuyển validation JSON của backend thành lỗi dễ hiển thị', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: async () => JSON.stringify({
                citizenCode: 'Citizen code must be exactly 12 digits',
            }),
        });

        await expect(registerUser({})).rejects.toMatchObject({
            status: 400,
            message: 'citizenCode: Citizen code must be exactly 12 digits',
            fieldErrors: {
                citizenCode: 'Citizen code must be exactly 12 digits',
            },
        });
    });
});
