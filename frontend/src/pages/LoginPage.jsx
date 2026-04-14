import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Handshake, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Përdorim URLSearchParams për formatin x-www-form-urlencoded
            const params = new URLSearchParams();
            // .trim() dhe .toLowerCase() janë kritike për të shmangur gabimet e shkrimit
            params.append('username', email.trim().toLowerCase());
            params.append('password', password);

            // 2. Shtojmë headers specifikë që Axios të mos ketë konfuzion me CORS
            const res = await api.post('/auth/token', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // 3. Ruajmë token-in dhe kalojmë në dashboard
            await login(res.data.access_token);
            navigate('/dashboard');
        } catch (err) {
            console.error("Login Error:", err.response?.data); // Për debugging në Console

            const status = err.response?.status;
            const detail = err.response?.data?.detail;

            if (status === 401) {
                setError('Email ose fjalëkalim i gabuar. Ju lutem provoni përsëri.');
            } else if (status === 422) {
                setError('Të dhëna të papranueshme. Kontrolloni formatin e email-it.');
            } else {
                setError(typeof detail === 'string' ? detail : 'Diçka shkoi gabim. Provoni më vonë.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen">
            {/* ── LEFT: Brand Panel ── */}
            <div className="bg-primary md:w-1/2 flex flex-col items-center justify-center gap-6 py-16 px-8">
                <Handshake className="text-accent" size={64} strokeWidth={1.5} />
                <h1 className="text-5xl font-extrabold text-accent tracking-tight">Expense Mate</h1>
                <p className="text-surface text-center text-lg max-w-xs leading-relaxed">
                    Split bills, track balances, and settle up — effortlessly with your people.
                </p>
            </div>

            {/* ── RIGHT: Form Panel ── */}
            <div className="bg-surface/30 md:w-1/2 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-secondary/20 shadow-sm">
                    <h2 className="text-2xl font-bold text-primary mb-1">Mirëseerdhët</h2>
                    <p className="text-sm text-secondary font-medium mb-8">Identifikohuni në llogarinë tuaj</p>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-5 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="text-xs font-bold text-primary mb-1 block uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="emri@shembull.com"
                                    className="bg-white border border-secondary/20 rounded-xl pl-9 pr-3 py-2.5 w-full focus:ring-2 focus:ring-accent focus:border-primary outline-none transition-all text-primary"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="text-xs font-bold text-primary mb-1 block uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="bg-white border border-secondary/20 rounded-xl pl-9 pr-3 py-2.5 w-full focus:ring-2 focus:ring-accent focus:border-primary outline-none transition-all text-primary"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-accent text-primary rounded-xl px-6 py-3 font-semibold hover:brightness-105 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Duke u identifikuar...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-secondary">
                        Nuk keni një llogari?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline">
                            Krijoni një të re
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}