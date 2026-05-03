import React, { useState } from 'react';
import { ShieldCheck, Check, X, AlertCircle } from 'lucide-react';
import api from '../../api';

const fmt = (v: number) =>
    `€${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Confirmation Modal ─────────────────────────────────────────────────────────
interface ModalState {
    type: 'confirm' | 'reject';
    id: string;
    senderName: string;
    expenseDescription: string;
    amount: number;
}

const ConfirmationModal: React.FC<{
    modal: ModalState;
    onProceed: () => void;
    onCancel: () => void;
}> = ({ modal, onProceed, onCancel }) => {
    const isConfirm = modal.type === 'confirm';
    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-6 py-5 flex items-center gap-3 ${isConfirm ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    <AlertCircle size={20} className="text-white shrink-0" />
                    <div>
                        <h3 className="text-white font-black text-base tracking-tight">
                            {isConfirm ? 'Confirm Payment' : 'Reject Payment'}
                        </h3>
                        <p className="text-white/70 text-xs font-semibold mt-0.5">
                            {isConfirm ? 'Please review before confirming' : 'This action cannot be undone'}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-6 flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-1 py-2">
                        <p className="text-sm font-semibold text-secondary/60">
                            {isConfirm ? 'Confirming payment from' : 'Rejecting payment from'}
                        </p>
                        <p className="text-xl font-black text-primary">{modal.senderName}</p>
                        {modal.expenseDescription && (
                            <p className="text-xs font-semibold text-secondary/40 mt-0.5 text-center">
                                {modal.expenseDescription}
                            </p>
                        )}
                        <p className="text-3xl font-black text-primary tracking-tight mt-1">
                            {fmt(modal.amount)}
                        </p>
                    </div>
                    <p className="text-[11px] text-secondary/50 font-semibold text-center">
                        {isConfirm
                            ? 'By confirming, you acknowledge that you have received this payment and the debt will be marked as settled.'
                            : 'By rejecting, the payment request will be dismissed and the debt will remain active.'}
                    </p>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl border border-secondary/20 text-sm font-bold text-primary hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onProceed}
                        className={`flex-1 py-3 rounded-xl text-white text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
                            isConfirm ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                        }`}
                    >
                        {isConfirm ? 'Yes, Confirm' : 'Yes, Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props {
    group: any;
    onRefresh: () => void;
    onRefreshGlobal: () => void;
    onToast: (msg: string, type?: 'success' | 'error') => void;
}

const GroupReceivablesCard: React.FC<Props> = ({ group, onRefresh, onRefreshGlobal, onToast }) => {
    // Approach B:
    // pending_settlements = incoming PENDING settlements I must confirm/reject
    //   Each: { id, sender_id, sender_name, expense_id, expense_description, amount }
    // expected_payments = unsettled per-expense amounts owed to me (no pending settlement yet)
    //   Each: { expense_id, expense_description, user_id, user_name, amount }
    const incoming: any[] = group.pending_settlements || [];
    const toReceive: any[] = group.expected_payments || [];
    const totalItems = incoming.length + toReceive.length;

    const [modal, setModal] = useState<ModalState | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleConfirmClick = (req: any) => {
        setModal({
            type: 'confirm',
            id: req.id,
            senderName: req.sender_name ?? 'Unknown',
            expenseDescription: req.expense_description ?? '',
            amount: req.amount ?? 0,
        });
    };

    const handleRejectClick = (req: any) => {
        setModal({
            type: 'reject',
            id: req.id,
            senderName: req.sender_name ?? 'Unknown',
            expenseDescription: req.expense_description ?? '',
            amount: req.amount ?? 0,
        });
    };

    const handleProceed = async () => {
        if (!modal) return;
        const { id, type } = modal;
        setModal(null);
        setLoadingId(id);
        try {
            if (type === 'confirm') {
                await api.patch(`/settlements/${id}/confirm`);
                onToast('Payment confirmed!');
            } else {
                await api.patch(`/settlements/${id}/reject`);
                onToast('Payment rejected.');
            }
            await onRefresh();
            onRefreshGlobal();
        } catch (e: any) {
            onToast(e?.response?.data?.detail || `Error ${type === 'confirm' ? 'confirming' : 'rejecting'}.`, 'error');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0 border-b border-secondary/5">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Receivables</h2>
                    <p className="text-[11px] text-primary/35 mt-0.5 italic font-medium">Money coming your way</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${
                    incoming.length > 0 ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
                }`}>
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
            </div>

            {/* Empty state */}
            {totalItems === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-secondary/20 gap-2 py-12">
                    <ShieldCheck size={32} strokeWidth={1.2} />
                    <p className="text-[10px] font-black uppercase tracking-widest">All settled up</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-secondary/20
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb:hover]:bg-secondary/30">

                    {/* Section 1: Action Required — incoming PENDING settlements to confirm */}
                    {incoming.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70 px-1 pt-1">
                                Action Required
                            </p>
                            {incoming.map((req: any) => (
                                <div
                                    key={req.id}
                                    className="flex items-center justify-between min-h-[64px] rounded-xl px-4 py-2 bg-emerald-50/60 border border-emerald-100 shrink-0 hover:border-emerald-200 transition-colors"
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0 max-w-[55%]">
                                        <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                            {req.sender_name ?? 'Unknown'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-secondary/50 truncate">
                                            {req.expense_description || '—'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <p className="text-[14px] font-black text-emerald-600 leading-none">
                                            +{fmt(req.amount ?? 0)}
                                        </p>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleConfirmClick(req)}
                                                disabled={loadingId === req.id}
                                                className="h-6 w-8 bg-primary text-white flex items-center justify-center rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                            >
                                                <Check size={12} strokeWidth={3.5} />
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(req)}
                                                disabled={loadingId === req.id}
                                                className="h-6 w-8 bg-white border border-secondary/20 text-secondary/40 flex items-center justify-center rounded-md hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                                            >
                                                <X size={12} strokeWidth={3.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Section 2: To Collect — unsettled, no pending settlement yet */}
                    {toReceive.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/40 px-1 pt-2">
                                To Collect
                            </p>
                            {toReceive.map((credit: any, idx: number) => (
                                <div
                                    key={`${credit.expense_id}-${credit.user_id}-${idx}`}
                                    className="flex items-center justify-between min-h-[64px] rounded-xl px-4 py-2 bg-white border border-secondary/10 hover:border-emerald-100 transition-colors shrink-0"
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0 max-w-[60%]">
                                        <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                            {credit.user_name ?? 'Unknown'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-secondary/50 truncate">
                                            {credit.expense_description || '—'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <p className="text-[14px] font-black text-emerald-600 leading-none">
                                            +{fmt(credit.amount ?? 0)}
                                        </p>
                                        <p className="text-[9px] font-bold text-secondary/40 uppercase tracking-wider">Expected</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {modal && (
                <ConfirmationModal
                    modal={modal}
                    onProceed={handleProceed}
                    onCancel={() => setModal(null)}
                />
            )}
        </div>
    );
};

export default GroupReceivablesCard;
