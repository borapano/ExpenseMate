import React, { useState } from 'react';
import {
    Search, Filter, ChevronDown, Check, Activity, X, Users, ChevronRight
} from 'lucide-react';
// @ts-ignore
import { getTableCatStyle } from '../../utils/categoryMap';

interface Props {
    filteredExpenses: any[];
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    selectedGroup: { id: string | null; name: string };
    setSelectedGroup: (v: { id: string | null; name: string }) => void;
    uniqueGroups: { id: string | null; name: string }[];
    isFilterOpen: boolean;
    setIsFilterOpen: (v: boolean) => void;
    user: any;
}

// ── Formatters ─────────────────────────────────────────────────────────────
const fmt = (v: number) =>
    `€${Math.abs(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (raw?: string) => {
    if (!raw) return '—';
    try {
        const d = new Date(raw);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
};

// ── Status badge renderer ──────────────────────────────────────────────────
function renderStatus(expense: any) {
    const txStatus = expense?.transaction_status ?? 'NONE';
    const balance = Number(expense?.user_balance ?? 0);

    if (txStatus === 'CONFIRMED' || (balance === 0 && txStatus === 'NONE')) {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/5 border border-secondary/10 text-[10px] font-black text-secondary/40 uppercase tracking-wider">
                SETTLED
            </span>
        );
    }

    // Debtor sent payment — awaiting confirmation
    if (txStatus === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-[11px] font-black text-amber-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                -{fmt(balance)} Pending
            </span>
        );
    }

    // Someone sent payment to me — awaiting my confirmation
    if (txStatus === 'WAITING_CONFIRMATION') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-[11px] font-black text-blue-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                +{fmt(balance)} Waiting
            </span>
        );
    }

    // Mixed: some to be paid + some waiting
    if (txStatus === 'MIXED') {
        const toBeP = expense?.to_be_paid ?? balance;
        const waiting = expense?.waiting_amount ?? 0;
        return (
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                    +{fmt(toBeP)} To Be Paid
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                    +{fmt(waiting)} Waiting
                </span>
            </div>
        );
    }

    if (balance < -0.005) {
        return (
            <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">
                -{fmt(balance)} To Pay
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

// ── Participant status badge (inside modal) ────────────────────────────────
function participantStatusBadge(p: any, expenseIsPayer: boolean) {
    // Payer-only entry (no share)
    if (p.status === 'PAYER') {
        return <span className="text-[9px] font-black text-primary/40 uppercase tracking-wider px-2 py-0.5 bg-primary/5 rounded">Payer</span>;
    }
    // No relationship with current user → no badge
    if (p.status === null || p.status === undefined) {
        return null;
    }
    // Current user is payer → their own share is always settled (they paid)
    if (expenseIsPayer && p.is_me) {
        return <span className="text-[9px] font-black text-secondary/40 uppercase tracking-wider px-2 py-0.5 bg-secondary/5 rounded">Settled</span>;
    }
    if (p.is_settled || p.status === 'CONFIRMED') {
        return <span className="text-[9px] font-black text-secondary/40 uppercase tracking-wider px-2 py-0.5 bg-secondary/5 rounded">Settled</span>;
    }
    if (p.status === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-wider px-2 py-0.5 bg-amber-50 rounded border border-amber-100">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" /> Pending
            </span>
        );
    }
    return <span className="text-[9px] font-black text-red-500 uppercase tracking-wider px-2 py-0.5 bg-red-50 rounded border border-red-100">To Pay</span>;
}

// ── Participants Modal ─────────────────────────────────────────────────────
const ParticipantsModal: React.FC<{ expense: any; onClose: () => void }> = ({ expense, onClose }) => {
    const rawParticipants: any[] = expense?.participants ?? [];
    const isPayer: boolean = expense?.is_payer ?? false;

    // Sort: "You" first, then alphabetically
    const participants = [...rawParticipants].sort((a, b) => {
        if (a.is_me) return -1;
        if (b.is_me) return 1;
        return (a.user_name ?? '').localeCompare(b.user_name ?? '');
    });

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-secondary/10">
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                            Participants
                        </h3>
                        <p className="text-[10px] font-semibold text-secondary/40 truncate mt-0.5">
                            {expense?.description ?? 'Expense'} · {expense?.group_name ?? ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-secondary/40 hover:text-primary rounded-lg transition-colors shrink-0">
                        <X size={16} />
                    </button>
                </div>

                {/* List */}
                <div className="px-6 py-4 flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {participants.length === 0 ? (
                        <p className="text-sm text-secondary/40 font-semibold text-center py-6">No participants found.</p>
                    ) : participants.map((p: any) => (
                        <div key={p.user_id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 text-[9px] font-black shrink-0">
                                    {p.is_me ? 'Y' : (p.user_name ?? 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-primary truncate">
                                        {p.is_me ? 'You' : (p.user_name ?? 'Unknown')}
                                    </span>
                                    {p.amount > 0 && (
                                        <span className="text-[10px] font-semibold text-secondary/40">
                                            €{Number(p.amount).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {participantStatusBadge(p, isPayer)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────
const ExpenseHistoryCard: React.FC<Props> = ({
    filteredExpenses,
    searchQuery, setSearchQuery,
    selectedGroup, setSelectedGroup,
    uniqueGroups,
    isFilterOpen, setIsFilterOpen,
    user,
}) => {
    const [modalExpense, setModalExpense] = useState<any | null>(null);

    const items = Array.isArray(filteredExpenses) ? filteredExpenses : [];
    const uid = String(user?.id ?? '').toLowerCase();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 flex flex-col hover:shadow-md transition-shadow mt-2">

            {/* ── Header ── */}
            <div className="px-6 py-5 border-b border-secondary/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/70 shrink-0">
                    Transaction History ({filteredExpenses?.length || 0})
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

                    {/* Group filter */}
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
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold ${selectedGroup.id === grp.id ? 'bg-primary/5 text-primary' : 'hover:bg-gray-50 text-secondary'
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
            <div className="overflow-x-auto overflow-y-auto h-[710px]
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-secondary/20
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb:hover]:bg-secondary/30">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-secondary/30 gap-3 min-h-[300px]">
                        <Activity size={32} />
                        <p className="text-[10px] font-black uppercase tracking-wider">No expenses found</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse table-fixed">
                        <colgroup>
                            <col style={{ width: '16.66%' }} />
                            <col style={{ width: '16.66%' }} />
                            <col style={{ width: '16.66%' }} />
                            <col style={{ width: '16.66%' }} />
                            <col style={{ width: '16.66%' }} />
                            <col style={{ width: '16.70%' }} />
                        </colgroup>
                        <thead className="sticky top-0 z-10 bg-white">
                            <tr className="border-b border-secondary/10 bg-secondary/[0.02]">
                                {['Date', 'Expense & Group', 'Payer', 'Participants', 'My Share', 'Status'].map(h => (
                                    <th key={h} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/40 text-left">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/5">
                            {items.map(expense => {
                                if (!expense) return null;

                                const isPayer = String(expense.payer_id ?? '').toLowerCase() === uid;
                                const catStyle = getTableCatStyle(expense.category, 14);
                                const preview: string[] = expense.participants_preview ?? [];
                                const hasParticipants = (expense.participants ?? []).length > 0;

                                return (
                                    <tr key={expense.id} className="hover:bg-secondary/[0.015] transition-colors h-[66px]">

                                        {/* Date */}
                                        <td className="px-4 py-2 align-middle">
                                            <span className="text-sm font-bold text-primary/80 whitespace-nowrap">
                                                {fmtDate(expense.created_date ?? expense.expense_date)}
                                            </span>
                                        </td>

                                        {/* Description + Group */}
                                        <td className="px-4 py-2 align-middle overflow-hidden">
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
                                        <td className="px-4 py-2 align-middle overflow-hidden">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 text-[9px] font-black shrink-0">
                                                    {isPayer ? 'Y' : (expense.payer_name ?? 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[11px] font-bold text-secondary/60 truncate">
                                                    {isPayer ? 'You' : (expense.payer_name ?? 'Member')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Participants */}
                                        <td className="px-4 py-2 align-middle overflow-hidden">
                                            {hasParticipants ? (() => {
                                                const allP: any[] = expense.participants ?? [];
                                                const nonPayers = allP.filter((p: any) => p.status !== 'PAYER');
                                                const count = nonPayers.length;
                                                const avatarSlice = nonPayers.slice(0, 3);
                                                return (
                                                    <button
                                                        onClick={() => setModalExpense(expense)}
                                                        className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-secondary/10 bg-secondary/[0.03] hover:bg-secondary/8 hover:border-secondary/20 transition-all group"
                                                        title="View all participants"
                                                    >
                                                        {/* Mini avatar stack */}
                                                        <div className="flex -space-x-1.5">
                                                            {avatarSlice.map((p: any, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-5 h-5 rounded-full border border-white bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary/50 shrink-0"
                                                                    title={p.is_me ? 'You' : p.user_name}
                                                                >
                                                                    {p.is_me ? 'Y' : (p.user_name ?? 'U').charAt(0).toUpperCase()}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {/* Count */}
                                                        <span className="text-[10px] font-bold text-secondary/50 group-hover:text-secondary/70 transition-colors whitespace-nowrap">
                                                            {count} {count === 1 ? 'person' : 'people'}
                                                        </span>
                                                        {/* Chevron */}
                                                        <ChevronRight size={10} className="text-secondary/30 group-hover:text-secondary/50 transition-colors shrink-0" />
                                                    </button>
                                                );
                                            })() : (
                                                <span className="text-[11px] text-secondary/30">—</span>
                                            )}
                                        </td>

                                        {/* My Share */}
                                        <td className="px-4 py-2 align-middle overflow-hidden">
                                            {(expense.my_share ?? 0) > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-primary/70">
                                                        €{Number(expense.my_share).toFixed(2)}
                                                    </span>
                                                    <span className="text-[9px] font-semibold text-secondary/35">
                                                        of €{Number(expense.total_amount ?? expense.amount ?? 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-secondary/30">—</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-2 align-middle overflow-hidden">
                                            <div className="flex items-center">
                                                {renderStatus(expense)}
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

            </div>

            {/* ── Participants Modal ── */}
            {modalExpense && (
                <ParticipantsModal
                    expense={modalExpense}
                    onClose={() => setModalExpense(null)}
                />
            )}
        </div>
    );
};

export default ExpenseHistoryCard;