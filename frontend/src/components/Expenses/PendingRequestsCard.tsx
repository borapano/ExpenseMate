import React from 'react';
import { ShieldCheck, Check, X, Clock, Users } from 'lucide-react';

/*
 * PendingRequestsCard — Money coming to me.
 *
 * Section 1 — Action Required:
 *   Incoming settlements that need Confirm / Reject.
 *
 * Section 2 — Active Credits:
 *   Unsettled shares where I was the payer — others owe me.
 *   Shows: person, description, group, amount.
 */

interface Props {
    pendingSettlements: any[];
    receivables: any[];
    onConfirm: (settlementId: string) => void;
    onReject: (settlementId: string) => void;
}

const fmt = (v: number) =>
    `$${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PendingRequestsCard: React.FC<Props> = ({
    pendingSettlements,
    receivables,
    onConfirm,
    onReject,
}) => {
    const requests = Array.isArray(pendingSettlements) ? pendingSettlements : [];
    const activeCredits = Array.isArray(receivables) ? receivables : [];
    const totalItems = requests.length + activeCredits.length;

    return (
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col h-[360px] overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0 border-b border-secondary/5">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                        Pending Requests
                    </h2>
                    <p className="text-[11px] text-primary/35 mt-0.5 italic font-medium">
                        Money coming your way
                    </p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${requests.length > 0 ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
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

                    {/* Section 1: Action Required */}
                    {requests.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70 px-1 pt-1">
                                Action Required
                            </p>
                            {requests.map(req => (
                                <div
                                    key={req.id}
                                    className="flex items-center justify-between min-h-[68px] rounded-xl px-4 py-2 bg-emerald-50/60 border border-emerald-100 shrink-0 hover:border-emerald-200 transition-colors"
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0 max-w-[55%]">
                                        <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                            {req.sender_name ?? 'Unknown'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-secondary/60 truncate" title={req.expense_description}>
                                            {req.expense_description ?? 'Direct Payment'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Users size={9} className="text-secondary/30 shrink-0" strokeWidth={2.5} />
                                            <p className="text-[9px] font-bold text-secondary/35 truncate uppercase tracking-wide">
                                                {req.group_name ?? 'Unknown group'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <p className="text-[14px] font-black text-emerald-600 leading-none">
                                            +{fmt(req.amount ?? 0)}
                                        </p>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => onConfirm(req.id)}
                                                className="h-6 w-8 bg-primary text-white flex items-center justify-center rounded-md hover:bg-emerald-600 transition-colors"
                                            >
                                                <Check size={12} strokeWidth={3.5} />
                                            </button>
                                            <button
                                                onClick={() => onReject(req.id)}
                                                className="h-6 w-8 bg-white border border-secondary/20 text-secondary/40 flex items-center justify-center rounded-md hover:text-red-500 hover:border-red-200 transition-colors"
                                            >
                                                <X size={12} strokeWidth={3.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Section 2: Active Credits */}
                    {activeCredits.length > 0 && (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/40 px-1 pt-2">
                                Active Credits
                            </p>
                            {activeCredits.map(credit => (
                                <div
                                    key={`${credit.expense_id}-${credit.debtor_id ?? credit.user_id}`}
                                    className="flex items-center justify-between min-h-[68px] rounded-xl px-4 py-2 bg-white border border-secondary/10 hover:border-emerald-100 transition-colors shrink-0"
                                >
                                    {/* Left: person + description + group */}
                                    <div className="flex flex-col gap-0.5 min-w-0 max-w-[60%]">
                                        <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                            {credit.debtor_name ?? credit.user_name ?? 'Unknown'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-secondary/60 truncate" title={credit.expense_description}>
                                            {credit.expense_description ?? 'No description'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Users size={9} className="text-secondary/30 shrink-0" strokeWidth={2.5} />
                                            <p className="text-[9px] font-bold text-secondary/35 truncate uppercase tracking-wide">
                                                {credit.group_name ?? 'Unknown group'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: amount + badge */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <p className="text-[14px] font-black text-emerald-600 leading-none">
                                            +{fmt(credit.amount ?? 0)}
                                        </p>
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary/5 rounded border border-secondary/5">
                                            <Clock size={9} className="text-secondary/40" strokeWidth={2.5} />
                                            <p className="text-[9px] font-bold text-secondary/40 uppercase tracking-tighter">
                                                Unpaid
                                            </p>
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

export default PendingRequestsCard;