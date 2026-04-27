import React, { useEffect, useState, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
    LayoutDashboard, Activity, CreditCard, Users, Settings, LogOut,
    Search, Check, X, Bell, Zap, Bus, Film, Heart, ShoppingCart,
    Utensils, ArrowRightLeft, Tag, ShieldCheck, AlertCircle, Filter, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

// ─── TYPESCRIPT INTERFACES ──────────────────────────────────────────────
interface ExpenseParticipantOut {
    user_id: string;
    share_amount: number;
    user_name?: string;
    is_settled: boolean;
}

interface ExpenseOut {
    id: string;
    amount: number;
    description: string;
    category: string;
    expense_date: string;
    group_id: string;
    payer_id: string;
    payer_name: string;
    participants: ExpenseParticipantOut[];
    created_date: string;
}

interface SettlementOut {
    id: string;
    amount: number;
    group_id: string;
    sender_id: string;
    receiver_id: string;
    sender_name?: string;
    receiver_name?: string;
    status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
    created_at: string;
}

// ─── ICON & COLOR MAPPING ──────────────────────────────────────────────────
const categoryIconMap: Record<string, React.ReactNode> = {
    'Food & Dining': <Utensils size={18} />,
    'Transport': <Bus size={18} />,
    'Utilities': <Zap size={18} />,
    'Entertainment': <Film size={18} />,
    'Healthcare': <Heart size={18} />,
    'Shopping': <ShoppingCart size={18} />,
    'Transfer': <ArrowRightLeft size={18} />,
    'General': <Tag size={18} />
};

const categoryColorMap: Record<string, string> = {
    'Food & Dining': 'bg-amber-100 text-amber-700',
    'Transport': 'bg-sky-100 text-sky-700',
    'Utilities': 'bg-violet-100 text-violet-700',
    'Entertainment': 'bg-pink-100 text-pink-700',
    'Healthcare': 'bg-rose-100 text-rose-700',
    'Shopping': 'bg-emerald-100 text-emerald-700',
    'Transfer': 'bg-indigo-100 text-indigo-700',
    'General': 'bg-gray-100 text-gray-600',
};

// ─── NAV HELPER ─────────────────────────────────────────────────────────────
const NavItem = ({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                isActive
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
const Expenses: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [expenses, setExpenses] = useState<ExpenseOut[]>([]);
    const [pendingRequests, setPendingRequests] = useState<SettlementOut[]>([]);
    const [pendingDebts, setPendingDebts] = useState<SettlementOut[]>([]);
    
    // UI states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGroup, setSelectedGroup] = useState<string>("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const historyRef = useRef<HTMLDivElement>(null);
    const [payingDebts, setPayingDebts] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<{title: string, type: 'success'|'error'} | null>(null);

    // Balances
    const [amountToReceive, setAmountToReceive] = useState(0);
    const [amountOwed, setAmountOwed] = useState(0);

    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ title, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expensesRes, groupsRes, dashboardRes] = await Promise.all([
                api.get('/users/me/expenses'),
                api.get('/groups/me'),
                api.get('/users/me/settlement_dashboard')
            ]);

            setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);

            // Calculate Balances exactly as Dashboard does
            const groupsData = groupsRes.data || [];
            let owedToYou = 0;
            let youOwe = 0;
            groupsData.forEach((group: any) => {
                const balance = Number(group.net_balance || 0);
                if (balance > 0) owedToYou += balance;
                else if (balance < 0) youOwe += Math.abs(balance);
            });
            setAmountToReceive(owedToYou);
            setAmountOwed(youOwe);

            // Filter Settlements strictly by PENDING (Though they usually are)
            const globalRequests = dashboardRes.data?.global_requests || [];
            const globalDebts = dashboardRes.data?.global_debts || [];
            
            // Map the simple dict format to our interface where applicable
            // Example response from backend: { id, sender_name, amount, group_name... } 
            setPendingRequests(globalRequests);
            setPendingDebts(globalDebts);

        } catch (error) {
            console.error("Error loading expenses page data:", error);
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Settlement Handlers
    const handleConfirmRequest = async (id: string) => {
        try {
            await api.patch(`/settlements/${id}/confirm`);
            
            // Optimistic UI updates
            setPendingRequests(prev => prev.filter(req => req.id !== id));
            setExpenses(prev => prev.map(expense => ({
                ...expense,
                participants: expense.participants.map(p => ({ ...p, is_settled: true })) // Visual only until refetch
            })));

            showToast("Settlement Confirmed!");
            fetchData();
        } catch (err) {
            showToast("Error confirming settlement", "error");
        }
    };

    const handleRejectRequest = async (id: string) => {
        try {
            await api.patch(`/settlements/${id}/reject`);
            showToast("Settlement Rejected", "error");
            fetchData();
        } catch (err) {
            showToast("Error rejecting settlement", "error");
        }
    };

    const handlePayDebt = async (debt: any) => {
        const debtId = `${debt.group_id}-${debt.user_id}`;
        try {
            setPayingDebts(prev => new Set(prev).add(debtId));
            
            // Ensure payload types strictly match Validation schema
            const payload = {
                amount: parseFloat(Number(debt.amount).toFixed(2)),
                group_id: debt.group_id,
                receiver_id: debt.user_id
            };
            console.log("Submitting settlement payload:", payload);

            const res = await api.post('/api/v2/settlements', payload);
            
            if (res.status === 200 || res.status === 201) {
                showToast("Payment submitted for confirmation!");
            } else {
                throw new Error("Unexpected status: " + res.status);
            }
            fetchData();
        } catch (err) {
            console.error("API Error in handlePayDebt:", err);
            setPayingDebts(prev => {
                const next = new Set(prev);
                next.delete(debtId);
                return next;
            });
            showToast("Error submitting payment.", "error");
        }
    };

    // Derived Data
    const uniqueGroups = useMemo(() => {
        const groups = expenses
            .map(e => (e as any).group_name || `Group ${e.group_id.slice(0, 6)}`)
            .filter(Boolean);
        return ["All", ...new Set(groups)];
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
            const groupName = (e as any).group_name || `Group ${e.group_id.slice(0, 6)}`;
            const matchesGroup = selectedGroup === "All" || groupName === selectedGroup;
            return matchesSearch && matchesGroup;
        });
    }, [expenses, searchQuery, selectedGroup]);


    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">
                {/* Simplified Sidebar Skeleton */}
                <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0 opacity-80" />
                <main className="flex-1 flex flex-col p-8 gap-8 animate-pulse">
                     <div className="h-8 w-48 bg-secondary/10 rounded-xl" />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="h-32 bg-white rounded-2xl shadow-sm" />
                         <div className="h-32 bg-white rounded-2xl shadow-sm md:col-span-2" />
                     </div>
                     <div className="flex-1 bg-white rounded-2xl shadow-sm" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary relative">
            
            {/* ── TOAST ZONE ── */}
            {toastMessage && (
                <div className={`fixed top-6 right-8 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 font-bold text-sm tracking-wide transition-all ${
                    toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
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
                {/* Header */}
                <header className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-primary tracking-tight">Expenses</h1>
                        <p className="text-sm text-secondary/70 font-semibold mt-0.5">Manage your transactions and settlements</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-secondary hover:text-primary transition-colors">
                            <Bell size={22} />
                            {pendingRequests.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />}
                        </button>
                        <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-bold tracking-tight">{user?.name || 'User'}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 custom-scrollbar">
                    
                    {/* ── TOP SECTION: BALANCES (Top Row) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col gap-2 relative overflow-hidden h-full">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                            <p className="text-xs font-black uppercase tracking-widest text-secondary/60">To Receive</p>
                            <p className="text-3xl font-black text-emerald-600">€{amountToReceive.toFixed(2)}</p>
                            <p className="text-[10px] text-secondary/50 font-bold mt-1">Total pending from others</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col gap-2 relative overflow-hidden h-full">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full pointer-events-none" />
                            <p className="text-xs font-black uppercase tracking-widest text-secondary/60">To Pay</p>
                            <p className="text-3xl font-black text-danger">€{amountOwed.toFixed(2)}</p>
                            <p className="text-[10px] text-secondary/50 font-bold mt-1">Total owed across groups</p>
                        </div>
                    </div>

                    {/* ── MIDDLE SECTION: ACTIONS (Middle Row - 50/50 Desktop) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                        {/* 1. Pending Requests (Incoming) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col flex-1 h-full min-h-[300px]">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xs font-black uppercase tracking-widest text-primary/70">Pending Requests</h2>
                                <span className="text-[10px] bg-accent/20 text-primary font-bold px-3 py-1 rounded-full">
                                    {pendingRequests.length} Awaiting
                                </span>
                            </div>

                            {pendingRequests.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-secondary/40 min-h-[150px]">
                                    <ShieldCheck size={32} />
                                    <p className="text-xs font-bold uppercase tracking-wider">All caught up!</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-x-auto custom-scrollbar flex flex-col gap-4 pb-2">
                                    {pendingRequests.map((req: any) => (
                                        <div key={req.id} className="w-full bg-surface/20 border border-surface/50 rounded-xl p-4 flex flex-col transition-colors hover:bg-surface/30">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-sm font-bold text-primary">{req.sender_name || 'Sender'}</p>
                                                    <p className="text-[10px] font-semibold text-secondary/70">in {(req as any).group_name || 'Group'}</p>
                                                </div>
                                                <p className="text-sm font-black text-emerald-600">+€{Number(req.amount).toFixed(2)}</p>
                                            </div>
                                            <div className="mt-auto flex gap-2">
                                                <button 
                                                    onClick={() => handleConfirmRequest(req.id)}
                                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Check size={14} /> Accept
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectRequest(req.id)}
                                                    className="flex-1 bg-white border border-secondary/20 hover:bg-danger/5 hover:text-danger hover:border-danger/30 text-secondary text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <X size={14} /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Debts to Settle (Outgoing) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col flex-1 h-full min-h-[300px]">
                            <h2 className="text-xs font-black uppercase tracking-widest text-primary/70 mb-5 flex items-center gap-2">
                                <CreditCard size={16} /> Debts to Settle
                            </h2>
                            
                            {pendingDebts.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-secondary/40 min-h-[150px]">
                                    <ShieldCheck size={32} />
                                    <p className="text-xs font-bold uppercase tracking-wider">No pending debts!</p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                    {pendingDebts.map((debt: any) => {
                                        const debtId = `${debt.group_id}-${debt.user_id}`;
                                        const isPaying = payingDebts.has(debtId);
                                        return (
                                            <div key={debtId} className="bg-red-50/30 border border-red-100/50 rounded-xl p-4 flex flex-col gap-3 relative transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-primary text-sm">{debt.user_name || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-secondary/60 font-semibold">{debt.group_name || 'Group'}</p>
                                                    </div>
                                                    <p className="font-black text-danger text-base">€{Number(debt.amount).toFixed(2)}</p>
                                                </div>
                                                <button 
                                                    disabled={isPaying}
                                                    onClick={() => handlePayDebt(debt)}
                                                    className={`w-full flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors ${
                                                        isPaying 
                                                            ? 'bg-secondary/10 text-secondary/50 cursor-not-allowed border border-transparent' 
                                                            : 'bg-white border border-secondary/20 text-primary hover:bg-danger/5 hover:text-danger hover:border-danger/30'
                                                    }`}
                                                >
                                                    {isPaying ? (
                                                        <><Clock size={14} /> Pending Confirmation</>
                                                    ) : (
                                                        <><CreditCard size={14} /> Pay Now</>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── EXPENSE HISTORY (FEED) ── */}
                    <div ref={historyRef} className="bg-white rounded-2xl shadow-sm border border-secondary/10 flex flex-col flex-1 mt-2">
                        {/* Toolbar (Search & Filter) */}
                        <div className="px-6 py-5 border-b border-secondary/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <h2 className="text-base font-black text-primary tracking-tight">Expense History</h2>
                            
                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                                    <input 
                                        type="text"
                                        placeholder="Search description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-secondary/20 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                                    />
                                </div>
                                
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-secondary/20 rounded-xl text-sm font-semibold text-primary transition-all hover:bg-gray-100 min-w-[140px] justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Filter size={16} className="text-secondary/60" />
                                            {selectedGroup}
                                        </div>
                                        <ChevronDown size={14} className={`text-secondary transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isFilterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-secondary/10 z-50 py-1 overflow-hidden">
                                                {selectedGroup !== "All" && (
                                                    <button 
                                                        onClick={() => { setSelectedGroup("All"); setIsFilterOpen(false); }}
                                                        className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-secondary/60 hover:text-primary hover:bg-surface/30 transition-colors border-b border-secondary/5"
                                                    >
                                                        Clear Filter
                                                    </button>
                                                )}
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                    {uniqueGroups.map(grp => (
                                                        <button 
                                                            key={grp}
                                                            onClick={() => { setSelectedGroup(grp); setIsFilterOpen(false); }}
                                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold ${
                                                                selectedGroup === grp ? 'bg-primary/5 text-primary' : 'hover:bg-surface/50 text-secondary'
                                                            } transition-colors`}
                                                        >
                                                            <span className="truncate">{grp}</span>
                                                            {selectedGroup === grp && <Check size={14} className="text-accent" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-x-auto min-h-[400px]">
                            {filteredExpenses.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-secondary/40 gap-3 min-h-[300px]">
                                    <Activity size={32} />
                                    <p className="text-sm font-semibold tracking-wide">No expenses found matching your criteria</p>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-secondary/10 bg-gray-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70">Transaction</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70 hidden md:table-cell">Category</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70 hidden sm:table-cell">Payer</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70">Your Share</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary/5">
                                            {filteredExpenses.slice(0, isHistoryExpanded ? filteredExpenses.length : 5).map((expense) => {
                                                const categoryKey = expense.category || 'General';
                                                const icon = categoryIconMap[categoryKey] || <Tag size={18} />;
                                                const colorClass = categoryColorMap[categoryKey] || 'bg-gray-100 text-gray-600';
                                                
                                                // Handle dates safely
                                                const dateObj = new Date(expense.expense_date || expense.created_date || Date.now());
                                                const fmtDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                                                
                                                // Find User's specific share in this expense
                                                const myShareData = expense.participants?.find(p => p.user_id === user?.id);
                                                const myShare = myShareData ? myShareData.share_amount : 0;
                                                const isSettled = myShareData ? myShareData.is_settled : false;
                                                const amIPayer = expense.payer_id === user?.id;

                                                return (
                                                    <tr key={expense.id} className="hover:bg-surface/20 transition-colors group cursor-pointer">
                                                        {/* Col 1: Transaction name & date */}
                                                        <td className="px-6 py-4 relative">
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-accent rounded-r-full transition-all group-hover:h-8" />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-primary group-hover:text-secondary transition-colors truncate max-w-[200px]">
                                                                    {expense.description}
                                                                </span>
                                                                <span className="text-[10px] font-semibold text-secondary/60">
                                                                    {fmtDate} • {(expense as any).group_name || `Group ${expense.group_id.slice(0, 4)}`}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        
                                                        {/* Col 2: Category */}
                                                        <td className="px-6 py-4 hidden md:table-cell">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                                                    {icon}
                                                                </div>
                                                                <span className="text-xs font-bold text-primary">{categoryKey}</span>
                                                            </div>
                                                        </td>

                                                        {/* Col 3: Payer */}
                                                        <td className="px-6 py-4 hidden sm:table-cell">
                                                            <div className="flex items-center gap-2">
                                                                {amIPayer ? (
                                                                    <span className="text-xs font-bold bg-primary/5 text-primary px-2 py-1 rounded-md">You Paid</span>
                                                                ) : (
                                                                    <span className="text-xs font-semibold text-secondary/90">{expense.payer_name || 'Someone'}</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Col 4: Your Share */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-primary">€{Number(myShare).toFixed(2)}</span>
                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-secondary/50">of €{Number(expense.amount).toFixed(2)} Total</span>
                                                            </div>
                                                        </td>

                                                        {/* Col 5: Status */}
                                                        <td className="px-6 py-4 text-center">
                                                            {myShare === 0 ? (
                                                                <span className="text-[10px] font-black uppercase text-secondary/40">N/A</span>
                                                            ) : amIPayer ? (
                                                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 whitespace-nowrap">
                                                                    Paid By You
                                                                </span>
                                                            ) : isSettled ? (
                                                                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full border border-gray-200 whitespace-nowrap">
                                                                    Settled
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-black uppercase tracking-widest bg-danger/10 text-danger px-3 py-1.5 rounded-full border border-danger/20 whitespace-nowrap">
                                                                    Unsettled
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    
                                    {/* Pagination Toggle Button */}
                                    {filteredExpenses.length > 5 && (
                                        <div className="p-5 flex justify-center border-t border-secondary/5 bg-gray-50/30 rounded-b-2xl">
                                            <button 
                                                onClick={() => {
                                                    if (isHistoryExpanded && historyRef.current) {
                                                        historyRef.current.scrollIntoView({ behavior: 'smooth' });
                                                    }
                                                    setIsHistoryExpanded(!isHistoryExpanded);
                                                }}
                                                className="px-6 py-2.5 bg-white border border-secondary/20 hover:border-primary text-sm font-bold text-primary rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 group"
                                            >
                                                {isHistoryExpanded ? (
                                                    <>See Less <ChevronUp size={16} className="text-secondary/60 group-hover:text-primary transition-colors" /></>
                                                ) : (
                                                    <>See More <ChevronDown size={16} className="text-secondary/60 group-hover:text-primary transition-colors" /></>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Expenses;
