import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Thirrja drejt Backend-it FastAPI
            await axios.post('http://127.0.0.1:8000/users/', formData);

            setSuccess("Llogaria u krijua me sukses! Po ju ridrejtojmë te hyrja...");

            // Presim 1.5 sekonda që përdoruesi të lexojë mesazhin e suksesit
            setTimeout(() => {
                navigate('/login');
            }, 1500);

        } catch (err) {
            const errorData = err.response?.data?.detail;

            // Trajtimi i gabimeve specifike të FastAPI (Validation vs Business Errors)
            if (Array.isArray(errorData)) {
                setError(errorData[0].msg);
            } else if (typeof errorData === 'string') {
                setError(errorData);
            } else {
                setError("Diçka shkoi keq. Ju lutem provoni përsëri.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">

                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Krijo llogarinë tënde
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Ose{' '}
                        <Link to="/login" className="font-medium text-primary hover:text-indigo-500">
                            hyni në llogarinë ekzistuese
                        </Link>
                    </p>
                </div>

                {/* Shfaqja e Error-it */}
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg text-center border border-red-200">
                        {error}
                    </div>
                )}

                {/* Shfaqja e Suksesit */}
                {success && (
                    <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg text-center border border-green-200">
                        {success}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Emri i plotë"
                        />

                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Adresa email"
                        />

                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Fjalëkalimi"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-lg text-white bg-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-md"
                    >
                        {loading ? "Duke u regjistruar..." : "Regjistrohu"}
                    </button>
                </form>
            </div>
        </div>
    );
}