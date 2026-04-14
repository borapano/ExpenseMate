import axios from 'axios';

// Krijojmë instancën e axios me IP-në direkte për të shmangur vonesat e DNS (localhost)
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    }
});

/**
 * INTERCEPTOR PËR REQUEST:
 * Ky bllok kodi ekzekutohet PARA se çdo kërkesë të niset drejt Backend-it.
 * Ai merr Token-in nga memorja e browser-it dhe e shton në Header.
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Shton "Bearer <token>" që kërkon FastAPI te get_current_user
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * INTERCEPTOR PËR RESPONSE:
 * Ky bllok kodi ekzekutohet PASI vjen përgjigja nga Backend-i.
 * Nëse serveri thotë që Token-i ka skaduar (401), ne e pastrojmë memorjen.
 */
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Token-i ka skaduar ose është i pavlefshëm. Po pastroj memorjen...");
            localStorage.removeItem('token');
            // Mund të shtohet një window.location.href = '/login' këtu nëse dëshiron 
            // që përdoruesi të dalë jashtë automatikisht.
        }
        return Promise.reject(error);
    }
);

export default api;