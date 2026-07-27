import { API_BASE_URL } from '../constants/config';

export async function registerUser(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responseBody = await response.text();
    if (!response.ok) {
        throw new Error(responseBody || response.statusText || 'Đăng ký thất bại');
    }

    return responseBody || 'Đăng ký thành công';
}
