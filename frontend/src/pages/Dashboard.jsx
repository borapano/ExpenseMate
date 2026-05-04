import React, { useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import {
    LayoutDashboard, Activity, CreditCard, Users, LogOut,
    ArrowRight, ArrowUpRight, ArrowDownLeft, Minus,
    Bell, ChevronRight, Utensils, ShoppingBasket, Car,
    Home, Zap, Film, ShoppingBag, Plane, HeartPulse, Tag,
} from 'lucide-react';

// ── Sidebar NavItem ───────────────────────────────────────────────────────────
const NavItem = ({ icon, label, to }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${isActive
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const CAT_META = {
    'Food & Dining':         { icon: <Utensils size={13} />,      bg: 'bg-amber-100',   text: 'text-amber-600',   pill: 'bg-amber-50 text-amber-700 border-amber-100' },
    'Groceries':             { icon: <ShoppingBasket size={13} />, bg: 'bg-emerald-100', text: 'text-emerald-600', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'Transportation':        { icon: <Car size={13} />,            bg: 'bg-sky-100',     text: 'text-sky-600',     pill: 'bg-sky-50 text-sky-700 border-sky-100' },
    'Transport':             { icon: <Car size={13} />,            bg: 'bg-sky-100',     text: 'text-sky-600',     pill: 'bg-sky-50 text-sky-700 border-sky-100' },
    'Housing':               { icon: <Home size={13} />,           bg: 'bg-indigo-100',  text: 'text-indigo-600',  pill: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    'Utilities':             { icon: <Zap size={13} />,            bg: 'bg-yellow-100',  text: 'text-yellow-600',  pill: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    'Entertainment':         { icon: <Film size={13} />,           bg: 'bg-purple-100',  text: 'text-purple-600',  pill: 'bg-purple-50 text-purple-700 border-purple-100' },
    'Shopping':              { icon: <ShoppingBag size={13} />,    bg: 'bg-pink-100',    text: 'text-pink-600',    pill: 'bg-pink-50 text-pink-700 border-pink-100' },
    'Travel':                { icon: <Plane size={13} />,          bg: 'bg-sky-100',     text: 'text-sky-600',     pill: 'bg-sky-50 text-sky-700 border-sky-100' },
    'Health':                { icon: <HeartPulse size={13} />,     bg: 'bg-red-100',     text: 'text-red-600',     pill: 'bg-red-50 text-red-700 border-red-100' },
    'Bills & Subscriptions': { icon: <CreditCard size={13} />,     bg: 'bg-slate-100',   text: 'text-slate-600',   pill: 'bg-slate-50 text-slate-700 border-slate-100' },
};
const getCat = c => CAT_META[c] ?? { icon: <Tag size={13} />, bg: 'bg-gray-100', text: 'text-gray-500', pill: 'bg-gray-50 text-gray-600 border-gray-100' };

const fmt = v => `€${Math.abs(Number(v)).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtSigned = v => { const n = Number(v); return (n >= 0 ? '+' : '−') + fmt(n); };
const fmtShort = v => { const n = Number(v); return n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${n.toFixed(0)}`; };
const fmtDate = d => { if (!d) return ''; return new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short' }); };
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const relativeTime = dateStr => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return fmtDate(dateStr);
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { user, logout } = useAuth();
    const { groups, expenses, settlementDashboard, loading } = useData();
    const navigate = useNavigate();

    const allGroups = [...(groups || [])].sort((a, b) => Number(b.id) - Number(a.id));

    const globalDebts    = settlementDashboard?.global_debts     ?? [];
    const globalRequests = settlementDashboard?.global_requests  ?? [];
    const expectedPay    = settlementDashboard?.expected_payments ?? [];

    const totalToPay     = globalDebts.filter(d => !d.is_pending).reduce((s, d) => s + Number(d.amount ?? 0), 0);
    const totalToReceive = expectedPay.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const netBalance     = totalToReceive - totalToPay;
    const pendingCount   = globalRequests.length;
    const activeDebtCount   = globalDebts.filter(d => !d.is_pending).length;

    // This month
    const now = new Date();
    const thisMonthExpenses = useMemo(() => (expenses ?? []).filter(e => {
        const d = new Date(e.expense_date ?? e.created_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }), [expenses]);

    const monthlySpend = thisMonthExpenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);

    // Top 3 categories this month
    const topCategories = useMemo(() => {
        const map = {};
        thisMonthExpenses.forEach(e => {
            const cat = e.category ?? 'Other';
            map[cat] = (map[cat] ?? 0) + Number(e.amount ?? 0);
        });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, total]) => ({ name, total }));
    }, [thisMonthExpenses]);

    // Recent activity — exactly 5
    const recentActivity = useMemo(() =>
        [...(expenses ?? [])]
            .sort((a, b) => new Date(b.created_date ?? b.expense_date) - new Date(a.created_date ?? a.expense_date))
            .slice(0, 5),
        [expenses]
    );

    const displayGroups = allGroups.slice(0, 6);

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

    // ── Balance state helpers ──────────────────────────────────────────────────
    const netIsPositive = netBalance > 0.005;
    const netIsNegative = netBalance < -0.005;

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">

            {/* ── Sidebar ── */}
            <aside className="w-64 bg-primary text-white flex flex-col hidden md:flex shrink-0 sticky top-0 h-screen">
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
                        <div className="overflow-y-auto flex flex-col mt-0.5 custom-scrollbar">
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

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="px-8 py-5 flex items-center justify-between shrink-0 border-b border-secondary/10 bg-white/50 backdrop-blur-sm">
                    <div>
                        <h1 className="text-lg font-black text-primary tracking-tight">Dashboard</h1>
                        <p className="text-sm text-secondary/55 font-semibold mt-0.5">
                            {greeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold tracking-tight">{user?.name}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pt-5 pb-10 flex flex-col gap-4 custom-scrollbar">

                    {/* ── 1. NOTIFICATION ALERT ── */}
                    {pendingCount > 0 && (
                        <button onClick={() => navigate('/expenses')}
                            className="w-full bg-accent/10 border border-accent/30 rounded-2xl px-6 py-3.5 flex items-center justify-between hover:bg-accent/15 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shrink-0">
                                    <Bell size={13} className="text-primary" />
                                </div>
                                <p className="text-sm font-black text-primary">
                                    {pendingCount} {pendingCount === 1 ? 'payment needs' : 'payments need'} your confirmation
                                    <span className="font-semibold text-secondary/50 ml-2 text-xs">→ Expenses</span>
                                </p>
                            </div>
                            <ChevronRight size={16} className="text-secondary/30 group-hover:text-primary transition-colors shrink-0" />
                        </button>
                    )}

                    {/* ── 2. STATS ROW ── */}
                    <div className="grid grid-cols-3 gap-4">

                        {/* Net Balance */}
                        <div className={`rounded-2xl px-6 py-5 border shadow-sm flex flex-col ${
                            netIsPositive ? 'bg-emerald-50 border-emerald-100'
                            : netIsNegative ? 'bg-red-50 border-red-100'
                            : 'bg-white border-secondary/10'
                        }`}>
                            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-secondary/40 mb-2">Net Balance</p>
                            <p className={`text-4xl font-black tracking-tight leading-none ${
                                netIsPositive ? 'text-emerald-600'
                                : netIsNegative ? 'text-red-500'
                                : 'text-secondary/25'
                            }`}>
                                {fmtSigned(netBalance)}
                            </p>
                            <p className="text-[10px] font-semibold text-secondary/40 mt-2 flex items-center gap-1">
                                {netIsPositive
                                    ? <><ArrowUpRight size={10} className="text-emerald-500 shrink-0" /> Overall owed to you</>
                                    : netIsNegative
                                    ? <><ArrowDownLeft size={10} className="text-red-400 shrink-0" /> Overall you owe</>
                                    : <><Minus size={10} className="text-secondary/25 shrink-0" /> All settled up</>
                                }
                            </p>
                        </div>

                        {/* To Receive */}
                        <div className="bg-white rounded-2xl px-6 py-5 border border-secondary/10 shadow-sm flex flex-col">
                            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-secondary/40 mb-2">To Receive</p>
                            <p className={`text-4xl font-black tracking-tight leading-none ${totalToReceive > 0.005 ? 'text-emerald-500' : 'text-secondary/20'}`}>
                                {fmt(totalToReceive)}
                            </p>
                            <p className="text-[10px] font-semibold text-secondary/40 mt-2">
                                {expectedPay.length > 0
                                    ? `${expectedPay.length} expected ${expectedPay.length === 1 ? 'payment' : 'payments'}`
                                    : 'Nothing pending'
                                }
                            </p>
                        </div>

                        {/* To Pay */}
                        <div className="bg-white rounded-2xl px-6 py-5 border border-secondary/10 shadow-sm flex flex-col">
                            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-secondary/40 mb-2">To Pay</p>
                            <p className={`text-4xl font-black tracking-tight leading-none ${totalToPay > 0.005 ? 'text-red-500' : 'text-secondary/20'}`}>
                                {fmt(totalToPay)}
                            </p>
                            <p className="text-[10px] font-semibold text-secondary/40 mt-2">
                                {activeDebtCount > 0
                                    ? `${activeDebtCount} active ${activeDebtCount === 1 ? 'debt' : 'debts'}`
                                    : 'All clear'
                                }
                            </p>
                        </div>
                    </div>

                    {/* ── 3. THIS MONTH + YOUR GROUPS ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* This Month */}
                        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-secondary/5 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/50">This Month</p>
                                <button onClick={() => navigate('/insights')}
                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors">
                                    Insights <ArrowRight size={10} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="px-5 py-4 flex flex-col gap-4 flex-1">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Total Spent</p>
                                    <p className="text-3xl font-black text-primary mt-1 tracking-tight">{fmt(monthlySpend)}</p>
                                    <p className="text-[10px] font-semibold text-secondary/40 mt-0.5">
                                        {thisMonthExpenses.length} {thisMonthExpenses.length === 1 ? 'expense' : 'expenses'} &middot; {now.toLocaleDateString('en', { month: 'long' })}
                                    </p>
                                </div>

                                {topCategories.length > 0 ? (
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Top Categories</p>
                                        {topCategories.map(({ name, total }) => {
                                            const cat = getCat(name);
                                            return (
                                                <div key={name} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold ${cat.pill}`}>
                                                    <span className="shrink-0">{cat.icon}</span>
                                                    <span className="flex-1 truncate font-semibold">{name}</span>
                                                    <span className="font-black ml-auto shrink-0">{fmtShort(total)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-4 text-secondary/20 gap-1.5">
                                        <CreditCard size={22} strokeWidth={1.5} />
                                        <p className="text-[9px] font-black uppercase tracking-widest">No expenses this month</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Your Groups — 2/3 width, compact grid of cards */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-secondary/10 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-secondary/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/50">Your Groups</p>
                                    <span className="px-2 py-0.5 bg-primary/5 border border-primary/10 rounded-full text-[9px] font-black text-primary/40">
                                        {allGroups.length} {allGroups.length === 1 ? 'group' : 'groups'}
                                    </span>
                                </div>
                                {allGroups.length > 6 && (
                                    <button onClick={() => navigate('/groups')}
                                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors">
                                        See all <ArrowRight size={10} strokeWidth={3} />
                                    </button>
                                )}
                            </div>

                            {displayGroups.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2 text-secondary/20">
                                    <Users size={26} strokeWidth={1.5} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No groups yet</p>
                                </div>
                            ) : (
                                <div className="p-4 grid grid-cols-3 gap-3">
                                    {displayGroups.map(g => {
                                        const bal = Number(g.net_balance ?? 0);
                                        const isOwed  = bal >  0.01;
                                        const isOwing = bal < -0.01;
                                        const memberCount = g.members?.length ?? g.member_count ?? null;

                                        return (
                                            <button
                                                key={g.id}
                                                onClick={() => navigate(`/groups/${g.id}`)}
                                                className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F7F4F0] border border-secondary/8 hover:border-secondary/20 hover:shadow-sm transition-all text-left group"
                                            >
                                                {/* Colored initial */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${
                                                    isOwed  ? 'bg-emerald-100 text-emerald-600'
                                                    : isOwing ? 'bg-red-100 text-red-500'
                                                    : 'bg-secondary/10 text-secondary/40'
                                                }`}>
                                                    {g.name.charAt(0).toUpperCase()}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-black text-primary truncate group-hover:text-accent transition-colors">
                                                        {g.name}
                                                    </p>
                                                    {memberCount !== null && (
                                                        <p className="text-[9px] font-semibold text-secondary/35 mt-0.5">
                                                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                                        </p>
                                                    )}
                                                    <p className={`text-[10px] font-black mt-1 ${
                                                        isOwed  ? 'text-emerald-600'
                                                        : isOwing ? 'text-red-500'
                                                        : 'text-secondary/30'
                                                    }`}>
                                                        {isOwed  ? `+${fmt(bal)}`
                                                         : isOwing ? `−${fmt(bal)}`
                                                         : 'Settled up'}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── 4. RECENT ACTIVITY — last 5 ── */}
                    <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-secondary/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/50">Recent Activity</p>
                                {recentActivity.length > 0 && (
                                    <span className="px-2 py-0.5 bg-primary/5 border border-primary/10 rounded-full text-[9px] font-black text-primary/40">
                                        Last {recentActivity.length}
                                    </span>
                                )}
                            </div>
                            <button onClick={() => navigate('/expenses')}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors">
                                See all <ArrowRight size={10} strokeWidth={3} />
                            </button>
                        </div>

                        {recentActivity.length === 0 ? (
                            <div className="px-6 py-8 flex flex-col items-center gap-2 text-secondary/20">
                                <Activity size={24} strokeWidth={1.5} />
                                <p className="text-[10px] font-black uppercase tracking-widest">No activity yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-secondary/5">
                                {recentActivity.map(exp => {
                                    const cat = getCat(exp.category);
                                    const isPayer  = String(exp.payer_id) === String(user?.id);
                                    const myShare  = exp.user_balance ?? null;
                                    const txStatus = exp.transaction_status ?? 'NONE';

                                    let shareTag;
                                    if (isPayer) {
                                        shareTag = <span className="text-emerald-500 font-black">You paid</span>;
                                    } else if (txStatus === 'PENDING') {
                                        shareTag = <span className="text-amber-500 font-black">Payment pending</span>;
                                    } else if (txStatus === 'CONFIRMED') {
                                        shareTag = <span className="text-secondary/35 font-semibold">Settled</span>;
                                    } else if (myShare !== null && myShare < -0.005) {
                                        shareTag = <span className="text-red-500 font-black">You owe {fmt(Math.abs(myShare))}</span>;
                                    } else {
                                        shareTag = <span className="text-secondary/35 font-semibold">Settled</span>;
                                    }

                                    return (
                                        <div key={exp.id} className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-secondary/[0.012] transition-colors">
                                            {/* Category icon */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.bg} ${cat.text}`}>
                                                {cat.icon}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="text-[11px] font-bold text-primary truncate">{exp.description ?? 'Expense'}</p>
                                                    {exp.group_name && (
                                                        <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-secondary/6 text-secondary/45 border border-secondary/10">
                                                            {exp.group_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] mt-0.5 text-secondary/40">
                                                    {shareTag}
                                                    <span className="mx-1.5 text-secondary/20">·</span>
                                                    {relativeTime(exp.created_date ?? exp.expense_date)}
                                                </p>
                                            </div>

                                            {/* Amount */}
                                            <p className="text-sm font-black text-primary shrink-0">{fmt(exp.amount)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;
