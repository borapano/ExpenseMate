import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import {
    AlertCircle, ChevronRight, Users, ShieldCheck, LayoutDashboard, Activity, CreditCard, LogOut,
} from 'lucide-react';

import {
    GroupInfoCard,
    GroupStatsRow,
    GroupDebtsCard,
    GroupReceivablesCard,
    GroupExpenseTable,
} from '../components/GroupDetails';

// ── Nav Item ──────────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
const GroupDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();
    const { refreshAllData, groups } = useData();
    const recentGroups = [...(groups || [])].sort((a, b) => Number(b.id) - Number(a.id));

    const [group, setGroup] = useState<any>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ title: string; type: 'success' | 'error' } | null>(null);

    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToast({ title, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchGroup = useCallback(async () => {
        if (!id) return;
        try {
            const res = await api.get(`/groups/${id}`);
            setGroup(res.data);
            setError(null);
        } catch {
            setError('Group not found or you lack access.');
        } finally {
            setPageLoading(false);
        }
    }, [id]);

    useEffect(() => {
        setPageLoading(true);
        fetchGroup();
    }, [fetchGroup]);

    // Can leave: no active debts and no unconfirmed incoming
    const canLeave = (() => {
        if (!group || !currentUser) return false;
        const debts: any[] = group.my_debts || [];
        const incoming: any[] = group.pending_settlements || [];
        return !debts.some((d: any) => !d.is_pending) && incoming.length === 0;
    })();

    // ── Loading ───────────────────────────────────────────────────────────────
    if (pageLoading) {
        return (
            <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">
                <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0 opacity-60" />
                <main className="flex-1 p-8 space-y-5 animate-pulse">
                    <div className="h-5 w-44 bg-secondary/10 rounded-lg" />
                    <div className="h-36 bg-white rounded-2xl shadow-sm" />
                    <div className="grid grid-cols-3 gap-4">
                        {[0,1,2].map(i => <div key={i} className="h-32 bg-white rounded-2xl shadow-sm" />)}
                    </div>
                    <div className="h-[624px] bg-white rounded-2xl shadow-sm" />
                </main>
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error || !group) {
        return (
            <div className="flex min-h-screen bg-[#F7F4F0] font-sans">
                <aside className="w-64 bg-primary hidden md:flex shrink-0" />
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center bg-white p-12 rounded-2xl shadow-sm max-w-md">
                        <AlertCircle className="mx-auto block text-red-500 mb-4" size={44} />
                        <h2 className="text-2xl font-black text-primary mb-2">Oops!</h2>
                        <p className="text-secondary/70 font-semibold mb-6">{error}</p>
                        <button onClick={() => navigate('/groups')}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all">
                            Back to Groups
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary relative">

            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-6 right-8 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 font-bold text-sm tracking-wide transition-all ${
                    toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {toast.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                    {toast.title}
                </div>
            )}

            {/* ── Sidebar ── */}
            <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0 sticky top-0 h-screen">
                <div className="p-8 flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                        <Users className="text-accent" size={20} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">ExpenseMate</span>
                </div>

                <div className="flex-1 flex flex-col min-h-0 px-4 mt-4">
                    <div className="shrink-0 space-y-1">
                        <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" to="/dashboard" />
                        <NavItem icon={<Activity size={19} />} label="Insights" to="/insights" />
                        <NavItem icon={<CreditCard size={19} />} label="Expenses" to="/expenses" />
                        <NavItem icon={<Users size={19} />} label="Groups" to="/groups" />
                    </div>

                    {recentGroups.length > 0 && (
                        <div className="overflow-y-auto flex flex-col mt-0.5 custom-scrollbar">
                            {recentGroups.map(g => {
                                const isActive = String(g.id) === String(id);
                                return (
                                    <button key={g.id} onClick={() => navigate(`/groups/${g.id}`)}
                                        className={`flex items-center pl-10 pr-3 py-1.5 rounded-xl text-left w-full transition-all duration-150 ${
                                            isActive ? 'bg-accent/15 text-accent' : 'text-secondary/50 hover:bg-white/5 hover:text-white'
                                        }`}>
                                        <span className="text-[11px] font-semibold truncate">{g.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 shrink-0">
                    <button onClick={logout}
                        className="flex items-center gap-3 text-secondary hover:text-white transition-colors w-full text-sm font-bold uppercase tracking-widest">
                        <LogOut size={19} /><span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="px-8 py-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-secondary/60">
                        <button onClick={() => navigate('/groups')} className="hover:text-primary transition-colors">Groups</button>
                        <ChevronRight size={14} className="text-secondary/30" />
                        <span className="text-primary font-black truncate max-w-[200px]">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-bold tracking-tight">{currentUser?.name || 'User'}</span>
                    </div>
                </header>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-8 pb-12 flex flex-col gap-5 custom-scrollbar">

                    {/* ROW 1: Group Info */}
                    <GroupInfoCard
                        group={group}
                        currentUser={currentUser}
                        canLeave={canLeave}
                        onToast={showToast}
                        onGroupUpdated={async () => { await fetchGroup(); refreshAllData(); }}
                        onGroupDeleted={() => { refreshAllData(); navigate('/groups'); }}
                        onLeaveGroup={() => { refreshAllData(); navigate('/groups'); }}
                    />

                    {/* ROW 2: My Spendings | Net Balance | Members Summary */}
                    <GroupStatsRow group={group} currentUserId={currentUser?.id} />

                    {/* ROW 3: 2/3 Table + 1/3 Receivables & Debts */}
                    <div className="grid grid-cols-3 gap-5" style={{ height: '624px' }}>

                        {/* Expense table — 2/3 width, inner scroll */}
                        <div className="col-span-2 min-h-0 overflow-hidden">
                            <GroupExpenseTable
                                group={group}
                                currentUser={currentUser}
                                onRefresh={fetchGroup}
                                onRefreshGlobal={refreshAllData}
                                onToast={showToast}
                            />
                        </div>

                        {/* Right column — Receivables stacked over Debts */}
                        <div className="col-span-1 flex flex-col gap-5 min-h-0">
                            <GroupReceivablesCard
                                group={group}
                                onRefresh={fetchGroup}
                                onRefreshGlobal={refreshAllData}
                                onToast={showToast}
                            />
                            <GroupDebtsCard
                                group={group}
                                onRefresh={fetchGroup}
                                onRefreshGlobal={refreshAllData}
                                onToast={showToast}
                            />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default GroupDetails;
