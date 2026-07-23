import { useState, useEffect } from 'react';

function useAuth() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return { user, setUser };
}

export default useAuth;
