import React from 'react';
import {
    Search, Filter, ChevronDown, ChevronUp, Check, Activity,
    Utensils, ShoppingBasket, Car, Home, Zap, Film,
    ShoppingCart, Plane, Heart, FileText, Tag
} from 'lucide-react';

/*
 * ExpenseHistoryCard — The Source of Truth (Universal Ledger).
 *
 * Shows ALL expenses where the user is a participant or payer,
 * sorted newest → oldest.
 *
 * Status derivation uses the BACKEND `transaction_status` field:
 *
 *   "CONFIRMED" → "ISSUED" badge (settlement was confirmed, debt is closed)
 *   "PENDING"   → "In Verification" badge (settlement sent, awaiting V/X)
 *   "NONE"      → derive from user_balance:
 *                    balance < 0  → "-€X (To Pay)"      — I owe
 *                    balance > 0  → "+€X (To Be Paid)"  — I'm owed
 *                    balance == 0 → "ISSUED"             — edge case, no debt
 *
 * The frontend NEVER derives status independently — it trusts the backend.
 */

interface Props {
    filteredExpenses: any[];
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    selectedGroup: { id: string | null; name: string };
    setSelectedGroup: (v: { id: string | null; name: string }) => void;
    uniqueGroups: { id: string | null; name: string }[];
    isFilterOpen: boolean;
    setIsFilterOpen: (v: boolean) => void;
    hasMore: boolean;
    visibleCount: number;
    onSeeMore: () => void;
    onSeeLess: () => void;
    historyRef: React.RefObject<HTMLDivElement | null>;
    user: any;
}

// ── Category style map ─────────────────────────────────────────────────────
const CAT: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
    'Food & Dining': { icon: <Utensils size={14} />, bg: 'bg-amber-100', text: 'text-amber-700' },
    'Groceries': { icon: <ShoppingBasket size={14} />, bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'Transportation': { icon: <Car size={14} />, bg: 'bg-sky-100', text: 'text-sky-700' },
    'Transport': { icon: <Car size={14} />, bg: 'bg-sky-100', text: 'text-sky-700' },
    'Housing': { icon: <Home size={14} />, bg: 'bg-indigo-100', text: 'text-indigo-700' },
    'Utilities': { icon: <Zap size={14} />, bg: 'bg-violet-100', text: 'text-violet-700' },
    'Entertainment': { icon: <Film size={14} />, bg: 'bg-pink-100', text: 'text-pink-700' },
    'Shopping': { icon: <ShoppingCart size={14} />, bg: 'bg-rose-100', text: 'text-rose-700' },
    'Travel': { icon: <Plane size={14} />, bg: 'bg-cyan-100', text: 'text-cyan-700' },
    'Health': { icon: <Heart size={14} />, bg: 'bg-red-100', text: 'text-red-700' },
    'Healthcare': { icon: <Heart size={14} />, bg: 'bg-red-100', text: 'text-red-700' },
    'Bills & Subscriptions': { icon: <FileText size={14} />, bg: 'bg-orange-100', text: 'text-orange-700' },
};
const getCat = (c?: string) =>
    CAT[c ?? ''] ?? { icon: <Tag size={14} />, bg: 'bg-gray-100', text: 'text-gray-600' };

// ── Formatter ──────────────────────────────────────────────────────────────
const fmt = (v: number) =>
    `$${Math.abs(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (raw?: string) => {
    if (!raw) return '—';
    try {
        const d = new Date(raw);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
};

// ── Status badge renderer ──────────────────────────────────────────────────
function renderStatus(expense: any, userId: string) {
    const txStatus = expense?.transaction_status ?? 'NONE';
    const balance = Number(expense?.user_balance ?? 0);

    // ISSUED — borxhi është shlyer ose nuk ka asnjë detyrim
    if (txStatus === 'CONFIRMED' || (balance === 0 && txStatus === 'NONE')) {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/5 border border-secondary/10 text-[10px] font-black text-secondary/40 uppercase tracking-wider">
                ISSUED
            </span>
        );
    }

    // PENDING — ti ke dërguar pagesë, pret konfirmim prej tyre
    if (txStatus === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-[11px] font-black text-amber-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {fmt(Math.abs(balance))} Pending
            </span>
        );
    }

    // WAITING_CONFIRMATION — dikush të ka dërguar ty pagesë, pret konfirmimin tënd
    if (txStatus === 'WAITING_CONFIRMATION') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-[11px] font-black text-blue-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                +{fmt(balance)} Waiting
            </span>
        );
    }

    // NONE — aktiv, pa asnjë settlement
    if (balance < -0.005) {
        return (
            <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">
                -{fmt(Math.abs(balance))} To Pay
            </span>
        );
    }

    if (balance > 0.005) {
        return (
            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">
                +{fmt(balance)} To Be Paid
            </span>
        );
    }
}

// ── Component ──────────────────────────────────────────────────────────────
const ExpenseHistoryCard: React.FC<Props> = ({
    filteredExpenses,
    searchQuery, setSearchQuery,
    selectedGroup, setSelectedGroup,
    uniqueGroups,
    isFilterOpen, setIsFilterOpen,
    hasMore, visibleCount,
    onSeeMore, onSeeLess,
    historyRef, user,
}) => {
    const items = Array.isArray(filteredExpenses) ? filteredExpenses : [];
    const visible = items.slice(0, visibleCount);
    const uid = String(user?.id ?? '').toLowerCase();

    console.log("Component Data (ExpenseHistoryCard):", { filteredExpenses, visible });

    return (
        <div ref={historyRef} className="bg-white rounded-2xl shadow-sm border border-secondary/10 flex flex-col hover:shadow-md transition-shadow mt-2">

            {/* ── Header ── */}
            <div className="px-6 py-5 border-b border-secondary/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/70 shrink-0">
                    Unified Feed ({filteredExpenses?.length || 0})
                </h2>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] sm:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40" />
                        <input
                            type="text"
                            placeholder="Search description..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-secondary/15 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
                        />
                    </div>

                    {/* Group filter dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-secondary/15 rounded-xl text-sm font-semibold text-primary hover:bg-gray-100 transition-colors min-w-[140px] justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-secondary/50" />
                                <span className="truncate max-w-[90px]">{selectedGroup.name}</span>
                            </div>
                            <ChevronDown size={13} className={`text-secondary transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-secondary/10 z-50 py-1 max-h-52 overflow-y-auto">
                                {uniqueGroups.map(grp => (
                                    <button
                                        key={grp.id ?? 'all'}
                                        type="button"
                                        onClick={() => { setSelectedGroup(grp); setIsFilterOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold ${selectedGroup.id === grp.id
                                            ? 'bg-primary/5 text-primary'
                                            : 'hover:bg-gray-50 text-secondary'
                                            }`}
                                    >
                                        <span className="truncate">{grp.name}</span>
                                        {selectedGroup.id === grp.id && <Check size={13} className="text-accent" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="flex-1 overflow-x-auto min-h-[360px]">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-secondary/30 gap-3 min-h-[300px]">
                        <Activity size={32} />
                        <p className="text-[10px] font-black uppercase tracking-wider">No expenses found</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse table-fixed">
                        <colgroup>
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '35%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '30%' }} />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-secondary/10 bg-secondary/[0.02]">
                                {['Date', 'Expense & Group', 'Payer', 'Status'].map(h => (
                                    <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/40 text-left">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/5">
                            {visible?.map(expense => {
                                if (!expense) return null;

                                const isPayer = String(expense.payer_id ?? '').toLowerCase() === uid;
                                const participants: any[] = expense.participants ?? [];
                                const myPart = participants.find(
                                    (p: any) => String(p.user_id ?? '').toLowerCase() === uid
                                );
                                const catStyle = getCat(expense.category);

                                return (
                                    <tr key={expense.id} className="hover:bg-secondary/[0.015] transition-colors h-[66px]">
                                        {/* Date */}
                                        <td className="px-5 py-2 align-middle">
                                            <span className="text-sm font-bold text-primary/80 whitespace-nowrap">
                                                {fmtDate(expense.created_date ?? expense.expense_date)}
                                            </span>
                                        </td>

                                        {/* Description + Group */}
                                        <td className="px-5 py-2 align-middle overflow-hidden">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${catStyle.bg} ${catStyle.text}`}>
                                                    {catStyle.icon}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-primary truncate" title={expense.description}>
                                                        {expense.description ?? 'No description'}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-secondary/40 truncate">
                                                        {expense.group_name ?? 'Personal'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Payer */}
                                        <td className="px-5 py-2 align-middle overflow-hidden">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 text-[9px] font-black shrink-0">
                                                    {isPayer ? 'Y' : (expense.payer_name ?? 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[11px] font-bold text-secondary/60 truncate">
                                                    {isPayer ? 'You' : (expense.payer_name ?? 'Member')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status — derived from backend transaction_status */}
                                        <td className="px-5 py-2 align-middle overflow-hidden">
                                            <div className="flex items-center">
                                                {renderStatus(expense, uid)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* See More / Less */}
                {items.length > 5 && (
                    <div className="p-6 flex justify-center bg-gray-50/30 border-t border-secondary/5">
                        {visibleCount < items.length || hasMore ? (
                            <button
                                onClick={onSeeMore}
                                className="px-8 py-2.5 bg-white border border-secondary/15 text-xs font-black uppercase tracking-widest text-primary/70 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
                            >
                                See More <ChevronDown size={14} strokeWidth={3} />
                            </button>
                        ) : (
                            <button
                                onClick={onSeeLess}
                                className="px-8 py-2.5 bg-white border border-secondary/15 text-xs font-black uppercase tracking-widest text-primary/70 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
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