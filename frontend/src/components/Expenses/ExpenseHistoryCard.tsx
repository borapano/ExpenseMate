import React from 'react';
import {
    Search, Filter, ChevronDown, ChevronUp, Check, Activity,
    Tag, Utensils, Bus, Zap, Film, Heart, ShoppingCart, ArrowRightLeft, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
    filteredExpenses: any[];
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    selectedGroup: { id: string | null, name: string };
    setSelectedGroup: (val: { id: string | null, name: string }) => void;
    uniqueGroups: { id: string | null, name: string }[];
    isFilterOpen: boolean;
    setIsFilterOpen: (val: boolean) => void;
    hasMore: boolean;
    visibleCount: number;
    onSeeMore: () => void;
    onSeeLess: () => void;
    historyRef: React.RefObject<HTMLDivElement | null>;
    user: any;
    pendingDebts?: any[];
    pendingRequests?: any[];
}

const categoryIconMap: Record<string, React.ReactNode> = {
    'Food & Dining': <Utensils size={18} />,
    'Transport': <Bus size={18} />,
    'Transportation': <Bus size={18} />,
    'Utilities': <Zap size={18} />,
    'Entertainment': <Film size={18} />,
    'Healthcare': <Heart size={18} />,
    'Health': <Heart size={18} />,
    'Shopping': <ShoppingCart size={18} />,
    'Transfer': <ArrowRightLeft size={18} />,
    'Other': <HelpCircle size={18} />,
    'General': <Tag size={18} />
};

const categoryColorMap: Record<string, string> = {
    'Food & Dining': 'bg-amber-100 text-amber-700',
    'Transport': 'bg-sky-100 text-sky-700',
    'Transportation': 'bg-sky-100 text-sky-700',
    'Utilities': 'bg-violet-100 text-violet-700',
    'Entertainment': 'bg-pink-100 text-pink-700',
    'Healthcare': 'bg-rose-100 text-rose-700',
    'Health': 'bg-rose-100 text-rose-700',
    'Shopping': 'bg-emerald-100 text-emerald-700',
    'Transfer': 'bg-indigo-100 text-indigo-700',
    'Other': 'bg-gray-100 text-gray-600',
    'General': 'bg-gray-100 text-gray-600',
};

const ExpenseHistoryCard: React.FC<Props> = ({
    filteredExpenses, searchQuery, setSearchQuery, selectedGroup, setSelectedGroup,
    uniqueGroups, isFilterOpen, setIsFilterOpen, hasMore, visibleCount,
    onSeeMore, onSeeLess, historyRef, user, pendingDebts = [], pendingRequests = []
}) => {
    return (
        <div ref={historyRef} className="bg-white rounded-2xl shadow-sm border border-secondary/10 flex flex-col flex-1 mt-2 transition-shadow duration-200 hover:shadow-md">
            <div className="px-6 py-5 border-b border-secondary/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                    Expense History
                </h2>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                        <input
                            type="text"
                            placeholder="Search description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-secondary/20 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-secondary/20 rounded-xl text-sm font-semibold text-primary transition-all hover:bg-gray-100 min-w-[140px] justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-secondary/60" />
                                {selectedGroup.name}
                            </div>
                            <ChevronDown size={14} className={`text-secondary transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-secondary/10 z-50 py-1 overflow-hidden">
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {uniqueGroups.map(grp => (
                                        <button
                                            key={grp.id || 'all'}
                                            type="button"
                                            onClick={() => { setSelectedGroup(grp); setIsFilterOpen(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold ${selectedGroup.id === grp.id ? 'bg-primary/5 text-primary' : 'hover:bg-gray-50 text-secondary'
                                                }`}
                                        >
                                            <span className="truncate">{grp.name}</span>
                                            {selectedGroup.id === grp.id && <Check size={14} className="text-accent" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[400px]">
                {filteredExpenses.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-secondary/40 gap-3 min-h-[300px]">
                        <Activity size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-wider">No expenses found</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-secondary/10 bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70">Transaction</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70 hidden md:table-cell">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70 hidden sm:table-cell">Payer</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70">Your Share</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/70 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/5">
                            {filteredExpenses.slice(0, visibleCount).map((expense) => {
                                const categoryKey = expense.category || 'General';
                                const myShareData = expense.participants?.find((p: any) => p.user_id === user?.id);

                                const expenseDate = expense.created_date ? new Date(expense.created_date) : new Date();

                                // Status logic
                                let statusText = "UNSETTLED";
                                let statusClasses = "bg-red-50 text-red-600 border-red-100";
                                
                                const isPayer = expense.payer_id === user?.id;
                                
                                if (!isPayer && myShareData?.is_settled) {
                                    statusText = "SETTLED";
                                    statusClasses = "bg-gray-100 text-gray-500 border-gray-200";
                                } else if (isPayer) {
                                    // Calculate how much is left to receive for this expense
                                    const totalOwedToMe = expense.participants.reduce((acc: number, p: any) => {
                                        if (p.user_id !== user?.id && !p.is_settled) return acc + Number(p.share_amount);
                                        return acc;
                                    }, 0);
                                    
                                    if (totalOwedToMe === 0) {
                                        statusText = "SETTLED";
                                        statusClasses = "bg-gray-100 text-gray-500 border-gray-200";
                                    } else {
                                        // User is Payer, check if there are pending incoming requests for this group
                                        const groupRequests = pendingRequests.filter(r => r.group_id === expense.group_id);
                                        if (groupRequests.length > 0) {
                                            statusText = "Awaiting Confirmation";
                                            statusClasses = "bg-amber-50 text-amber-600 border-amber-100";
                                        } else {
                                            statusText = `To Receive: €${totalOwedToMe.toFixed(2)}`;
                                            statusClasses = "bg-emerald-50 text-emerald-600 border-emerald-100";
                                        }
                                    }
                                } else {
                                    // User owes money for this expense
                                    // Check if user has a pending sent settlement for this group
                                    const groupDebts = pendingDebts.filter(d => d.group_id === expense.group_id && d.is_pending);
                                    if (groupDebts.length > 0) {
                                        statusText = "Pending (Sent)";
                                        statusClasses = "bg-amber-50 text-amber-600 border-amber-100";
                                    }
                                }

                                return (
                                    <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-primary">{format(expenseDate, 'dd MMM yyyy')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-primary truncate max-w-[200px]">{expense.description}</span>
                                                <span className="text-[10px] font-semibold text-secondary/60">{(expense as any).group_name || 'Group'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${categoryColorMap[categoryKey] || 'bg-gray-100'}`}>{categoryIconMap[categoryKey] || <Tag size={18} />}</div>
                                                <span className="text-xs font-bold">{categoryKey}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            {isPayer ?
                                                <span className="text-xs font-bold bg-primary/5 text-primary px-2 py-1 rounded-md">You Paid</span> :
                                                <span className="text-xs font-semibold">{expense.payer_name}</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-primary">
                                                    €{Number(myShareData?.share_amount || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[9px] font-bold uppercase text-secondary/50">
                                                    of €{Number(expense.amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${statusClasses}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {(hasMore || visibleCount > 5) && (
                    <div className="p-5 flex justify-center bg-gray-50/30">
                        {hasMore ? (
                            <button
                                onClick={onSeeMore}
                                className="px-6 py-2 bg-white border border-secondary/20 text-sm font-bold text-primary rounded-xl flex items-center gap-2 hover:shadow-sm transition-all"
                            >
                                See More <ChevronDown size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={onSeeLess}
                                className="px-6 py-2 bg-white border border-secondary/20 text-sm font-bold text-primary rounded-xl flex items-center gap-2 hover:shadow-sm transition-all"
                            >
                                See Less <ChevronUp size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseHistoryCard;