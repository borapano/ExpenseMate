import React from 'react';
import { ShieldCheck, Clock, Users } from 'lucide-react';

/*
 * DebtsToSettleCard — Payables list (money I owe).
 *
 * Section 1 — Active Debts:
 *   Unsettled shares I owe. Shows: receiver, description, group, amount + Pay button.
 *
 * Section 2 — Pending Confirmation:
 *   Debts I've paid but receiver hasn't confirmed yet.
 */

interface Props {
    payables: any[];
    payingDebts: Set<string>;
    onPay: (debt: any) => void;
}

const fmt = (v: number) =>
    `$${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DebtsToSettleCard: React.FC<Props> = ({ payables, payingDebts, onPay }) => {
    const debts = Array.isArray(payables) ? payables : [];

    const activeDebts = debts.filter(d => !d.is_pending && !payingDebts.has(d.expense_id));
    const pendingDebts = debts.filter(d => d.is_pending || payingDebts.has(d.expense_id));

    const totalItems = debts.length;

    return (
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col h-[360px] overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0 border-b border-secondary/5">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                        Debts to Settle
                    </h2>
                    <p className="text-[11px] text-primary/35 mt-0.5 italic font-medium">
                        Your unpaid shares
                    </p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${activeDebts.length > 0 ? 'bg-red-500 text-white' : 'bg-primary text-white'
                    }`}>
                    {totalItems}
                </span>
            </div>

            {/* Empty state */}
            {totalItems === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-secondary/20 gap-2">
                    <ShieldCheck size={32} strokeWidth={1.2} />
                    <p className="text-[10px] font-black uppercase tracking-widest">All settled up</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 custom-scrollbar">

                    {/* Section 1: Active Debts */}
                    {activeDebts.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-500/70 px-1 pt-1">
                                Active Debts
                            </p>
                            {activeDebts.map((debt, idx) => (
                                <div
                                    key={`active-${debt.expense_id}-${idx}`}
                                    className="flex items-center justify-between min-h-[68px] rounded-xl px-4 py-2 bg-white border border-secondary/10 hover:border-red-100 transition-colors shrink-0"
                                >
                                    {/* Left: receiver + description + group */}
                                    <div className="flex flex-col gap-0.5 min-w-0 max-w-[60%]">
                                        <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                            {debt.receiver_name ?? 'Unknown'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-secondary/60 truncate" title={debt.expense_description}>
                                            {debt.expense_description ?? 'No description'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Users size={9} className="text-secondary/30 shrink-0" strokeWidth={2.5} />
                                            <p className="text-[9px] font-bold text-secondary/35 truncate uppercase tracking-wide">
                                                {debt.group_name ?? 'Unknown group'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: amount + pay button */}
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <p className="text-[14px] font-black text-red-600 leading-none">
                                            -{fmt(debt.amount ?? 0)}
                                        </p>
                                        <button
                                            onClick={() => onPay(debt)}
                                            className="h-[22px] px-3 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-md hover:bg-red-500 transition-colors shadow-sm"
                                        >
                                            Pay
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Section 2: Pending Confirmation */}
                    {pendingDebts.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/40 px-1 pt-2">
                                Pending Confirmation
                            </p>
                            {pendingDebts.map((debt, idx) => (
                                <div
                                    key={`pending-${debt.expense_id}-${idx}`}
                                    className="flex items-center justify-between min-h-[68px] rounded-xl px-4 py-2 bg-amber-50/50 border border-amber-100/80 shrink-0"
                                >
                                    {/* Left: receiver + description + group */}
                                    <div className="flex flex-col gap-0.5 min-w-0 max-w-[60%]">
                                        <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                            {debt.receiver_name ?? 'Unknown'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-secondary/60 truncate" title={debt.expense_description}>
                                            {debt.expense_description ?? 'No description'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Users size={9} className="text-secondary/30 shrink-0" strokeWidth={2.5} />
                                            <p className="text-[9px] font-bold text-secondary/35 truncate uppercase tracking-wide">
                                                {debt.group_name ?? 'Unknown group'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: amount + pending badge */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <p className="text-[14px] font-black text-red-600 leading-none">
                                            -{fmt(debt.amount ?? 0)}
                                        </p>
                                        <div className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 rounded-md border border-amber-100/60">
                                            <Clock size={10} className="text-amber-500" strokeWidth={2.5} />
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">
                                                Pending
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                </div>
            )}
        </div>
    );
};

export default DebtsToSettleCard;