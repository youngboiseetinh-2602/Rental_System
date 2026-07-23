const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export async function login(credentials) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    return response.json();
}
