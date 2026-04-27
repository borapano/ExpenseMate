import React from 'react';
import api from '../api';

const SettlementRequests = ({ settlements, onRefresh }) => {
    // Defensive: accept undefined/null gracefully
    const safeSettlements = Array.isArray(settlements) ? settlements : [];

    const handleAction = async (id, action) => {
        try {
            await api.patch(`/settlements/${id}/${action}`);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('[SettlementRequests] Action failed:', err?.response?.data || err.message);
        }
    };

    if (safeSettlements.length === 0) return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 mt-4">
            <h3 className="text-sm font-bold text-blue-800 mb-3">Kërkesa për Konfirmim Pagese</h3>
            <div className="space-y-3">
                {safeSettlements.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                            <p className="text-sm font-semibold">{s.sender_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">Thotë se të ka paguar: <span className="font-bold">{Number(s.amount || 0).toFixed(2)}€</span></p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleAction(s.id, 'confirm')}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                            >
                                Konfirmo
                            </button>
                            <button
                                onClick={() => handleAction(s.id, 'reject')}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                                Refuzo
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettlementRequests;