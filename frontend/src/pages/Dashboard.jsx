import React from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-indigo-600">ExpenseMate</h1>
                <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-800 transition">
                    Dil (Logout)
                </button>
            </nav>

            <main className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-white rounded-3xl shadow-sm p-10 border border-gray-100">
                    <div className="flex items-center space-x-6">
                        <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {user?.name ? user.name[0].toUpperCase() : "?"}
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900">Mirësevini, {user?.name}! 🎉</h2>
                            <p className="text-gray-500 font-medium">{user?.email}</p>
                        </div>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <h4 className="text-indigo-800 font-bold mb-1 text-sm uppercase tracking-wider">Statusi i Sistemit</h4>
                            <p className="text-indigo-600 text-lg font-medium">AuthContext: Aktive ✅</p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                            <h4 className="text-green-800 font-bold mb-1 text-sm uppercase tracking-wider">Hapi i Radhës</h4>
                            <p className="text-green-600 text-lg font-medium italic underline decoration-green-300">Menaxhimi i Shpenzimeve</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}