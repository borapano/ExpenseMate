import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Importet e rregulluara (përdorim emërtimet e sakta që kërkon projekti yt)
import GroupCard from '../components/GroupCard';
import CreateGroupCard from '../components/CreateGroupCard';
import { CreateGroupModal, JoinGroupModal } from '../components/GroupModals';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [groups, setGroups] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await api.get('/groups/me');
            setGroups(response.data);
        } catch (error) {
            console.error("Gabim gjatë ngarkimit të grupeve:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

            {/* --- HEADER MODERNE --- */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer transition-transform active:scale-95" onClick={() => navigate('/')}>
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <span className="text-white font-black text-xl italic">E</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            Expense<span className="text-indigo-600">Mate</span>
                        </h1>
                    </div>

                    {/* User Profile & Logout */}
                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-3 bg-slate-50 p-1 pr-4 rounded-full border border-slate-100">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-md">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-black text-slate-800 leading-none uppercase tracking-tighter">{user?.name || 'Përdorues'}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Premium Plan</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="text-xs font-black text-red-500 hover:text-white hover:bg-red-500 border-2 border-red-100 px-4 py-2 rounded-xl transition-all active:scale-90"
                        >
                            LOGOUT
                        </button>
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">

                {/* Welcome Hero Section */}
                <section className="bg-indigo-600 rounded-[2.5rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            Mirëseerdhe, {user?.name?.split(' ')[0]}! 👋
                        </h2>
                        <p className="text-indigo-100 text-lg font-medium opacity-90 leading-relaxed">
                            Sistemi është gati. Menaxho shpenzimet e tua në grup me transparencë të plotë dhe thjeshtësi.
                        </p>
                    </div>
                    {/* Abstract Decorations */}
                    <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute right-20 top-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
                </section>

                {/* Groups Management */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
                        <div>
                            <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-2 block">Menaxhimi</span>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Grupet e Mia</h2>
                        </div>

                        <button
                            onClick={() => setIsJoinOpen(true)}
                            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-8 py-4 rounded-2xl font-black text-sm border-2 border-slate-100 shadow-xl shadow-slate-200/50 transition-all active:scale-95 group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                            </svg>
                            BASHKOHU ME KOD
                        </button>
                    </div>

                    {/* Grid of Groups */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {loading ? (
                            // Skeleton Loading State
                            [1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-56 bg-white border border-slate-100 rounded-[2rem] p-6 space-y-4 animate-pulse">
                                    <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                </div>
                            ))
                        ) : (
                            <>
                                {/* Butoni special për krijim */}
                                <CreateGroupCard onClick={() => setIsCreateOpen(true)} />

                                {/* Listimi i grupeve */}
                                {groups.length > 0 ? (
                                    groups.map((group) => (
                                        <GroupCard key={group.id} group={group} />
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a5.946 5.946 0 0 0-.942 3.198l.001.031c0 .225.012.447.038.666A11.944 11.944 0 0 1 12 21c2.17 0 4.207-.576 5.963-1.584A6.062 6.062 0 0 1 18 18.719m-12 0a5.971 5.971 0 0 0 .941-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-400 font-bold">Nuk keni asnjë grup ende. Filloni duke krijuar një!</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>

            {/* --- MODALET (E mbyllura si default) --- */}
            <CreateGroupModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={fetchGroups}
            />
            <JoinGroupModal
                isOpen={isJoinOpen}
                onClose={() => setIsJoinOpen(false)}
                onSuccess={fetchGroups}
            />

        </div>
    );
};

export default Dashboard;