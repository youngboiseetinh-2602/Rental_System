import {
    defaultAuthenticatedRoute,
    postLoginRoute,
    userHasRole,
} from './authRouting';

describe('điều hướng theo role sau đăng nhập', () => {
    const customer = { roles: ['CUSTOMER'] };
    const owner = { roles: ['ROLE_OWNER'] };

    it('đưa CUSTOMER vào dashboard', () => {
        expect(userHasRole(customer, 'CUSTOMER')).toBe(true);
        expect(defaultAuthenticatedRoute(customer)).toBe('/dashboard');
        expect(postLoginRoute(customer, '/')).toBe('/dashboard');
    });

    it('không cho role khác đi vào customer dashboard', () => {
        expect(defaultAuthenticatedRoute(owner)).toBe('/owner/dashboard');
        expect(postLoginRoute(owner, '/dashboard')).toBe('/owner/dashboard');
    });

    it('giữ returnTo nội bộ hợp lệ và loại URL không an toàn', () => {
        expect(postLoginRoute(customer, '/phong-tro?city=hanoi')).toBe(
            '/phong-tro?city=hanoi',
        );
        expect(postLoginRoute(customer, '//attacker.example')).toBe('/dashboard');
        expect(postLoginRoute(owner, 'https://attacker.example')).toBe('/owner/dashboard');
        expect(postLoginRoute(customer, '/callback')).toBe('/dashboard');
    });
});
