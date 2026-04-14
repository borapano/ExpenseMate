import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

// Shton tokenin automatikisht në çdo kërkesë
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

// Trajton rastet kur tokeni skadon
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // Nuk bëjmë redirect këtu me window.location që të mos thyejmë React Router
        }
        return Promise.reject(error);
    }
);

export default api;