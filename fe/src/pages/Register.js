import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/userService';

const ROLE_OPTIONS = [
    { value: 'OWNER', label: 'Chủ nhà' },
    { value: 'CUSTOMER', label: 'Người thuê' },
];

const GENDER_OPTIONS = [
    { value: '', label: 'Chọn giới tính' },
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
];

function Register() {
    const navigate = useNavigate();
    const [formValues, setFormValues] = useState({
        username: '',
        fullName: '',
        phoneNumber: '',
        password: '',
        citizenCode: '',
        gender: '',
        role: 'CUSTOMER',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const payload = {
                username: formValues.username.trim(),
                fullName: formValues.fullName.trim(),
                phoneNumber: formValues.phoneNumber.trim() || null,
                password: formValues.password,
                citizenCode: formValues.citizenCode.trim(),
                gender: formValues.gender || null,
                role: formValues.role,
            };

            await registerUser(payload);
            navigate('/login', {
                replace: true,
                state: {
                    username: payload.username,
                    registrationMessage:
                        'Đăng ký thành công. Vui lòng đăng nhập.',
                },
            });
        } catch (registrationError) {
            setError(registrationError.message || 'Đăng ký không thành công.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="row justify-content-center" style={{ marginTop: '48px' }}>
            <div className="col-md-8 col-lg-6">
                <div className="card shadow-sm" style={{ borderRadius: '22px' }}>
                    <div className="card-body" style={{ paddingTop: '32px' }}>
                        <h1 className="card-title mb-3 text-center" style={{ fontSize: '2rem' }}>
                            Đăng ký
                        </h1>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="username">
                                    Tên đăng nhập
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    className="form-control"
                                    value={formValues.username}
                                    onChange={handleChange}
                                    placeholder="Nhập tên đăng nhập"
                                    required
                                    minLength={4}
                                    maxLength={50}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="fullName">
                                    Họ và tên
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    className="form-control"
                                    value={formValues.fullName}
                                    onChange={handleChange}
                                    placeholder="Nhập họ và tên"
                                    required
                                    maxLength={100}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="phoneNumber">
                                    Số điện thoại
                                </label>
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    className="form-control"
                                    value={formValues.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Nhập số điện thoại (tùy chọn)"
                                    maxLength={20}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="password">
                                    Mật khẩu
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className="form-control"
                                    value={formValues.password}
                                    onChange={handleChange}
                                    placeholder="Nhập mật khẩu"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label" htmlFor="citizenCode">
                                    CMND/CCCD
                                </label>
                                <input
                                    id="citizenCode"
                                    name="citizenCode"
                                    type="text"
                                    className="form-control"
                                    value={formValues.citizenCode}
                                    onChange={handleChange}
                                    placeholder="Nhập 12 chữ số CMND/CCCD"
                                    required
                                    maxLength={12}
                                    minLength={12}
                                />
                            </div>

                            <div className="mb-3 row gx-3">
                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor="gender">
                                        Giới tính
                                    </label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        className="form-select"
                                        value={formValues.gender}
                                        onChange={handleChange}
                                    >
                                        {GENDER_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor="role">
                                        Đăng ký với vai trò
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        className="form-select"
                                        value={formValues.role}
                                        onChange={handleChange}
                                        required
                                    >
                                        {ROLE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success w-100"
                                disabled={submitting}
                            >
                                {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
