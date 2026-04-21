import React, { useState, useEffect } from 'react';
import api from '../api';
import SettleUpModal from './SettleUpModal';

const DebtList = ({ debts, groupId, onRefresh }) => {
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [localPendingIds, setLocalPendingIds] = useState(new Set());

    // Reset pending kur vjen data e re nga serveri
    useEffect(() => {
        setLocalPendingIds(new Set());
    }, [debts]);

    // Helper për ID të sigurt (nëse backend ndryshon strukturë)
    const getDebtKey = (debt) => {
        return String(debt.id ?? debt.user_id);
    };

    // Normalizim i is_pending
    const isDebtPending = (debt) => {
        return (
            debt.is_pending === true ||
            debt.is_pending === "true" ||
            debt.is_pending === 1 ||
            localPendingIds.has(getDebtKey(debt))
        );
    };

    const handleSettleClick = (debt) => {
        if (isDebtPending(debt)) return;
        setSelectedDebt(debt);
    };

    const confirmSettlement = async () => {
        if (!selectedDebt) return;

        const debtKey = getDebtKey(selectedDebt);

        try {
            // Blloko menjëherë në UI
            setLocalPendingIds(prev => new Set(prev).add(debtKey));

            await api.post('/settlements/', {
                amount: selectedDebt.amount,
                group_id: groupId,
                receiver_id: selectedDebt.user_id
            });

            setSelectedDebt(null);

            // Rifresko direkt (pa delay artificial)
            if (onRefresh) await onRefresh();

        } catch (err) {
            // Hiq nga pending në rast errori
            setLocalPendingIds(prev => {
                const updated = new Set(prev);
                updated.delete(debtKey);
                return updated;
            });

            console.error("Gabim gjatë settlement:", err);
        }
    };

    return (
        <div className="mt-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest px-1">
                Borxhet e Mia
            </h4>

            {debts && debts.length > 0 ? (
                <ul className="space-y-3">
                    {debts.map((debt) => {
                        const isPending = isDebtPending(debt);

                        return (
                            <li
                                key={getDebtKey(debt)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isPending
                                        ? 'bg-amber-50 border-amber-200 opacity-90'
                                        : 'bg-white border-gray-100 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isPending
                                            ? 'bg-amber-100 text-amber-600'
                                            : 'bg-red-50 text-red-500'
                                        }`}>
                                        {debt.user_name?.charAt(0).toUpperCase()}
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {debt.user_name}
                                        </p>

                                        <p className={`text-xs font-semibold mt-0.5 ${isPending ? 'text-amber-600' : 'text-red-500'
                                            }`}>
                                            {isPending
                                                ? '⏳ Verifikimi në pritje...'
                                                : `Borxh: ${debt.amount}€`}
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
                                            PAGUAJ
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm italic">
                        Nuk ke asnjë borxh aktiv.
                    </p>
                </div>
            )}

            {selectedDebt && (
                <SettleUpModal
                    isOpen={!!selectedDebt}
                    onClose={() => setSelectedDebt(null)}
                    onConfirm={confirmSettlement}
                    receiverName={selectedDebt.user_name}
                    amount={selectedDebt.amount}
                />
            )}
        </div>
    );
};

export default DebtList;