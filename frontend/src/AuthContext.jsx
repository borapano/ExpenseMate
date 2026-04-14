import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Përdorim useCallback për të parandaluar loop-et e pafundme në useEffect
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
    }, []);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (err) {
            console.error("Auth error during fetchUser:", err);
            logout(); // Pastron gjithçka nëse tokeni është i pavlefshëm
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (token) => {
        localStorage.setItem('token', token);
        setLoading(true);
        await fetchUser();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);