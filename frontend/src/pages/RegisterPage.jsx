import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Handshake, User, Mail, Phone, Lock, Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone_number: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [passwordError, setPasswordError] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'password') {
            setPasswordError(value.length > 0 && value.length < 8
                ? 'Password must be at least 8 characters.'
                : ''
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.password.length < 8) {
            setPasswordError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);

        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            ...(formData.phone_number.trim() && { phone_number: formData.phone_number.trim() }),
        };

        try {
            await api.post('/users/', payload);
            setSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            const status = err.response?.status;
            const detail = err.response?.data?.detail;

            if (detail === 'EMAIL_ALREADY_EXISTS') {
                setError('An account with this email already exists.');
            } else if (status === 400) {
                setError('Bad request. Please check the information provided.');
            } else if (status === 401) {
                setError('Unauthorized. Please check your credentials.');
            } else if (Array.isArray(detail)) {
                setError(detail[0].msg);
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'bg-white border border-secondary/30 rounded-xl pl-9 pr-3 py-2.5 w-full focus:ring-2 focus:ring-accent focus:border-primary outline-none transition-all text-primary placeholder:text-secondary/50';
    const labelClass = 'text-xs font-bold text-primary mb-1 block uppercase tracking-wider';

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
            <div className="bg-surface/30 md:w-1/2 flex items-center justify-center px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-secondary/20">

                    <h2 className="text-2xl font-bold text-primary mb-1">Create your account</h2>
                    <p className="text-sm text-secondary font-medium mb-8">
                        Already have one?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Log in
                        </Link>
                    </p>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-5 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    {/* Success Banner */}
                    {success && (
                        <div className="mb-5 p-3 text-sm font-semibold text-primary bg-accent/20 border border-accent rounded-xl text-center">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Full Name */}
                        <div>
                            <label htmlFor="name" className={labelClass}>Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Jane Doe"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className={labelClass}>Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Phone Number (optional) */}
                        <div>
                            <label htmlFor="phone_number" className={labelClass}>
                                Phone Number{' '}
                                <span className="text-secondary font-normal normal-case tracking-normal">(optional)</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                                <input
                                    id="phone_number"
                                    name="phone_number"
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    placeholder="+1 555 000 0000"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className={labelClass}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 8 characters"
                                    className={`${inputClass} ${passwordError ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                                />
                            </div>
                            {passwordError && (
                                <p className="mt-1 text-xs text-red-500">{passwordError}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent text-primary rounded-xl px-6 py-3 font-semibold hover:brightness-105 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}