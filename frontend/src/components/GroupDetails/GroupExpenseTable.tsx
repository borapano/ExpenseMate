import React, { useState, useMemo } from 'react';
import {
    Plus, Receipt, Users,
    Edit2, Trash2, X, AlertTriangle,
} from 'lucide-react';
import api from '../../api';
import ExpenseForm from '../ExpenseForm';
// @ts-ignore
import { getTableCatStyle } from '../../utils/categoryMap';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtAmt = (v: number) =>
    `€${Math.abs(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (raw?: string) => {
    if (!raw) return '—';
    try {
        const d = new Date(raw);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
};

// ── Status badge (identical logic to ExpenseHistoryCard) ─────────────────────
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
    if (txStatus === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-[11px] font-black text-amber-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                -{fmtAmt(balance)} Pending
            </span>
        );
    }
    if (txStatus === 'WAITING_CONFIRMATION') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-[11px] font-black text-blue-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                +{fmtAmt(balance)} Waiting
            </span>
        );
    }
    if (txStatus === 'MIXED') {
        const toBeP = expense?.to_be_paid ?? balance;
        const waiting = expense?.waiting_amount ?? 0;
        return (
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                    +{fmtAmt(toBeP)} To Be Paid
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                    +{fmtAmt(waiting)} Waiting
                </span>
            </div>
        );
    }
    if (balance < -0.005) {
        return (
            <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">
                -{fmtAmt(balance)} To Pay
            </span>
        );
    }
    if (balance > 0.005) {
        return (
            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">
                +{fmtAmt(balance)} To Be Paid
            </span>
        );
    }
    return null;
}

// ── Participant status badge (identical logic to ExpenseHistoryCard) ───────────
function participantStatusBadge(p: any, expenseIsPayer: boolean) {
    if (p.status === 'PAYER') {
        return <span className="text-[9px] font-black text-primary/40 uppercase tracking-wider px-2 py-0.5 bg-primary/5 rounded">Payer</span>;
    }
    if (p.status === null || p.status === undefined) return null;
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

// ── Participants Modal ────────────────────────────────────────────────────────
const ParticipantsModal: React.FC<{
    expense: any; onClose: () => void;
}> = ({ expense, onClose }) => {
    const rawParticipants: any[] = expense?.participants ?? [];
    const isPayer: boolean = expense?.is_payer ?? false;

    const participants = [...rawParticipants].sort((a, b) => {
        if (a.is_me) return -1;
        if (b.is_me) return 1;
        return (a.user_name ?? '').localeCompare(b.user_name ?? '');
    });

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 flex items-center justify-between border-b border-secondary/10">
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-primary/70">Participants</h3>
                        <p className="text-[10px] font-semibold text-secondary/40 mt-0.5 truncate">{expense?.description}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-secondary/40 hover:text-primary rounded-lg transition-colors shrink-0">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-6 py-4 flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {participants.length === 0 ? (
                        <p className="text-sm text-secondary/40 font-semibold text-center py-6">No participants found.</p>
                    ) : participants.map((p: any) => {
                        const name = p.is_me ? 'You' : (p.user_name || 'Member');
                        return (
                            <div key={p.user_id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 text-[9px] font-black shrink-0">
                                        {p.is_me ? 'Y' : name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-primary truncate">{name}</p>
                                        {(p.share_amount || p.amount) > 0 && (
                                            <p className="text-[10px] text-secondary/40 font-semibold">€{Number(p.share_amount || p.amount || 0).toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                                {participantStatusBadge(p, isPayer)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props {
    group: any;
    currentUser: any;
    onRefresh: () => void;
    onRefreshGlobal: () => void;
    onToast: (msg: string, type?: 'success' | 'error') => void;
}

const GroupExpenseTable: React.FC<Props> = ({ group, currentUser, onRefresh, onRefreshGlobal, onToast }) => {
    const expenses: any[] = group.expenses || [];
    const [showAdd, setShowAdd] = useState(false);
    const [editExpense, setEditExpense] = useState<any>(null);
    const [modalExpense, setModalExpense] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // When editing an expense that has pending settlements, show a warning first
    const [editWarning, setEditWarning] = useState<any>(null);

    const uid = String(currentUser?.id ?? '');

    // Build member name map for participant display
    const memberMap = useMemo<Record<string, string>>(() => {
        const m: Record<string, string> = {};
        (group.members || []).forEach((mem: any) => { m[String(mem.user_id)] = mem.user_name; });
        return m;
    }, [group.members]);

    // An expense can be edited/deleted by the payer only if no settlement is CONFIRMED
    const canModify = (expense: any): boolean => {
        if (String(expense.payer_id) !== uid) return false;
        const participants: any[] = expense.participants || [];
        return !participants.some(p => p.is_settled === true);
    };

    // Does this expense have PENDING (unconfirmed) settlements?
    const hasPendingSettlements = (expense: any): boolean => {
        const status = expense.transaction_status;
        if (status === 'PENDING' || status === 'WAITING_CONFIRMATION') return true;
        // fallback: check participants
        return false;
    };

    const handleEditClick = (expense: any) => {
        if (hasPendingSettlements(expense)) {
            setEditWarning(expense);
        } else {
            setEditExpense(expense);
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        setDeletingId(expenseId);
        try {
            await api.delete(`/expenses/${expenseId}`);
            onToast('Expense deleted.');
            setDeleteTarget(null);
            await onRefresh();
            onRefreshGlobal();
        } catch (e: any) {
            onToast(e?.response?.data?.detail || 'Failed to delete.', 'error');
        } finally { setDeletingId(null); }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-secondary/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shrink-0">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                    Expenses ({expenses.length})
                </h2>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all hover:scale-[1.02] active:scale-95 shrink-0"
                >
                    <Plus size={14} /> Add Expense
                </button>
            </div>

            {/* Table — inner scroll, sticky thead */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-secondary/20
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb:hover]:bg-secondary/30">
                {expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[260px] text-center gap-3">
                        <div className="w-14 h-14 bg-[#F7F4F0] rounded-2xl flex items-center justify-center border border-secondary/10">
                            <Receipt size={24} className="text-secondary/30" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-secondary/30">No expenses yet</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <colgroup>
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '5%' }} />
                        </colgroup>
                        <thead className="sticky top-0 z-10 bg-white">
                            <tr className="border-b border-secondary/10 bg-secondary/[0.02]">
                                {['Date', 'Expense', 'Paid by', 'Participants', 'My Share', 'Status', ''].map((h, i) => (
                                    <th key={i} className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-secondary/40 text-left whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/5">
                            {expenses.map((expense: any) => {
                                if (!expense) return null;
                                const isPayer = String(expense.payer_id) === uid;
                                const cat = getTableCatStyle(expense.category);
                                const myParticipant = (expense.participants || []).find(
                                    (p: any) => String(p.user_id) === uid
                                );
                                const myShare = Number(myParticipant?.share_amount || 0);
                                const participants: any[] = expense.participants || [];
                                const canEdit = canModify(expense);
                                const confirmingDelete = deleteTarget === String(expense.id);
                                const isDeleting = deletingId === String(expense.id);

                                // Build preview names for participants cell
                                const otherParticipants = participants.filter(p => String(p.user_id) !== uid);
                                const previewNames = [
                                    ...(myParticipant ? ['You'] : []),
                                    ...otherParticipants.slice(0, 1).map(p => memberMap[String(p.user_id)] || p.user_name || 'Member'),
                                ];
                                const extraCount = participants.length - previewNames.length;

                                return (
                                    <tr key={expense.id} className="hover:bg-secondary/[0.015] transition-colors h-[62px]">

                                        {/* Date */}
                                        <td className="px-4 py-2 align-middle">
                                            <span className="text-xs font-bold text-primary/70 whitespace-nowrap">
                                                {fmtDate(expense.expense_date || expense.date)}
                                            </span>
                                        </td>

                                        {/* Expense */}
                                        <td className="px-4 py-2 align-middle overflow-hidden">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cat.bg} ${cat.text}`}>
                                                    {cat.icon}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-primary truncate" title={expense.description}>
                                                        {expense.description}
                                                    </span>
                                                    {expense.category && (
                                                        <span className="text-[10px] font-semibold text-secondary/40 truncate">
                                                            {expense.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Paid by */}
                                        <td className="px-4 py-2 align-middle overflow-hidden">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 text-[9px] font-black shrink-0">
                                                    {isPayer ? 'Y' : (expense.payer_name || 'M').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[11px] font-bold text-secondary/70 truncate">
                                                    {isPayer ? 'You' : (expense.payer_name || 'Member')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Participants */}
                                        <td className="px-4 py-2 align-middle overflow-hidden">
                                            {participants.length > 0 ? (
                                                <button
                                                    onClick={() => setModalExpense(expense)}
                                                    className="flex items-center gap-1.5 group text-left"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                                        <Users size={10} className="text-primary/40" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-bold text-secondary/60 truncate group-hover:text-primary/70 transition-colors">
                                                            {previewNames.join(', ')}
                                                        </span>
                                                        {extraCount > 0 && (
                                                            <span className="text-[9px] font-semibold text-secondary/30">
                                                                +{extraCount} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-secondary/30">—</span>
                                            )}
                                        </td>

                                        {/* My Share + Total */}
                                        <td className="px-4 py-2 align-middle overflow-hidden">
                                            {myShare > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-primary/80 tabular-nums">
                                                        €{myShare.toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-secondary/35 tabular-nums">
                                                        of €{Number(expense.amount).toFixed(2)}
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

                                        {/* Actions */}
                                        <td className="px-4 py-2 align-middle">
                                            {canEdit && !confirmingDelete && (
                                                <div className="flex items-center gap-0.5">
                                                    <button
                                                        onClick={() => handleEditClick(expense)}
                                                        className="p-1.5 text-secondary/30 hover:text-primary hover:bg-secondary/10 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(String(expense.id))}
                                                        className="p-1.5 text-secondary/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            {confirmingDelete && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDeleteExpense(String(expense.id))}
                                                        disabled={isDeleting}
                                                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase rounded-lg disabled:opacity-60 transition-all"
                                                    >
                                                        {isDeleting ? '...' : 'Del'}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(null)}
                                                        className="p-1 text-secondary/40 hover:text-primary rounded-lg transition-all"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

            </div>

            {/* ── Add Expense Modal ── */}
            {showAdd && (
                <ExpenseForm
                    group={group}
                    expenseToEdit={null}
                    onClose={() => setShowAdd(false)}
                    onSuccess={() => {
                        setShowAdd(false);
                        onToast('Expense added!');
                        onRefresh();
                        onRefreshGlobal();
                    }}
                />
            )}

            {/* ── Edit Expense Modal ── */}
            {editExpense && (
                <ExpenseForm
                    group={group}
                    expenseToEdit={editExpense}
                    onClose={() => setEditExpense(null)}
                    onSuccess={() => {
                        setEditExpense(null);
                        onToast('Expense updated!');
                        onRefresh();
                        onRefreshGlobal();
                    }}
                />
            )}

            {/* ── Edit Warning (has pending settlements) ── */}
            {editWarning && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <AlertTriangle size={18} className="text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-black text-primary text-base">Pending Payments</h3>
                                <p className="text-xs text-secondary/60 font-semibold mt-0.5">
                                    Editing will automatically decline all pending payments linked to this expense.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => { setEditExpense(editWarning); setEditWarning(null); }}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all"
                            >
                                Continue & Edit
                            </button>
                            <button
                                onClick={() => setEditWarning(null)}
                                className="flex-1 border border-secondary/20 text-secondary py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

export default GroupExpenseTable;
