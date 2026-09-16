import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import { sendAdminNotification } from '../services/notificationService';

vi.mock('../components/AdminLayout', () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock('../services/adminService', () => ({
    getAdminUsers: vi.fn().mockResolvedValue({ content: [
        { id: 42, username: 'tenant', fullName: 'Khách thuê A', role: 'CUSTOMER', status: 'ACTIVE' },
    ], totalElements: 1, totalPages: 1 }),
    updateAdminUserStatus: vi.fn(),
}));
vi.mock('../services/notificationService', () => ({ sendAdminNotification: vi.fn() }));

describe('admin sends notification from user list', () => {
    let container;
    let root;
    beforeEach(async () => {
        global.IS_REACT_ACT_ENVIRONMENT = true;
        sendAdminNotification.mockReset().mockResolvedValue('Gửi thông báo thành công');
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        await act(async () => root.render(<MemoryRouter><AdminUsers /></MemoryRouter>));
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });
    async function compose() {
        await act(async () => container.querySelector('tbody button').click());
        for (const [id, value, prototype] of [
            ['user-notification-title', ' Nhắc nhở ', HTMLInputElement.prototype],
            ['user-notification-content', ' Nội dung riêng ', HTMLTextAreaElement.prototype],
        ]) {
            await act(async () => {
                const input = container.querySelector(`#${id}`);
                Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
    }
    async function submit() {
        await act(async () => container.querySelector('#user-notification-title').closest('form')
            .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    }
    it('sends to the chosen user with DTO fields only', async () => {
        await compose();
        await submit();
        expect(sendAdminNotification).toHaveBeenCalledWith(42, {
            title: 'Nhắc nhở', content: 'Nội dung riêng',
        });
        expect(container.textContent).toContain('Đã gửi thông báo đến Khách thuê A');
        expect(container.querySelector('#user-notification-title')).toBeNull();
    });
    it('retains recipient and draft when sending fails', async () => {
        sendAdminNotification.mockRejectedValue(new Error('Không thể gửi'));
        await compose();
        await submit();
        expect(container.querySelector('[role="alert"]').textContent).toBe('Không thể gửi');
        expect(container.querySelector('#user-notification-content').value).toBe(' Nội dung riêng ');
    });
});
