import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────────────────────
// Using 127.0.0.1 directly avoids DNS resolution overhead vs "localhost"
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    timeout: 15000, // 15s — prevents UI from hanging on a Neon cold-start
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Injects the JWT Bearer token into every outgoing request automatically.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles expired / invalid tokens globally.
// The `isRedirecting` guard prevents multiple concurrent 401 responses
// from all triggering a redirect race condition simultaneously.
let isRedirecting = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !isRedirecting) {
            isRedirecting = true;
            console.warn('[api] Token expired or invalid — redirecting to /login');
            localStorage.removeItem('token');
            // Use replace() so the browser history doesn't accumulate a broken entry
            window.location.replace('/login');
            // Reset the flag after navigation (small delay to let replace() fire)
            setTimeout(() => { isRedirecting = false; }, 2000);
        }
        return Promise.reject(error);
    }
);

export default api;