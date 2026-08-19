import { apiFetch } from './apiClient';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]);

function validateImage(file) {
    if (!(file instanceof File) || file.size === 0) {
        throw new Error('Vui lòng chọn một tệp ảnh.');
    }
    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error('Ảnh không được vượt quá 5 MB.');
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        throw new Error('Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc GIF.');
    }
}

async function readBody(response) {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch (error) {
        return text;
    }
}

function safeFileName(file, prefix) {
    const originalName = file.name || 'image';
    const normalizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${prefix}-${Date.now()}-${normalizedName}`;
}

export async function uploadImageToImageKit(file, { folder, prefix = 'image' }) {
    validateImage(file);

    const authResponse = await apiFetch('/api/system/imagekit/auth');
    const auth = await readBody(authResponse);
    if (!authResponse.ok) {
        throw new Error(auth?.message || auth || 'Không thể xác thực tải ảnh.');
    }
    if (!auth?.token || !auth?.signature || !auth?.expire || !auth?.publicKey) {
        throw new Error('Thông tin xác thực tải ảnh không hợp lệ.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', safeFileName(file, prefix));
    formData.append('publicKey', auth.publicKey);
    formData.append('token', auth.token);
    formData.append('signature', auth.signature);
    formData.append('expire', String(auth.expire));
    formData.append('folder', folder);
    formData.append('useUniqueFileName', 'true');

    const uploadResponse = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: 'POST',
        body: formData,
    });
    const result = await readBody(uploadResponse);
    if (!uploadResponse.ok) {
        throw new Error(
            result?.message || result?.help || result || 'Không thể tải ảnh lên ImageKit.',
        );
    }
    if (!result?.url) {
        throw new Error('ImageKit không trả về đường dẫn ảnh hợp lệ.');
    }

    return result.url;
}
