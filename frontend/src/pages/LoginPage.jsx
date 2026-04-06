import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        console.log("Duke u loguar me:", formData);

        // Simulim API
        setTimeout(() => {
            // setError("Email ose fjalëkalim i gabuar"); // test
            setLoading(false);
            // navigate('/dashboard');
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">

                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Hyni në llogari
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Ose{' '}
                        <Link to="/register" className="font-medium text-primary hover:text-indigo-500">
                            krijoni një llogari të re
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">

                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            placeholder="Adresa email"
                        />

                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            placeholder="Fjalëkalimi"
                        />

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 rounded-md text-white bg-primary hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                        {loading ? "Duke u loguar..." : "Hyr"}
                    </button>

                </form>
            </div>
        </div>
    );
}