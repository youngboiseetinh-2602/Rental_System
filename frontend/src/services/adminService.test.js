import { getAdminDashboardContracts } from './adminService';
import { apiFetch } from './apiClient';

vi.mock('./apiClient', () => ({ apiFetch: vi.fn() }));

describe('admin contract dashboard API', () => {
    it('reports an outdated backend response instead of passing it to the page', async () => {
        apiFetch.mockResolvedValue(new Response('[]', { status: 200 }));

        await expect(getAdminDashboardContracts()).rejects.toThrow(
            'Backend chưa cập nhật API thống kê hợp đồng');
    });

    it('accepts paginated contracts', async () => {
        const page = { content: [], totalElements: 0, totalPages: 0 };
        apiFetch.mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }));

        await expect(getAdminDashboardContracts({ page: 1 })).resolves.toEqual(page);
        expect(apiFetch).toHaveBeenCalledWith('/api/admin/contracts/dashboard?page=1');
    });
});
