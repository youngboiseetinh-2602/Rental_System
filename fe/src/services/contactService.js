import { API_BASE_URL } from '../constants/config';

export async function getAdminContact() {
    const response = await fetch(`${API_BASE_URL}/public/admin-contact`, {
        headers: { Accept: 'application/json' },
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch (error) { body = null; }
    if (!response.ok) {
        throw new Error(body?.message || text || 'Không thể tải thông tin quản trị viên.');
    }
    return body;
}
