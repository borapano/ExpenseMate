import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

/*
 * SettleUpModal — Confirmation dialog for sending a payment.
 *
 * Flow: User clicks "Pay" on a debt → modal opens → user confirms →
 *   POST /settlements/ → success → parent closes modal and refreshes.
 *
 * Error handling:
 *   ALREADY_PENDING → "A payment request is already pending."
 *   SELF_SETTLEMENT_NOT_ALLOWED → "You cannot settle a debt with yourself."
 *   Other → generic error.
 */

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    receiverName?: string;
    amount?: number;
}

const SettleUpModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, receiverName, amount }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const fmt = (v?: number) =>
        `$${Number(v ?? 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleConfirm = async () => {
        setProcessing(true);
        setError(null);
        try {
            await onConfirm();
            // Parent closes modal on success
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
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary px-6 py-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-black text-lg tracking-tight">Confirm Payment</h3>
                        <p className="text-white/60 text-xs font-semibold mt-0.5">
                            This will send a request for confirmation
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={processing}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-5">
                    <div className="flex flex-col items-center gap-2 py-4">
                        <p className="text-sm font-semibold text-secondary/60">You are paying</p>
                        <p className="text-4xl font-black text-primary tracking-tight">{fmt(amount)}</p>
                        <p className="text-sm font-bold text-secondary/70">
                            to <span className="text-primary">{receiverName ?? '—'}</span>
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 font-semibold">
                        ⚠️ The receiver must <strong>confirm</strong> this payment before the debt is settled.
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold">
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
                            : <><Send size={15} /> Send Payment</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettleUpModal;