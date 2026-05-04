import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import api from '../api';
import {
    LayoutDashboard, Activity, CreditCard, Users, LogOut,
    ArrowRight, ChevronRight, Check, X,
    Utensils, ShoppingBasket, Car, Home, Zap, Film,
    ShoppingBag, Plane, HeartPulse, Tag,
    Wallet, Scale, TrendingUp, TrendingDown,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const CAT = {
    'Food & Dining':         { icon: <Utensils size={12} />,      bg: 'bg-amber-100',   text: 'text-amber-600'   },
    'Groceries':             { icon: <ShoppingBasket size={12} />, bg: 'bg-emerald-100', text: 'text-emerald-600' },
    'Transportation':        { icon: <Car size={12} />,            bg: 'bg-sky-100',     text: 'text-sky-600'     },
    'Transport':             { icon: <Car size={12} />,            bg: 'bg-sky-100',     text: 'text-sky-600'     },
    'Housing':               { icon: <Home size={12} />,           bg: 'bg-indigo-100',  text: 'text-indigo-600'  },
    'Utilities':             { icon: <Zap size={12} />,            bg: 'bg-yellow-100',  text: 'text-yellow-600'  },
    'Entertainment':         { icon: <Film size={12} />,           bg: 'bg-purple-100',  text: 'text-purple-600'  },
    'Shopping':              { icon: <ShoppingBag size={12} />,    bg: 'bg-pink-100',    text: 'text-pink-600'    },
    'Travel':                { icon: <Plane size={12} />,          bg: 'bg-sky-100',     text: 'text-sky-600'     },
    'Health':                { icon: <HeartPulse size={12} />,     bg: 'bg-red-100',     text: 'text-red-600'     },
    'Bills & Subscriptions': { icon: <CreditCard size={12} />,     bg: 'bg-slate-100',   text: 'text-slate-600'   },
};
const getCat = c => CAT[c] ?? { icon: <Tag size={12} />, bg: 'bg-gray-100', text: 'text-gray-500' };

const fmt     = v => `€${Math.abs(Number(v)).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const clamp   = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const fmtDate = raw => {
    if (!raw) return '—';
    try {
        return new Date(raw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR NAV ITEM
// ─────────────────────────────────────────────────────────────────────────────
const NavItem = ({ icon, label, to }) => (
    <NavLink to={to} className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
            isActive ? 'bg-secondary/20 text-accent shadow-sm' : 'text-secondary hover:bg-white/5 hover:text-white'
        }`}>
        {({ isActive }) => (
            <>
                <div className={isActive ? 'text-accent' : 'text-secondary/60'}>{icon}</div>
                <span className="font-bold text-sm tracking-wide">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />}
            </>
        )}
    </NavLink>
);

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, colorClass, bgClass, borderClass, icon }) => (
    <div className={`rounded-2xl border shadow-sm p-5 flex flex-col justify-center gap-3 hover:shadow-md transition-shadow duration-200 ${bgClass ?? 'bg-white'} ${borderClass ?? 'border-secondary/10'}`}>
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">{label}</span>
            <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                {icon}
            </div>
        </div>
        <p className={`text-2xl font-black tracking-tight leading-none ${colorClass ?? 'text-primary'}`}>{value}</p>
        {sub && <p className="text-[10px] font-semibold text-secondary/40">{sub}</p>}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET CARD
// ─────────────────────────────────────────────────────────────────────────────
const BudgetCard = ({ spent, budget }) => {
    const pct  = budget > 0 ? clamp((spent / budget) * 100, 0, 100) : 0;
    const over = spent > budget && budget > 0;
    const bar  = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-accent';

    return (
        <div className="bg-white rounded-2xl p-5 border border-secondary/10 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Monthly Budget</span>
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <Wallet size={16} />
                </div>
            </div>
            <p className={`text-2xl font-black tracking-tight leading-none ${over ? 'text-red-500' : 'text-primary'}`}>
                {fmt(spent)}
                <span className="text-sm font-semibold text-secondary/25 ml-1">/ {fmt(budget)}</span>
            </p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] font-semibold text-secondary/40">
                {over ? `${fmt(spent - budget)} over limit` : `${fmt(budget - spent)} remaining this month`}
            </p>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// AWAITING YOUR CONFIRMATION  (h-[248px] fixed)
// ─────────────────────────────────────────────────────────────────────────────
// Row height = 64px → header ~48px + 3 × 64px = 240px + borders ≈ 248px
const ROW_H = 64; // px per request row

const AwaitingCard = ({ requests, onRefresh }) => {
    const [actioningId, setActioningId] = useState(null);
    const [localToast,  setLocalToast]  = useState(null);

    const toast = useCallback((msg, type = 'success') => {
        setLocalToast({ msg, type });
        setTimeout(() => setLocalToast(null), 3000);
    }, []);

    const handle = useCallback(async (id, action) => {
        setActioningId(`${id}-${action}`);
        try {
            await api.patch(`/settlements/${id}/${action}`);
            toast(action === 'confirm' ? 'Payment confirmed!' : 'Payment rejected.');
            await onRefresh();
        } catch (e) {
            toast(e?.response?.data?.detail || `Failed to ${action}.`, 'error');
        } finally { setActioningId(null); }
    }, [onRefresh, toast]);

    return (
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col h-[248px]">
            {/* Header */}
            <div className="px-5 border-b border-secondary/8 flex items-center justify-between shrink-0 min-h-[46px]">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary/50">
                    Awaiting Your Confirmation
                </p>
                {localToast ? (
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                        localToast.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                    }`}>{localToast.msg}</span>
                ) : requests.length > 0 ? (
                    <span className="text-[11px] font-black text-emerald-500">{requests.length}</span>
                ) : null}
            </div>

            {/* Body */}
            {requests.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Check size={18} className="text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary/25">All caught up</p>
                    <p className="text-[9px] text-secondary/20 font-semibold">No payments awaiting confirmation</p>
                </div>
            ) : (
                <div
                    className="overflow-y-auto flex-1 divide-y divide-secondary/5
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-secondary/15
                        [&::-webkit-scrollbar-thumb]:rounded-full"
                >
                    {requests.map(req => {
                        const isC = actioningId === `${req.id}-confirm`;
                        const isR = actioningId === `${req.id}-reject`;
                        const busy = isC || isR;
                        return (
                            <div key={req.id} style={{ height: `${ROW_H}px` }}
                                className="flex items-center gap-3 px-5 hover:bg-secondary/[0.012] transition-colors shrink-0">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-[10px] font-black text-amber-600">
                                    {(req.sender_name ?? '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-primary truncate">
                                        {req.sender_name ?? 'Someone'}
                                    </p>
                                    <p className="text-[9px] font-semibold text-secondary/40 truncate mt-0.5">
                                        {req.expense_description
                                            ? `${req.expense_description} · ${req.group_name ?? ''}`
                                            : (req.group_name ?? 'Settlement')}
                                    </p>
                                </div>
                                <p className="text-sm font-black text-emerald-600 shrink-0">{fmt(req.amount)}</p>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => handle(req.id, 'confirm')} disabled={busy}
                                        className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center transition-all"
                                        title="Confirm">
                                        {isC ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                              : <Check size={13} className="text-white" strokeWidth={2.5} />}
                                    </button>
                                    <button onClick={() => handle(req.id, 'reject')} disabled={busy}
                                        className="w-7 h-7 rounded-lg bg-secondary/6 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 flex items-center justify-center text-secondary/40 transition-all border border-secondary/10 hover:border-red-100"
                                        title="Reject">
                                        {isR ? <div className="w-3 h-3 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                                              : <X size={13} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// YOUR RECENT GROUPS  (h-[160px] fixed)
// ─────────────────────────────────────────────────────────────────────────────
const RecentGroupsCard = ({ expenses, groups, totalGroups, navigate }) => {
    // Find 2 groups with most recent expense activity
    const top2 = useMemo(() => {
        const seen = new Map();
        [...expenses]
            .sort((a, b) => new Date(b.created_date ?? b.expense_date) - new Date(a.created_date ?? a.expense_date))
            .forEach(e => {
                if (e.group_id && !seen.has(String(e.group_id))) {
                    const grp = groups.find(g => String(g.id) === String(e.group_id));
                    if (grp) seen.set(String(e.group_id), grp);
                }
            });
        return [...seen.values()].slice(0, 2);
    }, [expenses, groups]);

    const GroupMiniCard = ({ g }) => {
        const bal     = Number(g.net_balance ?? 0);
        const isOwed  = bal >  0.01;
        const isOwing = bal < -0.01;
        return (
            <button onClick={() => navigate(`/groups/${g.id}`)}
                className="flex-1 flex flex-col rounded-xl bg-white border border-secondary/10 hover:border-secondary/25 hover:shadow-sm transition-all text-left group min-w-0 overflow-hidden">
                {/* Blue accent strip */}
                <div className="h-1 bg-primary w-full shrink-0" />
                {/* Content */}
                <div className="flex-1 flex flex-col justify-between p-3.5">
                    <p className="text-[11px] font-black text-primary truncate group-hover:text-accent transition-colors">
                        {g.name}
                    </p>
                    <div className="mt-2">
                        <p className={`text-base font-black leading-none ${isOwed ? 'text-emerald-600' : isOwing ? 'text-red-500' : 'text-secondary/30'}`}>
                            {isOwed ? `+${fmt(bal)}` : isOwing ? `−${fmt(bal)}` : 'Settled'}
                        </p>
                        <p className="text-[8px] font-semibold text-secondary/35 mt-1 uppercase tracking-wide">
                            {isOwed ? 'owed to you' : isOwing ? 'you owe' : 'up'}
                        </p>
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col h-[160px]">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-secondary/8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary/50">Recent Groups</p>
                    <span className="px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded-full text-[9px] font-black text-primary/40">
                        {totalGroups} total
                    </span>
                </div>
                <button onClick={() => navigate('/groups')}
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-secondary/35 hover:text-primary transition-colors">
                    See all <ArrowRight size={9} strokeWidth={3} />
                </button>
            </div>

            {/* Cards */}
            <div className="flex-1 flex items-stretch gap-3 p-3 min-h-0">
                {top2.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1 text-secondary/20">
                        <Users size={20} strokeWidth={1.5} />
                        <p className="text-[9px] font-black uppercase tracking-widest">No active groups</p>
                    </div>
                ) : (
                    <>
                        {top2.map(g => <GroupMiniCard key={g.id} g={g} />)}
                        {top2.length === 1 && (
                            <button onClick={() => navigate('/groups')}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary/15 hover:border-secondary/25 hover:bg-secondary/[0.02] transition-all">
                                <ArrowRight size={16} className="text-secondary/20" />
                                <p className="text-[9px] font-semibold text-secondary/30 uppercase tracking-wide">View groups</p>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RECENT TRANSACTIONS TABLE  (h-[424px] = 248 + 16 + 160)
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_H = 248 + 16 + 160; // = 424px — matches left column

const RecentTransactionsCard = ({ expenses, userId, navigate }) => {
    const items = useMemo(() =>
        [...expenses]
            .sort((a, b) => new Date(b.created_date ?? b.expense_date) - new Date(a.created_date ?? a.expense_date))
            .slice(0, 10),
        [expenses]
    );

    return (
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col" style={{ height: `${TOTAL_H}px` }}>
            {/* Header */}
            <div className="px-5 border-b border-secondary/8 flex items-center justify-between shrink-0 min-h-[46px]">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary/50">Recent Transactions</p>
                <button onClick={() => navigate('/expenses')}
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-secondary/35 hover:text-primary transition-colors">
                    See all <ArrowRight size={9} strokeWidth={3} />
                </button>
            </div>

            {/* Table head */}
            <div className="grid grid-cols-[1fr_2fr_1fr_1fr] border-b border-secondary/5 bg-secondary/[0.015] shrink-0">
                {['Date', 'Expense', 'Group', 'Your Share'].map(h => (
                    <div key={h} className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-secondary/35">
                        {h}
                    </div>
                ))}
            </div>

            {/* Table body */}
            {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-secondary/20">
                    <CreditCard size={26} strokeWidth={1.5} />
                    <p className="text-[10px] font-black uppercase tracking-widest">No transactions yet</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-secondary/5
                    [&::-webkit-scrollbar]:w-1
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-secondary/15
                    [&::-webkit-scrollbar-thumb]:rounded-full">
                    {items.map(exp => {
                        const cat     = getCat(exp.category);
                        const isPayer = String(exp.payer_id) === String(userId);
                        const share   = exp.my_share ?? (isPayer ? exp.amount : null);
                        const total   = exp.total_amount ?? exp.amount ?? 0;

                        return (
                            <div key={exp.id}
                                className="grid grid-cols-[1fr_2fr_1fr_1fr] hover:bg-secondary/[0.012] transition-colors items-center min-h-[56px]">

                                {/* Date */}
                                <div className="px-4 py-3">
                                    <p className="text-[10px] font-bold text-secondary/60 whitespace-nowrap">
                                        {fmtDate(exp.expense_date ?? exp.created_date)}
                                    </p>
                                </div>

                                {/* Expense + category */}
                                <div className="px-4 py-3 min-w-0">
                                    <p className="text-[11px] font-bold text-primary truncate">
                                        {exp.description ?? 'Expense'}
                                    </p>
                                    <div className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md ${cat.bg} ${cat.text}`}>
                                        {cat.icon}
                                        <span className="text-[8px] font-bold truncate max-w-[80px]">
                                            {exp.category ?? 'Other'}
                                        </span>
                                    </div>
                                </div>

                                {/* Group */}
                                <div className="px-4 py-3 min-w-0">
                                    <p className="text-[10px] font-semibold text-secondary/55 truncate">
                                        {exp.group_name ?? '—'}
                                    </p>
                                </div>

                                {/* Your share */}
                                <div className="px-4 py-3">
                                    {share !== null && share > 0 ? (
                                        <>
                                            <p className="text-[11px] font-black text-primary">{fmt(share)}</p>
                                            <p className="text-[8px] font-semibold text-secondary/35 mt-0.5">
                                                of {fmt(total)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-[10px] text-secondary/25">—</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { groups, expenses, settlementDashboard, analytics, loading, refreshAllData } = useData();

    useEffect(() => { refreshAllData(); }, [refreshAllData]);

    const allGroups = useMemo(() =>
        [...(groups || [])].sort((a, b) => Number(b.id) - Number(a.id)),
        [groups]
    );

    const globalDebts    = settlementDashboard?.global_debts     ?? [];
    const globalRequests = settlementDashboard?.global_requests  ?? [];
    const expectedPay    = settlementDashboard?.expected_payments ?? [];

    const totalToPay     = globalDebts.filter(d => !d.is_pending).reduce((s, d) => s + Number(d.amount ?? 0), 0);
    const totalToReceive = expectedPay.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const netBalance     = totalToReceive - totalToPay;

    const monthlyBudget = user?.monthly_budget ?? 1000;
    const monthlySpent  = analytics?.stats?.totalSpentMonth ?? 0;

    const netIsPos = netBalance >  0.005;
    const netIsNeg = netBalance < -0.005;

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading && !settlementDashboard) {
        return (
            <div className="fixed inset-0 bg-[#F7F4F0] z-[999] flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <Users className="text-accent" size={22} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-primary">ExpenseMate</span>
                </div>
                <div className="w-40 h-1 bg-secondary/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-accent rounded-full animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">

            {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
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
                        <NavItem icon={<Activity size={19} />}        label="Insights"  to="/insights" />
                        <NavItem icon={<CreditCard size={19} />}      label="Expenses"  to="/expenses" />
                        <NavItem icon={<Users size={19} />}           label="Groups"    to="/groups" />
                    </div>
                    {allGroups.length > 0 && (
                        <div className="overflow-y-auto flex flex-col mt-1 custom-scrollbar">
                            {allGroups.map(g => (
                                <button key={g.id} onClick={() => navigate(`/groups/${g.id}`)}
                                    className="flex items-center pl-10 pr-3 py-1.5 rounded-xl text-left w-full transition-all text-secondary/50 hover:bg-white/5 hover:text-white">
                                    <span className="text-[11px] font-semibold truncate">{g.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-white/5 shrink-0">
                    <button onClick={logout} className="flex items-center gap-3 text-secondary hover:text-white transition-colors w-full text-sm font-bold uppercase tracking-widest">
                        <LogOut size={19} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN ────────────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="px-8 py-6 flex items-center justify-between shrink-0 border-b border-secondary/10">
                    <div>
                        <h1 className="text-xl font-black text-primary tracking-tight">Dashboard</h1>
                        <p className="text-sm text-secondary/70 font-semibold mt-0.5">
                            Your financial overview at a glance
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                            {(user?.name ?? 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold tracking-tight">{user?.name ?? 'User'}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pt-5 pb-10 flex flex-col gap-4 custom-scrollbar">

                    {/* Welcome greeting */}
                    <div className="pb-2">
                        <h2 className="text-3xl font-black text-primary tracking-tight">
                            Welcome back, {user?.name?.split(' ')[0] ?? 'there'}! 👋
                        </h2>
                        <p className="text-sm text-secondary/50 font-semibold mt-1">
                            Here's what's happening with your finances today.
                        </p>
                    </div>

                    {/* ── STATS ROW — Budget first ────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* 1. Monthly Budget */}
                        <BudgetCard spent={monthlySpent} budget={monthlyBudget} />

                        {/* 2. Net Balance */}
                        <StatCard
                            label="Net Balance"
                            value={`${netIsPos ? '+' : netIsNeg ? '−' : ''}${fmt(netBalance)}`}
                            sub={netIsPos ? 'Owed to you' : netIsNeg ? 'You owe' : 'All settled up'}
                            colorClass={netIsPos ? 'text-emerald-600' : netIsNeg ? 'text-red-500' : 'text-secondary/25'}
                            bgClass={netIsPos ? 'bg-emerald-50' : netIsNeg ? 'bg-red-50' : 'bg-white'}
                            borderClass={netIsPos ? 'border-emerald-100' : netIsNeg ? 'border-red-100' : 'border-secondary/10'}
                            icon={<Scale size={16} />}
                        />

                        {/* 3. To Receive */}
                        <StatCard
                            label="To Receive"
                            value={fmt(totalToReceive)}
                            sub={expectedPay.length > 0
                                ? `${expectedPay.length} expected payment${expectedPay.length !== 1 ? 's' : ''}`
                                : 'Nothing pending'}
                            colorClass={totalToReceive > 0.005 ? 'text-emerald-500' : 'text-secondary/20'}
                            icon={<TrendingUp size={16} />}
                        />

                        {/* 4. To Pay */}
                        <StatCard
                            label="To Pay"
                            value={fmt(totalToPay)}
                            sub={globalDebts.filter(d => !d.is_pending).length > 0
                                ? `${globalDebts.filter(d => !d.is_pending).length} active debt${globalDebts.filter(d => !d.is_pending).length !== 1 ? 's' : ''}`
                                : 'All clear'}
                            colorClass={totalToPay > 0.005 ? 'text-red-500' : 'text-secondary/20'}
                            icon={<TrendingDown size={16} />}
                        />
                    </div>

                    {/* ── MAIN 2-COLUMN GRID ──────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

                        {/* LEFT COLUMN */}
                        <div className="flex flex-col gap-4">
                            <AwaitingCard
                                requests={globalRequests}
                                onRefresh={refreshAllData}
                            />
                            <RecentGroupsCard
                                expenses={expenses ?? []}
                                groups={allGroups}
                                totalGroups={allGroups.length}
                                navigate={navigate}
                            />
                        </div>

                        {/* RIGHT COLUMN */}
                        <RecentTransactionsCard
                            expenses={expenses ?? []}
                            userId={user?.id}
                            navigate={navigate}
                        />
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;
