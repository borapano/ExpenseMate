import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import ExpenseForm from '../components/ExpenseForm';
import DebtList from '../components/DebtList';
import { 
    CheckCircle, AlertCircle, Copy, Plus, Users, Receipt, TrendingUp, ChevronLeft,
    Utensils, Bus, Zap, Film, Heart, ShoppingCart, ArrowRightLeft, Tag, ChevronDown, ChevronUp, ShieldCheck
} from 'lucide-react';

const categoryIconMap: Record<string, React.ReactNode> = {
    'Food & Dining': <Utensils size={18} />,
    'Transport': <Bus size={18} />,
    'Utilities': <Zap size={18} />,
    'Entertainment': <Film size={18} />,
    'Healthcare': <Heart size={18} />,
    'Shopping': <ShoppingCart size={18} />,
    'Transfer': <ArrowRightLeft size={18} />,
    'Ushqim': <Utensils size={18} />,
    'Qira': <Zap size={18} />,
    'Argëtim': <Film size={18} />,
    'Fatura': <Zap size={18} />
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
    'Fatura': 'bg-violet-100 text-violet-700'
};

const GroupDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { refreshAllData } = useData();

    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Limits
    const [isFeedExpanded, setIsFeedExpanded] = useState(false);

    // Modals & Action States
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<{title: string, type: 'success'|'error'} | null>(null);

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
            console.error('[GroupDetails] API Error:', err.response);
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
        } catch (err) {
            showToast("Error confirming payment.", "error");
        }
    };

    const handleRejectRequest = async (reqId: string) => {
        try {
            await api.patch(`/settlements/${reqId}/reject`);
            showToast("Payment request rejected.", "error");
            fetchGroupDetails();
            refreshAllData();
        } catch (err) {
            showToast("Error rejecting payment.", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F4F0] p-8 flex flex-col gap-6 font-sans">
                {/* Skeleton Header */}
                <div className="h-10 w-24 bg-secondary/10 rounded-xl mb-4 animate-pulse" />
                <div className="h-32 bg-white rounded-[2rem] animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-24 bg-white rounded-2xl animate-pulse" />
                    <div className="h-24 bg-white rounded-2xl animate-pulse" />
                    <div className="h-24 bg-white rounded-2xl animate-pulse" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-white rounded-[2rem] animate-pulse" />
                    <div className="lg:col-span-1 h-96 bg-white rounded-[2rem] animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="min-h-screen bg-[#F7F4F0] p-8 flex items-center justify-center font-sans">
                <div className="text-center bg-white p-12 rounded-[2rem] shadow-sm max-w-lg">
                    <AlertCircle className="mx-auto block text-danger mb-4" size={48} />
                    <h2 className="text-2xl font-black text-primary mb-2">Oops!</h2>
                    <p className="text-secondary/70 font-semibold mb-6">{error}</p>
                    <button onClick={() => navigate('/groups')} className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all">
                        Back to Groups
                    </button>
                </div>
            </div>
        );
    }

    // Sort Users
    const sortedMembers = group.members ? [...group.members].sort((a: any, b: any) => {
        if (String(a.user_id) === String(group.creator_id)) return -1;
        if (String(b.user_id) === String(group.creator_id)) return 1;
        return a.user_name.localeCompare(b.user_name);
    }) : [];

    // Extracting user explicitly from expenses
    const expensesList = group.expenses || [];
    const displayedExpenses = isFeedExpanded ? expensesList : expensesList.slice(0, 5);

    const groupNetBalance = Number(group.net_balance || 0);

    return (
        <div className="min-h-screen bg-[#F7F4F0] p-4 sm:p-8 font-sans text-primary">
            
            {/* ── TOAST ZONE ── */}
            {toastMessage && (
                <div className={`fixed top-6 right-8 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 font-bold text-sm tracking-wide transition-all ${
                    toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {toastMessage.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                    {toastMessage.title}
                </div>
            )}

            {/* Back Button */}
            <div className="max-w-[1400px] mx-auto mb-6">
                <button onClick={() => navigate('/groups')} className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-bold text-sm bg-white/50 px-4 py-2 rounded-xl blur-backdrop">
                    <ChevronLeft size={18} /> Back to Groups
                </button>
            </div>

            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* ── INCOMING PENDING REQUESTS ── */}
                {group.pending_settlements && group.pending_settlements.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-4 text-sm tracking-wide uppercase">
                            <CheckCircle size={18} /> Confirm Incoming Payments
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.pending_settlements.map((req: any) => (
                                <div key={req.id} className="flex flex-col gap-3 justify-between bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm">{req.sender_name}</span>
                                        <span className="text-emerald-600 font-black">+€{Number(req.amount).toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleConfirmRequest(req.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Confirm</button>
                                        <button onClick={() => handleRejectRequest(req.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── HEADER ── */}
                <div className="bg-primary text-white rounded-[2rem] shadow-md p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 w-full md:w-auto">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{group.name}</h1>
                        <p className="text-white/60 font-medium text-sm max-w-md">{group.description || 'No description provided for this group.'}</p>
                    </div>
                    
                    <div className="relative z-10 w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-1 items-start md:items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Invite Code</span>
                        <div className="flex items-center gap-3">
                            <span className="font-black text-2xl tracking-[0.2em] text-accent">{group.code}</span>
                            <button onClick={handleCopyInvite} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all group" title="Copy Code">
                                <Copy size={16} className="group-active:scale-95 group-active:text-accent transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── QUICK STATS ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
                        <div className="flex items-center gap-2 mb-3 text-secondary/60">
                            <Receipt size={16} /> <span className="text-xs font-black uppercase tracking-widest">Total Spent</span>
                        </div>
                        <p className="text-3xl font-black text-primary">€{Number(group.total_spending || 0).toFixed(2)}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none ${groupNetBalance > 0 ? 'bg-emerald-500/10' : groupNetBalance < 0 ? 'bg-danger/10' : 'bg-primary/5'}`} />
                        <div className="flex items-center gap-2 mb-3 text-secondary/60">
                            <TrendingUp size={16} /> <span className="text-xs font-black uppercase tracking-widest">Your Net Bal</span>
                        </div>
                        <p className={`text-3xl font-black ${groupNetBalance > 0 ? 'text-emerald-500' : groupNetBalance < 0 ? 'text-danger' : 'text-primary'}`}>
                            {groupNetBalance > 0 ? '+' : ''}{groupNetBalance.toFixed(2)}€
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full pointer-events-none" />
                        <div className="flex items-center gap-2 mb-3 text-secondary/60">
                            <Users size={16} /> <span className="text-xs font-black uppercase tracking-widest">Members</span>
                        </div>
                        <p className="text-3xl font-black text-primary">{group.members?.length || 0}</p>
                    </div>
                </div>

                {/* ── TWO COLUMN MAIN CONTENT ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: ACTIVITY FEED (70%) */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-secondary/10 flex flex-col min-h-[500px]">
                            <div className="p-8 border-b border-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-primary">Group Activity</h2>
                                    <p className="text-sm font-semibold text-secondary/60 mt-1">Expenses limited to this hub only</p>
                                </div>
                                <button 
                                    onClick={() => setShowExpenseModal(true)}
                                    className="bg-accent hover:bg-accent/90 text-primary px-6 py-4 rounded-2xl font-black shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                                >
                                    <Plus size={20} /> Add Expense
                                </button>
                            </div>

                            {expensesList.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center mb-6 border border-secondary/10">
                                        <Receipt size={32} className="text-secondary/30" />
                                    </div>
                                    <h3 className="text-xl font-black text-primary mb-2">No expenses yet</h3>
                                    <p className="text-secondary/60 max-w-sm mb-6">
                                        Be the first one to add a bill or expense to kick things off!
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div className="divide-y divide-secondary/5 px-4">
                                        {displayedExpenses.map((expense: any) => {
                                            const categoryKey = expense.category || 'General';
                                            const icon = categoryIconMap[categoryKey] || <Tag size={18} />;
                                            const colorClass = categoryColorMap[categoryKey] || 'bg-gray-100 text-gray-600';
                                            
                                            // Extract explicit user share mapping
                                            const myContext = expense.participants?.find((p: any) => String(p.user_id) === String(currentUser?.id));
                                            const iamPayer = String(expense.payer_id) === String(currentUser?.id);

                                            return (
                                                <div key={expense.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group-hover:bg-surface/30 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                                            {icon}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary text-base line-clamp-1">{expense.description}</p>
                                                            <p className="text-xs font-semibold text-secondary/60 mt-1 flex items-center gap-1.5">
                                                                <span className="font-black text-secondary">
                                                                    {iamPayer ? 'You' : expense.payer_name}
                                                                </span> paid
                                                                <span className="w-1 h-1 bg-secondary/30 rounded-full inline-block" />
                                                                {new Date(expense.expense_date || expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 sm:gap-8 pl-16 sm:pl-0">
                                                        {myContext && !iamPayer && (
                                                            <div className="flex flex-col sm:items-end">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/50">Your Share</span>
                                                                    {myContext.is_settled ? (
                                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Settled</span>
                                                                    ) : (
                                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                                                                    )}
                                                                </div>
                                                                <p className="font-bold text-sm text-danger">€{Number(myContext.share_amount).toFixed(2)}</p>
                                                            </div>
                                                        )}
                                                        {iamPayer && (
                                                            <div className="flex flex-col sm:items-end">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">You Paid</span>
                                                                <p className="font-bold text-sm text-emerald-600 hidden sm:block">Total</p>
                                                            </div>
                                                        )}
                                                        <div className="text-right">
                                                            <p className="text-[10px] sm:hidden font-black uppercase tracking-widest text-secondary/50 mb-1">Total</p>
                                                            <p className="text-lg font-black text-primary">€{Number(expense.amount).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {expensesList.length > 5 && (
                                        <div className="p-6 border-t border-secondary/5 bg-gray-50/50 rounded-b-[2rem] flex justify-center">
                                            <button 
                                                onClick={() => setIsFeedExpanded(!isFeedExpanded)}
                                                className="px-6 py-2.5 bg-white border border-secondary/20 hover:border-primary text-sm font-bold text-primary rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 group/btn"
                                            >
                                                {isFeedExpanded ? (
                                                    <>See Less <ChevronUp size={16} className="text-secondary/60 group-hover/btn:text-primary transition-colors" /></>
                                                ) : (
                                                    <>See All Expenses <ChevronDown size={16} className="text-secondary/60 group-hover/btn:text-primary transition-colors" /></>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: MEMBERS & BALANCES (30%) */}
                    <div className="xl:col-span-1 space-y-6">
                        
                        {/* Self Depts in this Group - Using DebtList if any exist (to keep Optimistic UI) */}
                        {group.my_debts && group.my_debts.length > 0 && (
                            <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-secondary/10 shadow-sm flex flex-col gap-4">
                                <h2 className="text-lg font-black text-primary flex items-center gap-2">
                                    <AlertCircle size={20} className="text-danger" /> Your Unpaid Debts 
                                </h2>
                                <DebtList 
                                    debts={group.my_debts}
                                    groupId={String(group.id)}
                                    onRefresh={fetchGroupDetails}
                                    onRefreshGlobal={refreshAllData}
                                />
                            </div>
                        )}

                        {/* Members Card */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-secondary/10 p-6 sm:p-8 flex flex-col">
                            <h2 className="text-xl font-black text-primary mb-6 flex items-center justify-between">
                                Group Members
                                <span className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-full">{sortedMembers.length}</span>
                            </h2>
                            <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                                {sortedMembers.map((m: any) => {
                                    const isMe = String(m.user_id) === String(currentUser?.id);
                                    // if backend provides balance inside members array we can use it:
                                    const memberBalance = m.balance !== undefined ? Number(m.balance) : 0; 

                                    return (
                                        <div key={m.user_id} className="flex items-center justify-between gap-3 p-3 bg-surface/30 rounded-2xl border border-surface">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary text-accent flex items-center justify-center font-black text-lg shadow-sm">
                                                    {m.user_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-sm text-primary flex items-center gap-2">
                                                        {m.user_name}
                                                        {isMe && <span className="bg-accent text-primary px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-black">You</span>}
                                                    </p>
                                                    {/* In case backend didn't provide individual balances or its missing */}
                                                    {m.balance !== undefined && memberBalance !== 0 && (
                                                        <p className={`text-xs font-bold leading-tight ${memberBalance > 0 ? 'text-emerald-500' : 'text-danger'}`}>
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

            {/* Expense Modal Wrapper */}
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