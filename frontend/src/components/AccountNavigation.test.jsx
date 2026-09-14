import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AccountNavigation from './AccountNavigation';
import AdminLayout from './AdminLayout';

vi.mock('../hooks/useAuth', () => ({
    default: () => ({ user: { username: 'admin', roles: ['ADMIN'] } }),
}));
vi.mock('./ChatNavLink', () => ({
    default: () => <a href="/chats">Trò chuyện</a>,
}));
vi.mock('./NotificationNavLink', () => ({
    default: () => <a href="/notifications">Thông báo</a>,
}));

function renderMenu(element, path) {
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(
        <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>,
    );
    return container;
}

describe('account menu across pages', () => {
    it.each(['/admin', '/admin/users', '/admin/properties', '/admin/rental-types'])(
        'keeps the full profile menu on %s', (path) => {
            const profile = renderMenu(<AccountNavigation user={{ roles: ['ADMIN'] }} />, '/profile');
            const admin = renderMenu(<AdminLayout title="Quản trị" />, path);
            const destinations = (container) => Array.from(container.querySelectorAll('nav a'))
                .map((link) => link.getAttribute('href'));
            expect(destinations(admin)).toEqual(destinations(profile));
            expect(destinations(admin)).toContain('/chats');
            expect(destinations(admin)).toContain('/notifications');
            expect(admin.querySelectorAll('nav a[aria-current="page"]')).toHaveLength(1);
        },
    );

    it('highlights only create property when an owner opens the creation page', () => {
        const menu = renderMenu(<AccountNavigation user={{ roles: ['OWNER'] }} />, '/owner/properties/new');
        const active = menu.querySelectorAll('nav a[aria-current="page"]');
        expect(active).toHaveLength(1);
        expect(active[0].getAttribute('href')).toBe('/owner/properties/new');
        expect(menu.querySelectorAll('nav a')).toHaveLength(8);
    });
});
