import React, { useState } from 'react';
import api from '../api';
import SettleUpModal from './SettleUpModal';

const DebtList = ({ debts, groupId, onRefresh }) => {
    const [selectedDebt, setSelectedDebt] = useState(null);

    const handleSettleClick = (debt) => {
        // Never open modal for pending debts — guarded at render level too
        if (debt.is_pending) return;
        setSelectedDebt(debt);
    };

    const confirmSettlement = async () => {
        await api.post('/settlements/', {
            amount: selectedDebt.amount,
            group_id: groupId,
            receiver_id: selectedDebt.user_id
        });
        // Close modal and force full re-fetch so is_pending=true reflects immediately
        setSelectedDebt(null);
        if (onRefresh) onRefresh();
    };

    const handleModalError = (err) => {
        const detail = err?.response?.data?.detail || 'Gabim gjatë dërgimit.';
        if (detail === 'ALREADY_PENDING') {
            alert('Një kërkesë për këtë person është tashmë në pritje!');
        } else {
            alert(detail);
        }
    };

    return (
        <div className="mt-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">
                Borxhet e Mia
            </h4>
            <ul className="space-y-3">
                {debts.map((debt) => {
                    const isPending = debt.is_pending === true;

                    return (
                        <li
                            key={debt.user_id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                isPending
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-red-50 border-red-100'
                            }`}
                        >
                            <div>
                                <p className="text-sm font-bold text-slate-800">
                                    {debt.user_name}
                                </p>
                                <p className={`text-xs font-semibold mt-0.5 ${isPending ? 'text-amber-700' : 'text-red-500'}`}>
                                    {isPending
                                        ? '⏳ Verification in progress...'
                                        : `Borxh: ${debt.amount}€`}
                                </p>
                            </div>

                            {isPending ? (
                                // Non-interactive replacement — NO button, NO onClick
                                <span className="px-4 py-2 rounded-xl text-xs font-black bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none">
                                    Pending...
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleSettleClick(debt)}
                                    className="px-4 py-2 rounded-xl text-xs font-black bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white shadow-sm transition-all"
                                >
                                    PAGUAJ
                                </button>
                            )}
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
                    amount={selectedDebt.amount}
                />
            )}
        </div>
    );
};

export default DebtList;