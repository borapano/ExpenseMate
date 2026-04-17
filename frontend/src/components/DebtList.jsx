import React, { useState } from 'react';
import api from '../api'; // supozojmë se keni një instancë axios
import SettleUpModal from './SettleUpModal';

const DebtList = ({ debts, groupId, onRefresh }) => {
    const [selectedDebt, setSelectedDebt] = useState(null);

    const handleSettleClick = (debt) => {
        setSelectedDebt(debt);
    };

    const confirmSettlement = async () => {
        try {
            await api.post('/settlements/', {
                amount: selectedDebt.amount,
                group_id: groupId,
                receiver_id: selectedDebt.user_id
            });
            alert("Kërkesa u dërgua! Personi duhet ta konfirmojë.");
            setSelectedDebt(null);
            onRefresh(); // Refresh të dhënat e grupit
        } catch (err) {
            console.error("Gabim gjatë settlement:", err);
        }
    };

    return (
        <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Borxhet e Mia</h4>
            <ul className="space-y-3">
                {debts.map((debt) => (
                    <li key={debt.user_id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium">{debt.user_name}</p>
                            <p className="text-xs text-red-600">I detyrohesh: {debt.amount}€</p>
                        </div>
                        <button
                            onClick={() => handleSettleClick(debt)}
                            className="px-3 py-1 bg-white border border-red-200 text-red-600 text-xs rounded-md hover:bg-red-600 hover:text-white transition"
                        >
                            Paguaj
                        </button>
                    </li>
                ))}
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