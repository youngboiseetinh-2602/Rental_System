import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Login() {
    const location = useLocation();
    const [startingLogin, setStartingLogin] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [formValues, setFormValues] = useState({
        username: '',
        password: '',
    });
    const { user, loading, isAuthenticated, login } = useAuth();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleLogin = async (event) => {
        if (event?.preventDefault) {
            event.preventDefault();
        }
        setStartingLogin(true);
        setLoginError('');

        try {
            const stateFrom = location.state?.from;
            const returnTo =
                new URLSearchParams(location.search).get('returnTo')
                || location.state?.returnTo
                || (typeof stateFrom === 'string'
                    ? stateFrom
                    : stateFrom
                        ? `${stateFrom.pathname || ''}${stateFrom.search || ''}${stateFrom.hash || ''}`
                        : null)
                || '/dashboard';
            await login(
                formValues.username.trim(),
                formValues.password,
                returnTo,
            );
        } catch (error) {
            setLoginError(error.message || 'Không thể đăng nhập. Vui lòng thử lại.');
            setStartingLogin(false);
        }
    };

    return (
        <div className="row justify-content-center" style={{ marginTop: '48px' }}>
            <div className="col-md-8 col-lg-6">
                <div className="card shadow-sm" style={{ borderRadius: '22px' }}>
                    <div className="card-body" style={{ paddingTop: '32px' }}>
                        <h1 className="card-title mb-3 text-center" style={{ fontSize: '2rem' }}>
                            Đăng nhập
                        </h1>

                        {loading && (
                            <div className="alert alert-light" role="status">
                                Đang kiểm tra phiên đăng nhập...
                            </div>
                        )}

                        {!loading && isAuthenticated ? (
                            <>
                                <div className="alert alert-success">
                                    Bạn đang đăng nhập với tài khoản{' '}
                                    <strong>{user.username || user.name || 'hiện tại'}</strong>.
                                </div>
                                <NavLink className="btn btn-outline-success w-100" to="/">
                                    Về trang chủ
                                </NavLink>
                            </>
                        ) : !loading && (
                            <>
                                <form onSubmit={handleLogin}>
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
                                            autoComplete="username"
                                            autoFocus
                                            disabled={startingLogin}
                                            required
                                            minLength={4}
                                            maxLength={50}
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
                                            autoComplete="current-password"
                                            disabled={startingLogin}
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    {loginError && (
                                        <div className="alert alert-danger" role="alert">
                                            {loginError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn btn-success w-100"
                                        style={{ fontSize: '1.1rem' }}
                                        disabled={startingLogin}
                                    >
                                        {startingLogin ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                    </button>
                                </form>

                                <p className="mt-3 text-center">
                                    Nếu chưa có tài khoản,{' '}
                                    <NavLink className="text-success text-decoration-none" to="/register">
                                        đăng ký
                                    </NavLink>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
