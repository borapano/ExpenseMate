import React from 'react';
import { Receipt, Calendar, User, Edit3, Trash2 } from 'lucide-react';
import { getCategoryDetails } from '../utils/categoryMap';
import { calculateExpenseStatus } from '../utils/expenseStatus';

/**
 * ExpenseList — renders the expense rows inside a Group detail page.
 *
 * Status labels are derived from calculateExpenseStatus (same source of truth
 * as ExpenseHistoryCard on the Expenses page) so the labels are always:
 *   "ISSUED"             — fully settled
 *   "+€X (To Be Paid)"  — others owe current user
 *   "-€X (To Pay)"      — current user owes
 *   "In Verification"   — payment pending confirmation
 *   "No Stake"          — current user is not a participant
 */
const ExpenseList = ({ expenses, currentUserId, onEdit, onDelete, isLoading }) => {

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 animate-pulse bg-slate-50 rounded-[2rem]">
                <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
                <div className="w-32 h-4 bg-slate-200 rounded mb-2"></div>
                <div className="w-24 h-3 bg-slate-200 rounded"></div>
            </div>
        );
    }

    // Sort newest-first; fall back to expense_date if created_date is absent
    const sortedExpenses = Array.isArray(expenses)
        ? [...expenses].sort((a, b) =>
            new Date(b?.created_date || b?.expense_date || 0) -
            new Date(a?.created_date || a?.expense_date || 0)
          )
        : [];

    if (sortedExpenses.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <Receipt className="text-slate-300 mx-auto mb-4" size={32} />
                <p className="text-slate-500 font-bold">No expenses yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedExpenses.map((expense) => {
                if (!expense) return null;

                // Normalize IDs to strings for safe comparison
                const uid = String(currentUserId || '').toLowerCase();
                const isPayer = String(expense?.payer_id || '').toLowerCase() === uid;
                const participants = expense?.participants || [];
                const totalAmount = Number(expense?.amount ?? 0);

                // ── Status via shared utility (same logic as ExpenseHistoryCard) ──
                const { label, colorClass, status } = calculateExpenseStatus(
                    expense,
                    currentUserId,
                    [], // pendingRequests not available in group context; backend drives status
                    []
                );

                // Determine if user has any stake in this expense
                const myParticipation = participants.find(p =>
                    String(p?.user_id || '').toLowerCase() === uid
                );
                const hasStake = isPayer || !!myParticipation;

                // Left-bar colour: green = payer, red = debtor, gray = no stake
                const barColor = isPayer
                    ? 'bg-emerald-400'
                    : myParticipation
                        ? 'bg-rose-400'
                        : 'bg-slate-200';

                return (
                    <div
                        key={expense?.id || Math.random()}
                        className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between relative z-10">

                            {/* LEFT: Icon + description */}
                            <div className="flex items-center gap-4">
                                {(() => {
                                    const { icon, colorClass: iconColor } = getCategoryDetails(expense?.category);
                                    return (
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                            {icon}
                                        </div>
                                    );
                                })()}

                                <div>
                                    <h4 className="font-black text-slate-800 text-sm mb-1">
                                        {expense?.description || 'No description'}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                            <User size={12} />
                                            {isPayer ? 'You paid' : (expense?.payer_name || 'Member')}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                            <Calendar size={12} />
                                            {expense?.expense_date
                                                ? new Date(expense.expense_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                                : 'Unknown date'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Amount + status */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-sm font-black text-slate-900">
                                        €{totalAmount.toFixed(2)}
                                    </div>
                                    {hasStake ? (
                                        <div className={`text-[10px] font-black mt-0.5 uppercase ${colorClass}`}>
                                            {label}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] font-black mt-0.5 uppercase text-slate-300">
                                            No Stake
                                        </div>
                                    )}
                                </div>

                                {/* Edit/Delete — payer only */}
                                <div className="flex items-center gap-1 border-l border-slate-100 pl-3 min-w-[60px] justify-end">
                                    {isPayer && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit && onEdit(expense); }}
                                                className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"
                                                title="Edit expense"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(expense?.id); }}
                                                className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                                                title="Delete expense"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Participants list */}
                        {participants.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-50 relative z-10 flex flex-wrap gap-2">
                                {participants.map((p, idx) => (
                                    <div
                                        key={p?.user_id || idx}
                                        className="text-[10px] font-medium bg-slate-50 px-2 py-1 rounded text-slate-500 border border-slate-100 flex items-center gap-1"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        {p?.user_name || 'Unknown'}{' '}
                                        <span className="font-bold text-slate-700">
                                            €{Number(p?.share_amount ?? 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Status colour bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
                    </div>
                );
            })}
        </div>
    );
};

export default ExpenseList;