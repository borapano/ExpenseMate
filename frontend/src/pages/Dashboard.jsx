import React, { useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import {
    LayoutDashboard, Activity, CreditCard, Users, LogOut,
    ArrowRight, TrendingUp, TrendingDown, Minus,
    Bell, ChevronRight, Utensils, ShoppingBasket, Car,
    Home, Zap, Film, ShoppingBag, Plane, HeartPulse, Tag
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
    'Food & Dining':         { icon: <Utensils size={14} />,      bg: 'bg-amber-100',   text: 'text-amber-600',   pill: 'bg-amber-50 text-amber-600 border-amber-100' },
    'Groceries':             { icon: <ShoppingBasket size={14} />, bg: 'bg-emerald-100', text: 'text-emerald-600', pill: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    'Transportation':        { icon: <Car size={14} />,            bg: 'bg-sky-100',     text: 'text-sky-600',     pill: 'bg-sky-50 text-sky-600 border-sky-100' },
    'Transport':             { icon: <Car size={14} />,            bg: 'bg-sky-100',     text: 'text-sky-600',     pill: 'bg-sky-50 text-sky-600 border-sky-100' },
    'Housing':               { icon: <Home size={14} />,           bg: 'bg-indigo-100',  text: 'text-indigo-600',  pill: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    'Utilities':             { icon: <Zap size={14} />,            bg: 'bg-yellow-100',  text: 'text-yellow-600',  pill: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
    'Entertainment':         { icon: <Film size={14} />,           bg: 'bg-purple-100',  text: 'text-purple-600',  pill: 'bg-purple-50 text-purple-600 border-purple-100' },
    'Shopping':              { icon: <ShoppingBag size={14} />,    bg: 'bg-pink-100',    text: 'text-pink-600',    pill: 'bg-pink-50 text-pink-600 border-pink-100' },
    'Travel':                { icon: <Plane size={14} />,          bg: 'bg-sky-100',     text: 'text-sky-600',     pill: 'bg-sky-50 text-sky-600 border-sky-100' },
    'Health':                { icon: <HeartPulse size={14} />,     bg: 'bg-red-100',     text: 'text-red-600',     pill: 'bg-red-50 text-red-600 border-red-100' },
    'Bills & Subscriptions': { icon: <CreditCard size={14} />,    bg: 'bg-slate-100',   text: 'text-slate-600',   pill: 'bg-slate-50 text-slate-600 border-slate-100' },
};
const getCat = c => CAT_META[c] ?? { icon: <Tag size={14} />, bg: 'bg-gray-100', text: 'text-gray-500', pill: 'bg-gray-50 text-gray-500 border-gray-100' };

const fmt = v => `€${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = v => {
    const n = Number(v);
    if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
    return `€${n.toFixed(0)}`;
};
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

    const recentGroups = [...(groups || [])].sort((a, b) => Number(b.id) - Number(a.id));

    const globalDebts    = settlementDashboard?.global_debts     ?? [];
    const globalRequests = settlementDashboard?.global_requests  ?? [];
    const expectedPay    = settlementDashboard?.expected_payments ?? [];

    const totalToPay     = globalDebts.filter(d => !d.is_pending).reduce((s, d) => s + d.amount, 0);
    const totalToReceive = expectedPay.reduce((s, r) => s + r.amount, 0);
    const netBalance     = totalToReceive - totalToPay;
    const pendingCount   = globalRequests.length;

    // Per-group balance
    const groupBalance = useMemo(() => {
        const map = {};
        expectedPay.forEach(p => { map[String(p.group_id)] = (map[String(p.group_id)] ?? 0) + p.amount; });
        globalDebts.forEach(d => { map[String(d.group_id)] = (map[String(d.group_id)] ?? 0) - d.amount; });
        return map;
    }, [expectedPay, globalDebts]);

    // This month
    const now = new Date();
    const thisMonthExpenses = useMemo(() => (expenses ?? []).filter(e => {
        const d = new Date(e.expense_date ?? e.created_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }), [expenses]);

    const monthlySpend = thisMonthExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);

    // Top categories this month
    const topCategories = useMemo(() => {
        const counts = {};
        thisMonthExpenses.forEach(e => {
            const cat = e.category ?? 'Other';
            counts[cat] = (counts[cat] ?? 0) + (e.amount ?? 0);
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([name, total]) => ({ name, total }));
    }, [thisMonthExpenses]);

    // Recent activity
    const recentActivity = useMemo(() =>
        [...(expenses ?? [])]
            .sort((a, b) => new Date(b.created_date ?? b.expense_date) - new Date(a.created_date ?? a.expense_date))
            .slice(0, 8),
        [expenses]
    );

    const top4Groups = recentGroups.slice(0, 4);

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
                    {recentGroups.length > 0 && (
                        <div className="overflow-y-auto flex flex-col mt-0.5 custom-scrollbar">
                            {recentGroups.map(g => (
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
                <header className="px-8 py-6 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-xl font-black text-primary tracking-tight">Dashboard</h1>
                        <p className="text-sm text-secondary/70 font-semibold mt-0.5">
                            {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold tracking-tight">{user?.name}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-10 flex flex-col gap-5 custom-scrollbar">

                    {/* ── 1. ALERT ── */}
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

                    {/* ── 2. HERO — NET BALANCE ── */}
                    <div className="bg-primary rounded-2xl px-8 py-7 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Net Balance</p>
                                <p className={`text-6xl font-black tracking-tight mt-2 leading-none ${
                                    netBalance > 0 ? 'text-emerald-400' : netBalance < 0 ? 'text-red-400' : 'text-white/40'
                                }`}>
                                    {netBalance >= 0 ? '+' : ''}{fmt(netBalance)}
                                </p>
                                <div className="flex items-center gap-1.5 mt-3">
                                    {netBalance > 0
                                        ? <TrendingUp size={12} className="text-white/25" />
                                        : netBalance < 0
                                        ? <TrendingDown size={12} className="text-white/25" />
                                        : <Minus size={12} className="text-white/20" />}
                                    <p className="text-[11px] font-semibold text-white/25">
                                        {netBalance > 0 ? 'Overall you are owed more than you owe'
                                            : netBalance < 0 ? 'Overall you owe more than you are owed'
                                            : 'All settled up'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 bg-white/5 rounded-2xl px-6 py-4">
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1.5">To Receive</p>
                                    <p className="text-2xl font-black text-emerald-400">{fmt(totalToReceive)}</p>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1.5">To Pay</p>
                                    <p className="text-2xl font-black text-red-400">{fmt(totalToPay)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 3. THIS MONTH + GROUPS ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* This Month */}
                        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-secondary/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">This Month</h2>
                                    <p className="text-[11px] text-primary/30 mt-0.5 font-medium">
                                        {now.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <button onClick={() => navigate('/insights')}
                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors">
                                    Insights <ArrowRight size={10} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="px-6 py-5 flex flex-col gap-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Total Spent</p>
                                    <p className="text-4xl font-black text-primary mt-1 tracking-tight">{fmt(monthlySpend)}</p>
                                    <p className="text-[10px] font-semibold text-secondary/40 mt-1">
                                        {thisMonthExpenses.length} {thisMonthExpenses.length === 1 ? 'expense' : 'expenses'}
                                    </p>
                                </div>

                                {topCategories.length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35 mb-2">Top Categories</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {topCategories.map(({ name, total }) => {
                                                const cat = getCat(name);
                                                return (
                                                    <span key={name}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${cat.pill}`}>
                                                        {cat.icon}
                                                        {name}
                                                        <span className="opacity-60">{fmtShort(total)}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Groups — col-span-2 */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-secondary/10 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-secondary/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">Your Groups</h2>
                                    <p className="text-[11px] text-primary/30 mt-0.5 font-medium">Most recent</p>
                                </div>
                                <button onClick={() => navigate('/groups')}
                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors">
                                    See all <ArrowRight size={10} strokeWidth={3} />
                                </button>
                            </div>

                            {top4Groups.length === 0 ? (
                                <div className="px-6 py-10 flex flex-col items-center gap-2 text-secondary/20">
                                    <Users size={26} strokeWidth={1.5} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No groups yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 divide-x divide-y divide-secondary/5">
                                    {top4Groups.map(g => {
                                        const bal = groupBalance[String(g.id)] ?? 0;
                                        const memberCount = g.members?.length ?? g.member_count ?? null;
                                        return (
                                            <button key={g.id} onClick={() => navigate(`/groups/${g.id}`)}
                                                className="flex items-start gap-3.5 p-5 hover:bg-secondary/[0.02] transition-colors text-left group w-full">
                                                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                                                    <span className="text-base font-black text-primary/30">
                                                        {g.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-primary truncate">{g.name}</p>
                                                    {memberCount !== null && (
                                                        <p className="text-[10px] font-semibold text-secondary/35 mt-0.5">
                                                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                                        </p>
                                                    )}
                                                    <div className="mt-2">
                                                        <p className={`text-sm font-black ${bal > 0 ? 'text-emerald-600' : bal < 0 ? 'text-red-500' : 'text-secondary/25'}`}>
                                                            {bal === 0 ? '—' : (bal > 0 ? '+' : '') + fmt(bal)}
                                                        </p>
                                                        {bal !== 0 && (
                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-secondary/30 mt-0.5">
                                                                {bal > 0 ? 'owed to you' : 'you owe'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-secondary/20 group-hover:text-secondary/40 transition-colors shrink-0 mt-1" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── 4. RECENT ACTIVITY ── */}
                    <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-secondary/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">Recent Activity</h2>
                                <p className="text-[11px] text-primary/30 mt-0.5 font-medium">Latest transactions</p>
                            </div>
                            <button onClick={() => navigate('/expenses')}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors">
                                See all <ArrowRight size={10} strokeWidth={3} />
                            </button>
                        </div>

                        {recentActivity.length === 0 ? (
                            <div className="px-6 py-10 flex flex-col items-center gap-2 text-secondary/20">
                                <CreditCard size={26} strokeWidth={1.5} />
                                <p className="text-[10px] font-black uppercase tracking-widest">No activity yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-secondary/5">
                                {recentActivity.map(exp => {
                                    const cat = getCat(exp.category);
                                    const isPayer = String(exp.payer_id) === String(user?.id);
                                    const payerLabel = isPayer ? 'You paid' : `Paid by ${exp.payer_name ?? 'someone'}`;
                                    const myShare = exp.user_balance ?? null;

                                    let shareTag = null;
                                    if (isPayer) {
                                        shareTag = <span className="text-emerald-500 font-black">You paid</span>;
                                    } else if (myShare !== null && myShare < 0) {
                                        shareTag = <span className="text-red-500 font-black">You owe {fmt(Math.abs(myShare))}</span>;
                                    } else if (myShare !== null && myShare >= 0) {
                                        shareTag = <span className="text-secondary/35 font-semibold">Settled</span>;
                                    } else {
                                        shareTag = <span className="text-secondary/40 font-semibold">{payerLabel}</span>;
                                    }

                                    return (
                                        <div key={exp.id} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/[0.015] transition-colors">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.bg} ${cat.text}`}>
                                                {cat.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <p className="text-sm font-bold text-primary truncate">{exp.description}</p>
                                                    {exp.group_name && (
                                                        <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md bg-secondary/6 text-secondary/45 border border-secondary/10">
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
