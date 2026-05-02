import React from 'react';
import { Check, X } from 'lucide-react';
import api from '../api';

/**
 * SettlementRequests — displays incoming payment confirmations inside a Group page.
 *
 * Props:
 *   settlements     — array of pending settlement objects for this group
 *   onRefreshLocal  — refreshes the local group page data
 *   onRefreshGlobal — (optional) calls DataContext.refreshAllData() so summary
 *                     cards (ToPayCard, ToReceiveCard) update immediately
 */
const SettlementRequests = ({ settlements, onRefreshLocal, onRefreshGlobal, onRefresh }) => {
    const refreshLocal = onRefreshLocal || onRefresh;
    const safeSettlements = Array.isArray(settlements) ? settlements : [];
    const [loadingId, setLoadingId] = React.useState(null);

    const handleAction = async (id, action) => {
        if (loadingId) return; // prevent double-click
        setLoadingId(id);
        try {
            await api.patch(`/settlements/${id}/${action}`);
            if (refreshLocal) await refreshLocal();
            if (onRefreshGlobal) await onRefreshGlobal();
        } catch (err) {
            console.error('[SettlementRequests] Action failed:', err?.response?.data || err.message);
        } finally {
            setLoadingId(null);
        }
    };

    if (safeSettlements.length === 0) return null;

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 mt-4">
            <h3 className="text-sm font-bold text-primary/70 mb-3 uppercase tracking-widest text-[10px]">
                Payment Confirmations Required
            </h3>
            <div className="space-y-3">
                {safeSettlements.map((s) => (
                    <div
                        key={s.id}
                        className="flex items-center justify-between border-b border-secondary/5 pb-3 last:border-0 last:pb-0"
                    >
                        <div>
                            <p className="text-sm font-bold text-primary">
                                {s.sender_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-secondary/60 mt-0.5">
                                Claims to have paid you{' '}
                                <span className="font-black text-emerald-600">
                                    €{Number(s.amount || 0).toFixed(2)}
                                </span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction(s.id, 'confirm')}
                                disabled={!!loadingId}
                                className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Confirm payment"
                            >
                                <Check size={13} strokeWidth={3} /> {loadingId === s.id ? '...' : 'Confirm'}
                            </button>
                            <button
                                onClick={() => handleAction(s.id, 'reject')}
                                disabled={!!loadingId}
                                className="flex items-center gap-1.5 bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject payment"
                            >
                                <X size={13} strokeWidth={3} /> {loadingId === s.id ? '...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettlementRequests;