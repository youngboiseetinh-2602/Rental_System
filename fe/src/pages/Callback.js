import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Callback() {
    const navigate = useNavigate();
    const { authorize, handleCallback } = useAuth();
    const started = useRef(false);
    const [error, setError] = useState('');
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        if (started.current) {
            return;
        }
        started.current = true;

        const callbackSearch = window.location.search;
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
        );

        handleCallback(callbackSearch)
            .then((destination) => {
                navigate(destination || '/', { replace: true });
            })
            .catch((callbackError) => {
                setError(
                    callbackError.message
                    || 'Không thể hoàn tất quá trình đăng nhập.',
                );
            });
    }, [handleCallback, navigate]);

    const retryLogin = async () => {
        setRetrying(true);
        setError('');

        try {
            await authorize('/');
        } catch (loginError) {
            setError(loginError.message || 'Không thể bắt đầu lại đăng nhập.');
            setRetrying(false);
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h1 className="card-title mb-3" style={{ fontSize: '2rem' }}>
                            Hoàn tất đăng nhập
                        </h1>

                        {!error ? (
                            <div className="alert alert-info" role="status">
                                Đang xác minh callback và đổi Authorization Code...
                            </div>
                        ) : (
                            <>
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-success w-100"
                                    disabled={retrying}
                                    onClick={retryLogin}
                                >
                                    {retrying ? 'Đang chuyển hướng...' : 'Đăng nhập lại'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Callback;
