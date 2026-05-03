import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../api';
import SettleUpModal from '../SettleUpModal';

interface Props {
    group: any;
    currentUser: any;
    onRefresh: () => void;
    onRefreshGlobal: () => void;
    onToast: (msg: string, type?: 'success' | 'error') => void;
}

const GroupSettlementsSection: React.FC<Props> = ({
    group,
    currentUser,
    onRefresh,
    onRefreshGlobal,
    onToast,
}) => {
    const incomingRequests: any[] = group.pending_settlements || [];
    const myDebts: any[] = group.my_debts || [];

    const [selectedDebt, setSelectedDebt] = useState<any>(null);
    const [localPendingIds, setLocalPendingIds] = useState<Set<string>>(new Set());
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const isDebtPending = (debt: any): boolean =>
        !!debt.is_pending || localPendingIds.has(String(debt.user_id));

    // ── Incoming: Confirm ────────────────────────────────────────────────────
    const handleConfirm = async (reqId: string) => {
        setConfirmingId(reqId);
        try {
            await api.patch(`/settlements/${reqId}/confirm`);
            onToast('Payment confirmed!');
            await onRefresh();
            onRefreshGlobal();
        } catch (err: any) {
            onToast(err?.response?.data?.detail || 'Error confirming payment.', 'error');
        } finally {
            setConfirmingId(null);
        }
    };

    // ── Incoming: Reject ─────────────────────────────────────────────────────
    const handleReject = async (reqId: string) => {
        setRejectingId(reqId);
        try {
            await api.patch(`/settlements/${reqId}/reject`);
            onToast('Payment rejected.');
            await onRefresh();
            onRefreshGlobal();
        } catch (err: any) {
            onToast(err?.response?.data?.detail || 'Error rejecting payment.', 'error');
        } finally {
            setRejectingId(null);
        }
    };

    // ── Outgoing: Pay (modal confirm) ────────────────────────────────────────
    const confirmSettlement = async () => {
        if (!selectedDebt) return;
        const debtKey = String(selectedDebt.user_id);
        setLocalPendingIds(prev => new Set(prev).add(debtKey));
        setSelectedDebt(null);
        try {
            const payAmount = selectedDebt.effective_amount ?? selectedDebt.amount;
            await api.post('/settlements/', {
                amount: payAmount,
                group_id: String(group.id),
                receiver_id: String(selectedDebt.user_id),
            });
            onToast('Payment submitted! Awaiting confirmation.');
            await onRefresh();
            onRefreshGlobal();
        } catch (err: any) {
            setLocalPendingIds(prev => {
                const updated = new Set(prev);
                updated.delete(debtKey);
                return updated;
            });
            throw err;
        }
    };

    const hasContent = incomingRequests.length > 0 || myDebts.length > 0;

    if (!hasContent) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
                <CheckCircle size={22} className="text-emerald-400 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40">
                    All settled up
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ── Incoming: Action Required ── */}
            {incomingRequests.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
                        <CheckCircle size={14} className="text-emerald-500" /> Confirm Payments
                    </h3>
                    <div className="space-y-3">
                        {incomingRequests.map((req: any) => (
                            <div
                                key={req.id}
                                className="bg-[#F7F4F0] rounded-xl p-4 flex flex-col gap-3 border border-secondary/10"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm text-primary">{req.sender_name}</p>
                                        <p className="text-[10px] text-secondary/50 font-semibold uppercase tracking-wide mt-0.5">
                                            sent you a payment
                                        </p>
                                    </div>
                                    <p className="font-black text-emerald-600 text-sm">
                                        +€{Number(req.amount).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleConfirm(req.id)}
                                        disabled={confirmingId === req.id}
                                        className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-60"
                                    >
                                        {confirmingId === req.id ? 'Confirming...' : 'Confirm'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        disabled={rejectingId === req.id}
                                        className="flex-1 bg-secondary/10 hover:bg-secondary/20 text-secondary py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-60"
                                    >
                                        {rejectingId === req.id ? '...' : 'Reject'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Outgoing: My Debts ── */}
            {myDebts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
                        <AlertCircle size={14} className="text-red-500" /> Debts to Settle
                    </h3>
                    <div className="space-y-3">
                        {myDebts.map((debt: any) => {
                            const isPending = isDebtPending(debt);
                            const displayAmount = Number(debt.effective_amount ?? debt.amount ?? 0);

                            return (
                                <div
                                    key={String(debt.user_id)}
                                    className={`rounded-xl p-4 flex items-center justify-between border transition-all ${
                                        isPending
                                            ? 'bg-amber-50 border-amber-200/60'
                                            : 'bg-[#F7F4F0] border-secondary/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                                isPending
                                                    ? 'bg-amber-100 text-amber-600'
                                                    : 'bg-red-50 text-red-500'
                                            }`}
                                        >
                                            {debt.user_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-primary">{debt.user_name}</p>
                                            <p
                                                className={`text-[10px] font-semibold ${
                                                    isPending ? 'text-amber-600' : 'text-red-500'
                                                }`}
                                            >
                                                {isPending
                                                    ? 'Awaiting confirmation...'
                                                    : `-€${displayAmount.toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>

                                    {isPending ? (
                                        <div className="flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase tracking-wide">
                                            <Clock size={12} /> Pending
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedDebt(debt)}
                                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                                        >
                                            Pay
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Settle Up Modal */}
            <SettleUpModal
                isOpen={!!selectedDebt}
                onClose={() => setSelectedDebt(null)}
                onConfirm={confirmSettlement}
                receiverName={selectedDebt?.user_name}
                amount={selectedDebt?.effective_amount ?? selectedDebt?.amount}
                groupName={group?.name}
            />
        </div>
    );
};

export default GroupSettlementsSection;
