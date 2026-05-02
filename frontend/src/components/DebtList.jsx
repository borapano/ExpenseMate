import React, { useState, useEffect } from 'react';
import api from '../api';
import SettleUpModal from './SettleUpModal';

/**
 * DebtList — used inside the Group detail pages.
 * Receives `debts` from the parent (group endpoint) and a `groupId`.
 *
 * Each debt object shape expected:
 *   { user_id, user_name, amount, effective_amount?, is_pending }
 */
const DebtList = ({ debts, groupId, onRefresh, onRefreshGlobal }) => {
    const [selectedDebt, setSelectedDebt] = useState(null);
    // Optimistic UI: track IDs we've just settled so the button flips to
    // "Pending" instantly without waiting for a server round-trip.
    const [localPendingIds, setLocalPendingIds] = useState(new Set());

    // When fresh server data arrives, clear the optimistic state —
    // the real is_pending flag from the backend takes over.
    useEffect(() => {
        setLocalPendingIds(new Set());
    }, [debts]);

    // Stable key: user_id is always present and unique within a group.
    const getDebtKey = (debt) => String(debt.user_id);

    // A debt is "pending" if the backend says so OR we've just settled it.
    const isDebtPending = (debt) =>
        !!debt.is_pending || localPendingIds.has(getDebtKey(debt));

    const handleSettleClick = (debt) => {
        if (isDebtPending(debt)) return;
        setSelectedDebt(debt);
    };

    const confirmSettlement = async () => {
        if (!selectedDebt) return;

        const debtKey = getDebtKey(selectedDebt);

        // Optimistic update — flip the button to "Pending" immediately
        setLocalPendingIds(prev => new Set(prev).add(debtKey));
        setSelectedDebt(null);

        try {
            // Use effective_amount (remaining after any pending) if available.
            const payAmount = selectedDebt.effective_amount ?? selectedDebt.amount;

            await api.post('/settlements/', {
                // Explicit String() cast guards against UUID-object vs string mismatch.
                amount: payAmount,
                group_id: String(groupId),
                receiver_id: String(selectedDebt.user_id),
            });

            // Refresh local group data first
            if (onRefresh) await onRefresh();
            // Then trigger global context refresh so summary cards update
            if (onRefreshGlobal) await onRefreshGlobal();
        } catch (err) {
            // Roll back optimistic update on failure
            setLocalPendingIds(prev => {
                const updated = new Set(prev);
                updated.delete(debtKey);
                return updated;
            });
            console.error('[DebtList] Settlement failed:', err?.response?.data?.detail || err.message);
        }
    };

    if (!debts || debts.length === 0) {
        return (
            <div className="mt-6 p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 text-sm italic">No active debts.</p>
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest px-1">
                Debts to Settle
            </h4>

            <ul className="space-y-3">
                {debts.map((debt) => {
                    const isPending = isDebtPending(debt);
                    const key = getDebtKey(debt);
                    // Show effective_amount (what's left after pending) or gross amount
                    const displayAmount = Number(debt.effective_amount ?? debt.amount ?? 0);

                    return (
                        <li
                            key={key}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                isPending
                                    ? 'bg-amber-50 border-amber-200 opacity-90'
                                    : 'bg-white border-gray-100 shadow-sm'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    isPending
                                        ? 'bg-amber-100 text-amber-600'
                                        : 'bg-red-50 text-red-500'
                                }`}>
                                    {debt.user_name?.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        {debt.user_name}
                                    </p>
                                    <p className={`text-xs font-semibold mt-0.5 ${
                                        isPending ? 'text-amber-600' : 'text-red-500'
                                    }`}>
                                        {isPending
                                            ? '⏳ Awaiting confirmation...'
                                            : `-€${displayAmount.toFixed(2)}`}
                                    </p>
                                </div>
                            </div>

                            <div className="min-w-[100px] flex justify-end">
                                {isPending ? (
                                    <div className="px-3 py-2 w-28 text-center rounded-xl text-[10px] font-black uppercase tracking-tight
                                                   bg-amber-100 text-amber-600 border border-amber-200 cursor-not-allowed select-none">
                                        Pending...
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSettleClick(debt)}
                                        className="px-4 py-2 w-28 rounded-xl text-xs font-black bg-slate-900 text-white
                                                   hover:bg-red-600 shadow-sm transition-all active:scale-95"
                                    >
                                        Pay
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {selectedDebt && (
                <SettleUpModal
                    isOpen={!!selectedDebt}
                    onClose={() => setSelectedDebt(null)}
                    onConfirm={confirmSettlement}
                    receiverName={selectedDebt.user_name}
                    amount={selectedDebt.effective_amount ?? selectedDebt.amount}
                />
            )}
        </div>
    );
};

export default DebtList;