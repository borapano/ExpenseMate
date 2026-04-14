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
        <div className="min-h-screen bg-[#EFD2B0]">

            {/* Navbar */}
            <nav className="bg-[#1A3263] shadow-xl px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-[#FFC570]">ExpenseMate</h1>
                <button
                    onClick={handleLogout}
                    className="text-sm font-semibold text-[#EFD2B0] hover:text-[#FFC570] transition-colors"
                >
                    Logout
                </button>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-white rounded-xl border border-[#EFD2B0] p-10 shadow-sm">

                    {/* User Profile */}
                    <div className="flex items-center space-x-6">
                        <div className="h-20 w-20 rounded-full bg-[#1A3263] flex items-center justify-center text-[#EFD2B0] text-3xl font-bold shadow-lg">
                            {user?.name ? user.name[0].toUpperCase() : '?'}
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-[#1A3263]">
                                Welcome, {user?.name}! 🎉
                            </h2>
                            <p className="text-[#547792] font-medium">{user?.email}</p>
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white rounded-xl border border-[#EFD2B0] shadow-sm">
                            <h4 className="text-xs font-bold text-[#1A3263] mb-1 uppercase tracking-wider">
                                System Status
                            </h4>
                            <p className="text-[#547792] text-lg font-medium">
                                AuthContext: Active ✅
                            </p>
                        </div>
                        <div className="p-6 bg-white rounded-xl border border-[#EFD2B0] shadow-sm">
                            <h4 className="text-xs font-bold text-[#1A3263] mb-1 uppercase tracking-wider">
                                Next Step
                            </h4>
                            <p className="text-[#FFC570] text-lg font-semibold">
                                Expense Management
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}