import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    receiverName?: string;
    amount?: number;
    description?: string;
    groupName?: string;
}

const SettleUpModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, receiverName, amount, description, groupName }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const fmt = (v?: number) =>
        `€${Number(v ?? 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleConfirm = async () => {
        setProcessing(true);
        setError(null);
        try {
            await onConfirm();
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (detail === 'SETTLEMENT_ALREADY_PENDING') {
                setError('A payment request is already pending with this person.');
            } else if (detail === 'SELF_SETTLEMENT_NOT_ALLOWED') {
                setError('You cannot settle a debt with yourself.');
            } else {
                setError('Something went wrong. Please try again.');
            }
            setProcessing(false);
        }
    };

    const handleClose = () => {
        if (!processing) { setError(null); onClose(); }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary px-6 py-5 flex items-center gap-3">
                    <AlertCircle size={20} className="text-white shrink-0" />
                    <div>
                        <h3 className="text-white font-black text-base tracking-tight">Send Payment</h3>
                        <p className="text-white/70 text-xs font-semibold mt-0.5">
                            Please review before proceeding
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6 flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-1 py-2">
                        <p className="text-sm font-semibold text-secondary/60">You are paying</p>
                        <p className="text-xl font-black text-primary">{receiverName ?? '—'}</p>
                        <p className="text-3xl font-black text-primary tracking-tight mt-1">
                            {fmt(amount)}
                        </p>
                        {(description || groupName) && (
                            <p className="text-xs font-semibold text-secondary/50 mt-1">
                                {description}{description && groupName ? ` in ${groupName}` : groupName}
                            </p>
                        )}
                    </div>

                    <p className="text-[11px] text-secondary/50 font-semibold text-center">
                        The receiver must confirm this payment before the debt is marked as settled.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold text-center">
                            {error}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={processing}
                        className="flex-1 py-3 rounded-xl border border-secondary/20 text-sm font-bold text-primary hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={processing}
                        className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                        {processing
                            ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
                            : 'Yes, Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettleUpModal;