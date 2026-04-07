import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('username', email); // FastAPI kërkon 'username' për OAuth2
            params.append('password', password);

            const res = await axios.post('http://127.0.0.1:8000/auth/token', params);
            login(res.data.access_token); // Kjo rregullon çdo gjë globalisht
            navigate('/dashboard');
        } catch (err) {
            setError('Email ose fjalëkalim i gabuar.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">ExpenseMate</h2>
                {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Fjalëkalimi" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        onChange={(e) => setPassword(e.target.value)} required />
                    <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition">Hyni</button>
                </form>
                <p className="mt-6 text-center text-gray-600">Nuk keni llogari? <Link to="/register" className="text-indigo-600 hover:underline">Regjistrohuni</Link></p>
            </div>
        </div>
    );
}