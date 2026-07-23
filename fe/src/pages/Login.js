import React, { useState } from 'react';
import { login as loginRequest } from '../services/authService';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await loginRequest({ email, password });
            setMessage(response.message || 'Login successful.');
        } catch (error) {
            setMessage('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h1 className="card-title mb-4" style={{ fontSize: '2rem' }}>Login</h1>
                        {message && <div className="alert alert-info" style={{ fontSize: '1.1rem' }}>{message}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label" style={{ fontSize: '1.1rem' }}>
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    style={{ fontSize: '1.05rem' }}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label" style={{ fontSize: '1.1rem' }}>
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    style={{ fontSize: '1.05rem' }}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100" style={{ fontSize: '1.1rem' }}>
                                Sign In
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
