import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // `initializing` = true only during the very first mount check.
    // Components can use this to show a full-screen loader without
    // flickering on subsequent refreshUser() calls.
    const [initializing, setInitializing] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    // fetchUser is kept stable (useCallback with stable deps) so the
    // useEffect below only runs once on mount — no infinite re-render loops.
    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setInitializing(false);
            return;
        }
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (err) {
            // Token invalid or expired — clean up silently.
            // api.js interceptor will handle the redirect to /login for 401s.
            console.error('[AuthContext] fetchUser failed:', err?.response?.status);
            logout();
        } finally {
            setInitializing(false);
        }
    }, [logout]);

    // Run exactly once on mount to rehydrate the session from localStorage.
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Called by login pages after receiving a token.
    // Does NOT set a separate `loading` state — fetchUser handles it internally.
    const login = async (token) => {
        localStorage.setItem('token', token);
        await fetchUser();
    };

    // Exposed so components (e.g. after a profile update) can refresh
    // the user object without a full page reload.
    const refreshUser = fetchUser;

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                refreshUser,
                loading: initializing,          // kept as `loading` for backward compat
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);