import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import api from '../../api';
import SettleUpModal from '../SettleUpModal';

const fmt = (v: number) =>
    `€${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
    group: any;
    onRefresh: () => void;
    onRefreshGlobal: () => void;
    onToast: (msg: string, type?: 'success' | 'error') => void;
}

const GroupDebtsCard: React.FC<Props> = ({ group, onRefresh, onRefreshGlobal, onToast }) => {
    // Approach B: my_debts is a per-expense list
    // Each entry: { expense_id, expense_description, payer_id, payer_name, amount, is_pending, settlement_id }
    const allDebts: any[] = group.my_debts || [];
    const activeDebts = allDebts.filter((d: any) => !d.is_pending);
    const pendingDebts = allDebts.filter((d: any) => d.is_pending);
    const totalItems = allDebts.length;

    const [selectedDebt, setSelectedDebt] = useState<any>(null);
    // Key: expense_id (unique per expense, not per person)
    const [localPendingIds, setLocalPendingIds] = useState<Set<string>>(new Set());

    const isPending = (debt: any) =>
        !!debt.is_pending || localPendingIds.has(String(debt.expense_id));

    const confirmPay = async () => {
        if (!selectedDebt) return;
        const key = String(selectedDebt.expense_id);
        setLocalPendingIds(prev => new Set(prev).add(key));
        setSelectedDebt(null);
        try {
            await api.post('/settlements/', {
                amount: selectedDebt.amount,
                group_id: String(group.id),
                receiver_id: String(selectedDebt.payer_id),
                expense_id: String(selectedDebt.expense_id),
            });
            onToast('Payment submitted! Awaiting confirmation.');
            await onRefresh();
            onRefreshGlobal();
        } catch (err: any) {
            setLocalPendingIds(prev => { const s = new Set(prev); s.delete(key); return s; });
            const detail = err?.response?.data?.detail;
            if (detail === 'SETTLEMENT_ALREADY_PENDING') {
                onToast('A payment for this expense is already pending.', 'error');
            } else {
                onToast(detail || 'Failed to submit payment.', 'error');
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0 border-b border-secondary/5">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Debts to Settle</h2>
                    <p className="text-[11px] text-primary/35 mt-0.5 italic font-medium">Your unpaid shares</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${
                    activeDebts.length > 0 ? 'bg-red-500 text-white' : 'bg-primary text-white'
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

                    {/* Section 1: Active Debts */}
                    {activeDebts.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-500/70 px-1 pt-1">
                                Active Debts
                            </p>
                            {activeDebts.map((debt: any) => {
                                const pending = isPending(debt);
                                return (
                                    <div
                                        key={String(debt.expense_id)}
                                        className="flex items-center justify-between min-h-[64px] rounded-xl px-4 py-2 bg-white border border-secondary/10 hover:border-red-100 transition-colors shrink-0"
                                    >
                                        <div className="flex flex-col gap-0.5 min-w-0 max-w-[60%]">
                                            <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                                {debt.payer_name ?? 'Unknown'}
                                            </p>
                                            <p className="text-[10px] font-semibold text-secondary/50 truncate">
                                                {debt.expense_description || '—'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <p className="text-[14px] font-black text-red-600 leading-none">
                                                -{fmt(Number(debt.amount ?? 0))}
                                            </p>
                                            {pending ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Pending</p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedDebt(debt)}
                                                    className="h-[22px] px-3 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-md hover:bg-red-500 transition-colors shadow-sm"
                                                >
                                                    Pay
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Section 2: Pending Confirmation */}
                    {pendingDebts.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/40 px-1 pt-2">
                                Pending Confirmation
                            </p>
                            {pendingDebts.map((debt: any) => (
                                <div
                                    key={String(debt.expense_id)}
                                    className="flex items-center justify-between min-h-[64px] rounded-xl px-4 py-2 bg-white border border-secondary/10 hover:border-amber-100 transition-colors shrink-0"
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0 max-w-[60%]">
                                        <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                            {debt.payer_name ?? 'Unknown'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-secondary/50 truncate">
                                            {debt.expense_description || '—'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <p className="text-[14px] font-black text-red-600 leading-none">
                                            -{fmt(Number(debt.amount ?? 0))}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Pending</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            <SettleUpModal
                isOpen={!!selectedDebt}
                onClose={() => setSelectedDebt(null)}
                onConfirm={confirmPay}
                receiverName={selectedDebt?.payer_name}
                amount={selectedDebt?.amount}
                description={selectedDebt?.expense_description}
                groupName={group?.name}
            />
        </div>
    );
};

export default GroupDebtsCard;
