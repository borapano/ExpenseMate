import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import ExpenseForm from '../components/ExpenseForm';
import DebtList from '../components/DebtList';
import {
    CheckCircle, AlertCircle, Copy, Plus, Users, Receipt, TrendingUp,
    ChevronRight, Utensils, Bus, Zap, Film, Heart, ShoppingCart,
    ArrowRightLeft, Tag, ChevronDown, ChevronUp, ShieldCheck,
    LayoutDashboard, Activity, CreditCard, LogOut
} from 'lucide-react';

// ─── CATEGORY MAPS ──────────────────────────────────────────────────────────
const categoryIconMap: Record<string, React.ReactNode> = {
    'Food & Dining': <Utensils size={16} />,
    'Transport': <Bus size={16} />,
    'Utilities': <Zap size={16} />,
    'Entertainment': <Film size={16} />,
    'Healthcare': <Heart size={16} />,
    'Shopping': <ShoppingCart size={16} />,
    'Transfer': <ArrowRightLeft size={16} />,
    'Ushqim': <Utensils size={16} />,
    'Qira': <Zap size={16} />,
    'Argëtim': <Film size={16} />,
    'Fatura': <Zap size={16} />,
};

const categoryColorMap: Record<string, string> = {
    'Food & Dining': 'bg-amber-100 text-amber-700',
    'Transport': 'bg-sky-100 text-sky-700',
    'Utilities': 'bg-violet-100 text-violet-700',
    'Entertainment': 'bg-pink-100 text-pink-700',
    'Healthcare': 'bg-rose-100 text-rose-700',
    'Shopping': 'bg-emerald-100 text-emerald-700',
    'Transfer': 'bg-indigo-100 text-indigo-700',
    'Ushqim': 'bg-amber-100 text-amber-700',
    'Qira': 'bg-violet-100 text-violet-700',
    'Argëtim': 'bg-pink-100 text-pink-700',
    'Fatura': 'bg-violet-100 text-violet-700',
};

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
const GroupDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();
    const { refreshAllData, groups } = useData();
    const recentGroups = [...(groups || [])].sort((a, b) => Number(b.id) - Number(a.id));

    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFeedExpanded, setIsFeedExpanded] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'error' } | null>(null);

    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ title, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    const fetchGroupDetails = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await api.get(`/groups/${id}`);
            setGroup(res.data);
            setError(null);
        } catch (err: any) {
            setError('Group not found or you lack access.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleCopyInvite = () => {
        if (group?.code) {
            navigator.clipboard.writeText(group.code);
            showToast("Invite code copied to clipboard!");
        }
    };

    const handleConfirmRequest = async (reqId: string) => {
        try {
            await api.patch(`/settlements/${reqId}/confirm`);
            showToast("Payment request confirmed!");
            fetchGroupDetails();
            refreshAllData();
        } catch {
            showToast("Error confirming payment.", "error");
        }
    };

    const handleRejectRequest = async (reqId: string) => {
        try {
            await api.patch(`/settlements/${reqId}/reject`);
            showToast("Payment request rejected.", "error");
            fetchGroupDetails();
            refreshAllData();
        } catch {
            showToast("Error rejecting payment.", "error");
        }
    };

    // ── LOADING ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">
                <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0 opacity-80" />
                <main className="flex-1 flex flex-col p-8 gap-6 animate-pulse">
                    <div className="h-5 w-40 bg-secondary/10 rounded-lg" />
                    <div className="h-36 bg-white rounded-2xl shadow-sm" />
                    <div className="grid grid-cols-3 gap-6">
                        <div className="h-24 bg-white rounded-2xl shadow-sm" />
                        <div className="h-24 bg-white rounded-2xl shadow-sm" />
                        <div className="h-24 bg-white rounded-2xl shadow-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 h-96 bg-white rounded-2xl shadow-sm" />
                        <div className="h-96 bg-white rounded-2xl shadow-sm" />
                    </div>
                </main>
            </div>
        );
    }

    // ── ERROR ────────────────────────────────────────────────────────────────
    if (error || !group) {
        return (
            <div className="flex min-h-screen bg-[#F7F4F0] font-sans">
                <aside className="w-64 bg-primary hidden md:flex shrink-0" />
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center bg-white p-12 rounded-2xl shadow-sm max-w-lg">
                        <AlertCircle className="mx-auto block text-red-500 mb-4" size={48} />
                        <h2 className="text-2xl font-black text-primary mb-2">Oops!</h2>
                        <p className="text-secondary/70 font-semibold mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/groups')}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            Back to Groups
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const sortedMembers = group.members
        ? [...group.members].sort((a: any, b: any) => {
            if (String(a.user_id) === String(group.creator_id)) return -1;
            if (String(b.user_id) === String(group.creator_id)) return 1;
            return a.user_name.localeCompare(b.user_name);
        })
        : [];

    const expensesList = group.expenses || [];
    const displayedExpenses = isFeedExpanded ? expensesList : expensesList.slice(0, 5);
    const groupNetBalance = Number(group.net_balance || 0);

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary relative">

            {/* ── TOAST ── */}
            {toastMessage && (
                <div className={`fixed top-6 right-8 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 font-bold text-sm tracking-wide transition-all ${toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toastMessage.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                    {toastMessage.title}
                </div>
            )}

            {/* ── SIDEBAR ── */}
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
                        <NavItem icon={<Activity size={19} />} label="Activity Feed" to="/activity-feed" />
                        <NavItem icon={<CreditCard size={19} />} label="Expenses" to="/expenses" />
                        <NavItem icon={<Users size={19} />} label="Groups" to="/groups" />
                    </div>

                    {/* Sub-items under Groups */}
                    {recentGroups.length > 0 && (
                        <div className="overflow-y-auto flex flex-col mt-0.5 custom-scrollbar">
                            {recentGroups.map(g => {
                                const isActive = String(g.id) === String(id);
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => navigate(`/groups/${g.id}`)}
                                        className={`flex items-center pl-10 pr-3 py-1.5 rounded-xl text-left w-full transition-all duration-150 ${
                                            isActive
                                                ? 'bg-accent/15 text-accent'
                                                : 'text-secondary/50 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-[11px] font-semibold truncate">{g.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 shrink-0">
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

                {/* Header with breadcrumb */}
                <header className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-secondary/60">
                        <button
                            onClick={() => navigate('/groups')}
                            className="hover:text-primary transition-colors"
                        >
                            Groups
                        </button>
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

                <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-6 custom-scrollbar">

                    {/* ── INCOMING PENDING REQUESTS ── */}
                    {group.pending_settlements && group.pending_settlements.length > 0 && (
                        <div className="bg-white border border-secondary/10 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-black text-primary flex items-center gap-2 mb-4 text-xs tracking-widest uppercase">
                                <CheckCircle size={16} className="text-emerald-500" /> Confirm Incoming Payments
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {group.pending_settlements.map((req: any) => (
                                    <div key={req.id} className="flex flex-col gap-3 justify-between bg-[#F7F4F0] p-4 rounded-xl border border-secondary/10">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-sm text-primary">{req.sender_name}</span>
                                            <span className="text-emerald-600 font-black text-sm">+€{Number(req.amount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleConfirmRequest(req.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Confirm</button>
                                            <button onClick={() => handleRejectRequest(req.id)} className="flex-1 bg-secondary/10 hover:bg-secondary/20 text-secondary py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── GROUP HEADER CARD ── */}
                    <div className="bg-primary text-white rounded-2xl shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">{group.name}</h1>
                            <p className="text-white/50 font-semibold text-sm max-w-md">{group.description || 'No description provided.'}</p>
                        </div>

                        <div className="relative z-10 bg-white/10 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 items-start md:items-end shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Invite Code</span>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-xl tracking-[0.2em] text-accent">{group.code}</span>
                                <button onClick={handleCopyInvite} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all" title="Copy Code">
                                    <Copy size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── QUICK STATS ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full pointer-events-none" />
                            <div className="flex items-center gap-2 mb-3">
                                <Receipt size={15} className="text-secondary/40" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Total Spent</span>
                            </div>
                            <p className="text-3xl font-black text-primary">€{Number(group.total_spending || 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full pointer-events-none ${groupNetBalance > 0 ? 'bg-emerald-500/10' : groupNetBalance < 0 ? 'bg-red-500/10' : 'bg-primary/5'}`} />
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp size={15} className="text-secondary/40" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Your Balance</span>
                            </div>
                            <p className={`text-3xl font-black ${groupNetBalance > 0 ? 'text-emerald-600' : groupNetBalance < 0 ? 'text-red-500' : 'text-primary'}`}>
                                {groupNetBalance > 0 ? '+' : ''}{groupNetBalance.toFixed(2)}€
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-bl-full pointer-events-none" />
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={15} className="text-secondary/40" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Members</span>
                            </div>
                            <p className="text-3xl font-black text-primary">{group.members?.length || 0}</p>
                        </div>
                    </div>

                    {/* ── TWO COLUMN LAYOUT ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* LEFT: ACTIVITY FEED */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 flex flex-col min-h-[500px]">
                                <div className="px-6 py-5 border-b border-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h2 className="text-base font-black text-primary">Group Activity</h2>
                                        <p className="text-[11px] font-semibold text-secondary/50 mt-0.5">All expenses in this group</p>
                                    </div>
                                    <button
                                        onClick={() => setShowExpenseModal(true)}
                                        className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        <Plus size={16} /> Add Expense
                                    </button>
                                </div>

                                {expensesList.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-16 h-16 bg-[#F7F4F0] rounded-2xl flex items-center justify-center mb-4 border border-secondary/10">
                                            <Receipt size={28} className="text-secondary/30" />
                                        </div>
                                        <h3 className="text-base font-black text-primary mb-1">No expenses yet</h3>
                                        <p className="text-[11px] font-semibold text-secondary/50 max-w-xs">
                                            Be the first to add a bill or expense to kick things off!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col">
                                        <div className="divide-y divide-secondary/5">
                                            {displayedExpenses.map((expense: any) => {
                                                const categoryKey = expense.category || 'General';
                                                const icon = categoryIconMap[categoryKey] || <Tag size={16} />;
                                                const colorClass = categoryColorMap[categoryKey] || 'bg-secondary/10 text-secondary/60';

                                                const myContext = expense.participants?.find((p: any) => String(p.user_id) === String(currentUser?.id));
                                                const iamPayer = String(expense.payer_id) === String(currentUser?.id);

                                                return (
                                                    <div key={expense.id} className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#F7F4F0]/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                                                {icon}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-primary line-clamp-1">{expense.description}</p>
                                                                <p className="text-[10px] font-semibold text-secondary/50 mt-0.5 flex items-center gap-1.5">
                                                                    <span className="font-black text-secondary/70">
                                                                        {iamPayer ? 'You' : expense.payer_name}
                                                                    </span>
                                                                    paid
                                                                    <span className="w-1 h-1 bg-secondary/30 rounded-full inline-block" />
                                                                    {new Date(expense.expense_date || expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-6 pl-13 sm:pl-0">
                                                            {myContext && !iamPayer && (
                                                                <div className="flex flex-col sm:items-end">
                                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-secondary/40">Your Share</span>
                                                                        {myContext.is_settled ? (
                                                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Settled</span>
                                                                        ) : (
                                                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="font-black text-sm text-red-500">€{Number(myContext.share_amount).toFixed(2)}</p>
                                                                </div>
                                                            )}
                                                            {iamPayer && (
                                                                <div className="flex flex-col sm:items-end">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 mb-0.5">You Paid</span>
                                                                </div>
                                                            )}
                                                            <div className="text-right">
                                                                <p className="text-base font-black text-primary">€{Number(expense.amount).toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {expensesList.length > 5 && (
                                            <div className="px-6 py-4 border-t border-secondary/10 flex justify-center">
                                                <button
                                                    onClick={() => setIsFeedExpanded(!isFeedExpanded)}
                                                    className="px-8 py-2.5 bg-white border border-secondary/15 text-[10px] font-black uppercase tracking-widest text-primary/70 rounded-xl flex items-center gap-2 hover:bg-[#F7F4F0] transition-colors active:scale-95 shadow-sm"
                                                >
                                                    {isFeedExpanded ? (
                                                        <>See Less <ChevronUp size={13} strokeWidth={3} /></>
                                                    ) : (
                                                        <>See All <ChevronDown size={13} strokeWidth={3} /></>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: MEMBERS & DEBTS */}
                        <div className="xl:col-span-1 space-y-6">

                            {/* Unpaid Debts */}
                            {group.my_debts && group.my_debts.length > 0 && (
                                <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm p-6 flex flex-col gap-4">
                                    <h2 className="text-sm font-black text-primary flex items-center gap-2">
                                        <AlertCircle size={16} className="text-red-500" /> Your Unpaid Debts
                                    </h2>
                                    <DebtList
                                        debts={group.my_debts}
                                        groupId={String(group.id)}
                                        onRefresh={fetchGroupDetails}
                                        onRefreshGlobal={refreshAllData}
                                    />
                                </div>
                            )}

                            {/* Members */}
                            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-sm font-black text-primary uppercase tracking-widest">Group Members</h2>
                                    <span className="bg-secondary/10 text-secondary/70 text-[10px] font-black px-2.5 py-1 rounded-full">
                                        {sortedMembers.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar max-h-[500px] pr-1">
                                    {sortedMembers.map((m: any) => {
                                        const isMe = String(m.user_id) === String(currentUser?.id);
                                        const isCreator = String(m.user_id) === String(group.creator_id);
                                        const memberBalance = m.balance !== undefined ? Number(m.balance) : 0;

                                        return (
                                            <div key={m.user_id} className="flex items-center justify-between gap-3 p-3 bg-[#F7F4F0] rounded-xl border border-secondary/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary text-accent flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                                                        {m.user_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                                                            {m.user_name}
                                                            {isMe && (
                                                                <span className="bg-accent text-primary px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-black">You</span>
                                                            )}
                                                            {isCreator && (
                                                                <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-black">Admin</span>
                                                            )}
                                                        </p>
                                                        {m.balance !== undefined && memberBalance !== 0 && (
                                                            <p className={`text-[10px] font-black ${memberBalance > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                {memberBalance > 0 ? '+' : ''}{memberBalance.toFixed(2)}€
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            {/* Expense Modal */}
            {showExpenseModal && (
                <ExpenseForm
                    group={group}
                    expenseToEdit={null}
                    onClose={() => setShowExpenseModal(false)}
                    onSuccess={() => {
                        setShowExpenseModal(false);
                        fetchGroupDetails();
                        refreshAllData();
                    }}
                />
            )}
        </div>
    );
};

export default GroupDetails;
