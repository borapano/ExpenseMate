import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import api from '../api';
import { CreateGroupModal } from '../components/GroupModals';
import {
    LayoutDashboard, Activity, CreditCard, Users, LogOut,
    ShieldCheck, AlertCircle
} from 'lucide-react';

import CreateGroupCard from '../components/Groups/CreateGroupCard';
import JoinGroupCard from '../components/Groups/JoinGroupCard';
import GroupCard from '../components/Groups/GroupCard';

// ─── NAV HELPER ─────────────────────────────────────────────────────────────
const NavItem = ({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${isActive
                ? 'bg-secondary/20 text-accent shadow-sm'
                : 'text-secondary hover:bg-white/5 hover:text-white'
            }`
        }
    >
        {({ isActive }) => (
            <>
                <div className={isActive ? 'text-accent' : 'text-secondary/60'}>{icon}</div>
                <span className="font-bold text-sm tracking-wide">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />}
            </>
        )}
    </NavLink>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const Groups: React.FC = () => {
    const { user, logout } = useAuth();
    const { groups, loading, refreshAllData } = useData();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ title: string, type: 'success' | 'error' } | null>(null);

    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ title, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    useEffect(() => {
        refreshAllData();
    }, [refreshAllData]);

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = inviteCode.trim().toUpperCase();
        if (cleanCode.length !== 6) {
            showToast("Invite code must be exactly 6 characters.", "error");
            return;
        }

        setIsJoining(true);
        try {
            await api.post('/groups/join', { invite_code: cleanCode });
            showToast("You've successfully joined the group!");
            setInviteCode("");
            refreshAllData();
        } catch (err: any) {
            console.error("Error joining group:", err);
            showToast(err.response?.data?.detail || "Invalid code or you're already a member.", "error");
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">
                <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0 opacity-80" />
                <main className="flex-1 flex flex-col p-8 gap-8 animate-pulse">
                    <div className="h-8 w-48 bg-secondary/10 rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-40 bg-white rounded-2xl shadow-sm" />
                        <div className="h-40 bg-white rounded-2xl shadow-sm" />
                    </div>
                    <div className="h-96 bg-white rounded-2xl shadow-sm" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary relative">
            {/* ── TOAST ZONE ── */}
            {toastMessage && (
                <div className={`fixed top-6 right-8 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 font-bold text-sm tracking-wide transition-all ${toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {toastMessage.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                    {toastMessage.title}
                </div>
            )}

            {/* ── SIDEBAR ── */}
            <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0 sticky top-0 h-screen">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                        <Users className="text-accent" size={20} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">ExpenseMate</span>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4">
                    <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" to="/dashboard" />
                    <NavItem icon={<Activity size={19} />} label="Activity Feed" to="/activity-feed" />
                    <NavItem icon={<CreditCard size={19} />} label="Expenses" to="/expenses" />
                    <NavItem icon={<Users size={19} />} label="Groups" to="/groups" />
                </nav>

                <div className="p-6 border-t border-white/5 mt-auto">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 text-secondary hover:text-white transition-colors w-full text-sm font-bold uppercase tracking-widest"
                    >
                        <LogOut size={19} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-primary tracking-tight">Groups</h1>
                        <p className="text-sm text-secondary/70 font-semibold mt-0.5">Create, join and manage your expense groups</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-bold tracking-tight">{user?.name || 'User'}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 custom-scrollbar">

                    {/* ── TOP SECTION: ACTION CARDS ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CreateGroupCard onClick={() => setIsCreateModalOpen(true)} />

                        <JoinGroupCard
                            inviteCode={inviteCode}
                            setInviteCode={setInviteCode}
                            onJoin={handleJoinGroup}
                            isJoining={isJoining}
                        />
                    </div>

                    {/* ── MAIN GRID: GROUP CARDS ── */}
                    <div>
                        <h2 className="text-sm font-black text-secondary/70 uppercase tracking-widest mb-6 px-1">Your Groups</h2>

                        {groups.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-dashed border-secondary/20 p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mb-4">
                                    <Users size={32} className="text-secondary/30" />
                                </div>
                                <h3 className="text-xl font-black text-primary mb-2">No Groups Yet</h3>
                                <p className="text-secondary/70 max-w-md mx-auto mb-6">
                                    You aren't a part of any expense groups. Create one to start splitting bills, or join an existing group!
                                </p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-accent text-primary px-6 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors"
                                >
                                    Create My First Group
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.map((group) => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    showToast("Group created successfully!");
                    refreshAllData();
                }}
            />
        </div>
    );
};

export default Groups;