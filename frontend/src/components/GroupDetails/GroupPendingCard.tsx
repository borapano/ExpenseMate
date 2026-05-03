import React, { useState } from 'react';
import { CheckCircle, ArrowDownLeft } from 'lucide-react';
import api from '../../api';

interface Props {
    group: any;
    onRefresh: () => void;
    onRefreshGlobal: () => void;
    onToast: (msg: string, type?: 'success' | 'error') => void;
}

const GroupPendingCard: React.FC<Props> = ({ group, onRefresh, onRefreshGlobal, onToast }) => {
    // Incoming payment requests I need to confirm/reject
    const incoming: any[] = group.pending_settlements || [];
    // Amounts others owe me (expected payments I haven't received yet)
    const toReceive: any[] = group.expected_payments || [];

    const [loadingId, setLoadingId] = useState<string | null>(null);

    const confirm = async (id: string) => {
        setLoadingId(id);
        try {
            await api.patch(`/settlements/${id}/confirm`);
            onToast('Payment confirmed!');
            await onRefresh();
            onRefreshGlobal();
        } catch (e: any) {
            onToast(e?.response?.data?.detail || 'Error confirming.', 'error');
        } finally { setLoadingId(null); }
    };

    const reject = async (id: string) => {
        setLoadingId(id);
        try {
            await api.patch(`/settlements/${id}/reject`);
            onToast('Payment rejected.');
            await onRefresh();
            onRefreshGlobal();
        } catch (e: any) {
            onToast(e?.response?.data?.detail || 'Error rejecting.', 'error');
        } finally { setLoadingId(null); }
    };

    const isEmpty = incoming.length === 0 && toReceive.length === 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-500" /> Pending Requests
            </h3>

            {isEmpty ? (
                <div className="flex-1 flex items-center justify-center py-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary/30">Nothing pending</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {/* Incoming: Action Required */}
                    {incoming.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/40 mb-0.5">Action Required</p>
                            {incoming.map(req => (
                                <div key={req.id}
                                    className="bg-[#F7F4F0] rounded-xl border border-secondary/10 p-3.5 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-xl bg-primary text-accent flex items-center justify-center font-black text-xs shrink-0">
                                                {(req.sender_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-primary truncate">{req.sender_name}</p>
                                                <p className="text-[10px] font-semibold text-secondary/40">sent you a payment</p>
                                            </div>
                                        </div>
                                        <span className="font-black text-sm text-emerald-600 shrink-0">+€{Number(req.amount).toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => confirm(req.id)}
                                            disabled={loadingId === req.id}
                                            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-colors">
                                            {loadingId === req.id ? '...' : 'Confirm'}
                                        </button>
                                        <button
                                            onClick={() => reject(req.id)}
                                            disabled={loadingId === req.id}
                                            className="flex-1 bg-secondary/10 hover:bg-secondary/20 disabled:opacity-60 text-secondary py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-colors">
                                            {loadingId === req.id ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Separator */}
                    {incoming.length > 0 && toReceive.length > 0 && (
                        <div className="flex items-center gap-2 my-0.5">
                            <div className="flex-1 h-px bg-secondary/10" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-secondary/30">To Receive</span>
                            <div className="flex-1 h-px bg-secondary/10" />
                        </div>
                    )}

                    {/* To Receive */}
                    {toReceive.length > 0 && (
                        <>
                            {incoming.length === 0 && (
                                <p className="text-[9px] font-black uppercase tracking-widest text-secondary/40 mb-0.5">To Receive</p>
                            )}
                            {toReceive.map(item => (
                                <div key={`${item.group_id}-${item.user_id}`}
                                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-emerald-50/50 border-emerald-100/60">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <ArrowDownLeft size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-primary truncate">{item.user_name}</p>
                                            <p className="text-[10px] font-semibold text-secondary/40">owes you</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-sm text-emerald-600 shrink-0">+€{Number(item.amount).toFixed(2)}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default GroupPendingCard;
