import React from 'react';
import {
    Search, Filter, ChevronDown, ChevronUp, Check, Activity,
    Tag, Utensils, Bus, Zap, Film, Heart, ShoppingCart, ArrowRightLeft, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateExpenseStatus } from '../../utils/expenseStatus';

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
    expectedPayments?: any[];
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
    onSeeMore, onSeeLess, historyRef, user, pendingDebts = [], pendingRequests = [], expectedPayments = []
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
                    <table className="w-full text-left border-collapse table-fixed">
                        <colgroup>
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-secondary/10 bg-secondary/[0.02]">
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-center">Date</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-center">Expense & Group</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-center">Payer</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-center">Your Share</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/5">
                                {filteredExpenses.slice(0, visibleCount).map((expense) => {
                                    const myShareData = expense.participants?.find((p: any) => p.user_id === user?.id);
                                    const expenseDate = expense.created_date ? new Date(expense.created_date) : new Date();
                                    const isPayer = expense.payer_id === user?.id;

                                    const { label, colorClass, status } = calculateExpenseStatus(
                                        expense,
                                        user?.id,
                                        pendingRequests,
                                        expectedPayments
                                    );

                                    return (
                                        <tr key={expense.id} className="hover:bg-secondary/[0.01] transition-colors group h-[70px]">
                                            <td className="px-4 py-2 align-middle text-center">
                                                <span className="text-sm font-bold text-primary/80 whitespace-nowrap">{format(expenseDate, 'dd MMM yyyy')}</span>
                                            </td>
                                            <td className="px-4 py-2 align-middle overflow-hidden text-center">
                                                <div className="flex flex-col items-center min-w-0">
                                                    <span className="text-sm font-bold text-primary truncate whitespace-nowrap w-full" title={expense.description}>
                                                        {expense.description}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-secondary/40 truncate whitespace-nowrap w-full">
                                                        {expense.group_name || 'Personal'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle overflow-hidden text-center">
                                                <div className="flex items-center justify-center gap-2 min-w-0">
                                                    <div className="w-5 h-5 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 text-[9px] font-black shrink-0">
                                                        {isPayer ? 'Y' : (expense.payer_name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-secondary/70 truncate whitespace-nowrap">
                                                        {isPayer ? 'You Paid' : (expense.payer_name || 'Member')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-primary whitespace-nowrap">
                                                        €{Number(myShareData?.share_amount || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-secondary/40 uppercase tracking-tighter whitespace-nowrap">
                                                        of €{Number(expense.amount).toLocaleString('en', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle text-center overflow-hidden">
                                                <div className="flex justify-center">
                                                    <span className={`${colorClass} ${status === 'SETTLED' ? 'inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/5' : ''} text-[10px] font-black uppercase tracking-wider whitespace-nowrap`}>
                                                        {label}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                )}

                {(hasMore || filteredExpenses.length > 5) && (
                    <div className="p-6 flex justify-center bg-gray-50/10 border-t border-secondary/5">
                        {visibleCount < filteredExpenses.length || hasMore ? (
                            <button
                                onClick={onSeeMore}
                                className="px-8 py-2.5 bg-white border border-secondary/15 text-xs font-black uppercase tracking-widest text-primary/80 rounded-xl flex items-center gap-2 hover:bg-gray-50 hover:border-secondary/30 transition-all shadow-sm active:scale-95"
                            >
                                See More <ChevronDown size={14} strokeWidth={3} />
                            </button>
                        ) : (
                            <button
                                onClick={onSeeLess}
                                className="px-8 py-2.5 bg-white border border-secondary/15 text-xs font-black uppercase tracking-widest text-primary/80 rounded-xl flex items-center gap-2 hover:bg-gray-50 hover:border-secondary/30 transition-all shadow-sm active:scale-95"
                            >
                                See Less <ChevronUp size={14} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseHistoryCard;