import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
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
            const params = new URLSearchParams();
            params.append('username', email); // FastAPI OAuth2 expects 'username'
            params.append('password', password);

            const res = await axios.post('http://127.0.0.1:8000/auth/token', params);
            await login(res.data.access_token);
            navigate('/dashboard');
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) {
                setError('Invalid email or password. Please try again.');
            } else if (status === 400) {
                const detail = err.response?.data?.detail;
                setError(typeof detail === 'string' ? detail : 'Bad request. Please check your inputs.');
            } else {
                setError('Something went wrong. Please try again.');
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
                <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-secondary/20">

                    <h2 className="text-2xl font-bold text-primary mb-1">Welcome back</h2>
                    <p className="text-sm text-secondary font-medium mb-8">Sign in to your account to continue</p>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-5 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl text-center">
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
                                    placeholder="you@example.com"
                                    className="bg-white border border-secondary/20 rounded-xl pl-9 pr-3 py-2.5 w-full focus:ring-2 focus:ring-accent focus:border-primary outline-none transition-all text-primary placeholder:text-secondary/50"
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
                                    className="bg-white border border-secondary/20 rounded-xl pl-9 pr-3 py-2.5 w-full focus:ring-2 focus:ring-accent focus:border-primary outline-none transition-all text-primary placeholder:text-secondary/50"
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
                                    Signing in...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-secondary">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}