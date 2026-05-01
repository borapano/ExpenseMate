import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import api from '../api';
import { CreateGroupModal } from '../components/GroupModals';
import {
    LayoutDashboard, Activity, CreditCard, Users, Settings, LogOut,
    PlusCircle, Hash, ArrowRight, ShieldCheck, AlertCircle
} from 'lucide-react';

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

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface GroupParticipant {
    user_id: string;
    user_name: string;
}

interface GroupOut {
    id: string;
    name: string;
    description: string;
    invite_code: string;
    total_spending?: number;
    net_balance?: number;
    members?: GroupParticipant[];
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const Groups: React.FC = () => {
    const { user, logout } = useAuth();
    const { groups, loading, refreshAllData } = useData();
    const navigate = useNavigate();

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
            refreshAllData(); // Refresh data explicitly
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
            <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0">
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
                    <NavItem icon={<Settings size={19} />} label="Settings" to="/settings" />
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
                        <p className="text-sm text-secondary/70 font-semibold mt-0.5">Create, join and manage your shared hubs</p>
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

                        {/* 1. Create New Group */}
                        <div
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-primary hover:bg-primary/95 text-white rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div>
                                <h2 className="text-lg font-black tracking-tight flex items-center gap-2 mb-1.5">
                                    <PlusCircle className="text-accent" size={20} /> Create New Group
                                </h2>
                                <p className="text-sm font-medium text-secondary/80 max-w-sm">
                                    Start a new expense hub for your trips, apartment, or events.
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <ArrowRight className="text-accent" />
                            </div>
                        </div>

                        {/* 2. Join Group Inline */}
                        <div className="bg-white border border-secondary/10 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden transition-all hover:bg-gray-50/50">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/5 rounded-full pointer-events-none" />

                            <div className="w-full">
                                <h2 className="text-lg font-black text-primary tracking-tight flex items-center gap-2 mb-3">
                                    <Hash className="text-primary/50" size={20} /> Join a Group
                                </h2>

                                <form onSubmit={handleJoinGroup} className="flex gap-2 w-full max-w-sm relative z-10">
                                    <input
                                        type="text"
                                        placeholder="Enter 6-char Code"
                                        maxLength={6}
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        className="flex-1 min-w-0 bg-[#F7F4F0] border border-secondary/10 rounded-xl px-4 py-2.5 text-sm font-black uppercase text-primary tracking-widest outline-none focus:border-accent transition-colors placeholder:text-secondary/30 placeholder:tracking-normal"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isJoining}
                                        className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {isJoining ? '...' : 'Join'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* ── MAIN GRID: GROUP CARDS ── */}
                    <div>
                        <h2 className="text-sm font-black text-secondary/70 uppercase tracking-widest mb-6 px-1">Your Active Hubs</h2>

                        {groups.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-dashed border-secondary/20 p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mb-4">
                                    <Users size={32} className="text-secondary/30" />
                                </div>
                                <h3 className="text-xl font-black text-primary mb-2">No Groups Yet</h3>
                                <p className="text-secondary/70 max-w-md mx-auto mb-6">
                                    You aren't a part of any expense groups. Create one to start splitting bills, or join an existing hub!
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
                                {groups.map((group) => {
                                    const netBal = Number(group.net_balance || 0);
                                    const members = group.members || [];

                                    return (
                                        <div
                                            key={group.id}
                                            onClick={() => navigate(`/groups/${group.id}`)}
                                            className="bg-white/80 p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col hover:scale-105 hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 pr-2">
                                                    <h3 className="text-lg font-black text-primary truncate" title={group.name}>{group.name}</h3>
                                                    {group.description && (
                                                        <p className="text-xs text-secondary/60 font-semibold line-clamp-1 mt-1">
                                                            {group.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-[#F7F4F0] flex items-center justify-center text-[10px] font-black text-primary/40 shrink-0">
                                                    {group.invite_code}
                                                </div>
                                            </div>

                                            <div className="flex-1 grid grid-cols-2 gap-4 bg-[#F7F4F0] p-4 rounded-xl mt-2 mb-5">
                                                <div>
                                                    <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest mb-1">Total Spent</p>
                                                    <p className="font-bold text-sm text-primary">€{Number(group.total_spending || 0).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest mb-1">Your Net Bal</p>
                                                    <p className={`font-black text-base ${netBal > 0 ? 'text-emerald-500' : netBal < 0 ? 'text-danger' : 'text-primary'}`}>
                                                        {netBal > 0 ? '+' : ''}{netBal.toFixed(2)}€
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex -space-x-2">
                                                    {members.slice(0, 4).map((m, idx) => (
                                                        <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm" title={m.user_name}>
                                                            {m.user_name.charAt(0).toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {members.length > 4 && (
                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                                            +{members.length - 4}
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="text-xs font-bold text-accent group-hover:underline flex items-center gap-1">
                                                    View Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
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
