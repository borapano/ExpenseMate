import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import api from '../api';
import { CreateGroupModal } from '../components/GroupModals';
import {
    LayoutDashboard, Activity, CreditCard, Users, LogOut,
    ShieldCheck, AlertCircle, ChevronDown, ChevronUp
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
    const [visibleCount, setVisibleCount] = useState(6);

    const STEP = 6;
    const visibleGroups = groups.slice(0, visibleCount);
    const hasMore = visibleCount < groups.length;
    const allShown = visibleCount >= groups.length && groups.length > STEP;

    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ title, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    useEffect(() => {
        refreshAllData();
    }, [refreshAllData]);

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);
        try {
            await api.post('/groups/join', { invite_code: inviteCode.trim().toUpperCase() });
            showToast("You've successfully joined the group!");
            setInviteCode("");
            refreshAllData();
        } catch (err: any) {
            console.error("Error joining group:", err);
            showToast(err.response?.data?.detail || "Something went wrong. Please try again.", "error");
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
                            userGroups={groups.map(g => ({ code: g.code, name: g.name }))}
                        />
                    </div>

                    {/* ── MAIN GRID: GROUP CARDS ── */}
                    <div>
                        {groups.length > 0 && (
                            <div className="flex items-baseline gap-3 mb-6 px-1">
                                <h2 className="text-sm font-black text-secondary/70 uppercase tracking-widest">Your Groups</h2>
                                <span className="text-[11px] font-semibold text-secondary/40">
                                    You are part of {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                                </span>
                            </div>
                        )}

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
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {visibleGroups.map((group) => (
                                        <GroupCard key={group.id} group={group} />
                                    ))}
                                </div>

                                {(hasMore || allShown) && (
                                    <div className="mt-6 flex justify-center">
                                        {hasMore ? (
                                            <button
                                                onClick={() => setVisibleCount(v => v + STEP)}
                                                className="px-8 py-2.5 bg-white border border-secondary/15 text-xs font-black uppercase tracking-widest text-primary/70 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
                                            >
                                                See More <ChevronDown size={14} strokeWidth={3} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setVisibleCount(STEP)}
                                                className="px-8 py-2.5 bg-white border border-secondary/15 text-xs font-black uppercase tracking-widest text-primary/70 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
                                            >
                                                See Less <ChevronUp size={14} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
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