import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Notifications from './Notifications';
import { broadcastNotification, getMyNotifications, getSentNotifications, markNotificationAsRead } from '../services/notificationService';

const auth = vi.hoisted(() => ({ user: { roles: ['ADMIN'], username: 'admin' } }));
vi.mock('../hooks/useAuth', () => ({ default: () => auth }));
vi.mock('../components/AccountNavigation', () => ({ default: () => <nav>Menu</nav> }));
vi.mock('../services/userService', () => ({ getMyProfile: vi.fn().mockResolvedValue({ fullName: 'Admin' }) }));
vi.mock('../services/notificationService', () => ({
    getMyNotifications: vi.fn(), getSentNotifications: vi.fn(), broadcastNotification: vi.fn(), markNotificationAsRead: vi.fn(),
}));

describe('notification dashboard', () => {
    let container;
    let root;
    beforeEach(() => {
        global.IS_REACT_ACT_ENVIRONMENT = true;
        auth.user = { roles: ['ADMIN'], username: 'admin' };
        getMyNotifications.mockResolvedValue([]);
        getSentNotifications.mockReset().mockResolvedValue([]);
        markNotificationAsRead.mockReset();
        broadcastNotification.mockReset().mockResolvedValue('Gửi thông báo thành công');
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });
    const renderPage = async () => act(async () => {
        root.render(<MemoryRouter><Notifications /></MemoryRouter>);
    });

    it('shows admin layout and sends the previewed content', async () => {
        await renderPage();
        expect(container.querySelector('.admin-shell')).not.toBeNull();
        expect(container.textContent).toContain('Lịch sử thông báo đã gửi');
        expect(container.querySelector('.notification-stats')).toBeNull();
        expect(container.querySelector('select')).toBeNull();
        const create = Array.from(container.querySelectorAll('button'))
            .find(button => button.textContent === 'Tạo thông báo');
        await act(async () => create.click());
        for (const [id, value, prototype] of [
            ['broadcast-title', 'Bảo trì', HTMLInputElement.prototype],
            ['broadcast-content', 'Bảo trì tối nay', HTMLTextAreaElement.prototype],
        ]) {
            await act(async () => {
                const input = container.querySelector(`#${id}`);
                Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
        expect(container.querySelector('.notification-compose-preview').textContent).toContain('Bảo trì tối nay');
        await act(async () => container.querySelector('form').dispatchEvent(
            new Event('submit', { bubbles: true, cancelable: true }),
        ));
        expect(broadcastNotification).toHaveBeenCalledWith({ title: 'Bảo trì', content: 'Bảo trì tối nay' });
        expect(container.textContent).toContain('Gửi thông báo thành công');
    });

    it.each(['OWNER', 'CUSTOMER'])('keeps %s on the personal inbox', async role => {
        auth.user = { roles: [role] };
        await renderPage();
        expect(container.querySelector('.admin-shell')).toBeNull();
        expect(container.textContent).not.toContain('Tạo thông báo');
    });

    it('opens sent history without marking recipient notifications as read', async () => {
        getSentNotifications.mockResolvedValue([
            { id: 4, title: 'Thông báo cũ', content: 'Nội dung', status: 'UNREAD' },
        ]);
        await renderPage();
        expect(container.textContent).toContain('Đã gửi');
        expect(container.textContent).not.toContain('Chưa đọc');
        const detail = Array.from(container.querySelectorAll('button'))
            .find(button => button.textContent === 'Xem chi tiết');
        await act(async () => detail.click());
        expect(container.querySelector('[role="dialog"]')).not.toBeNull();
        expect(markNotificationAsRead).not.toHaveBeenCalled();
    });
});
