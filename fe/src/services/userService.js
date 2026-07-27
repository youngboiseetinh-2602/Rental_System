import { API_BASE_URL } from '../constants/config';

export async function registerUser(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseBody = responseText;
    try {
        responseBody = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
        // The current backend returns plain text for success and business errors.
    }

    if (!response.ok) {
        let message;
        if (responseBody && typeof responseBody === 'object') {
            message = responseBody.message
                || Object.entries(responseBody)
                    .map(([field, detail]) => `${field}: ${detail}`)
                    .join('. ');
        } else {
            message = responseBody;
        }

        const registrationError = new Error(
            message || response.statusText || 'Đăng ký thất bại',
        );
        registrationError.status = response.status;
        registrationError.fieldErrors =
            responseBody && typeof responseBody === 'object'
                ? responseBody
                : null;
        throw registrationError;
    }

    if (responseBody && typeof responseBody === 'object') {
        return responseBody.message || 'Đăng ký thành công';
    }

    return responseBody || 'Đăng ký thành công';
}
