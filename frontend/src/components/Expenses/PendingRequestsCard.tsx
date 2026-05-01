import React, { useMemo } from 'react';
import { ShieldCheck, Check, X, Clock } from 'lucide-react';

interface Props {
    expenses: any[];
    onConfirm: (id: string) => void;
    onReject: (id: string) => void;
}

const PendingRequestsCard: React.FC<Props> = ({ expenses, onConfirm, onReject }) => {

    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => {
            // Put items requiring action first
            if (a.isActionRequired && !b.isActionRequired) return -1;
            if (!a.isActionRequired && b.isActionRequired) return 1;
            return 0;
        });
    }, [expenses]);

    return (
        /* Lartësia fikse 358px për simetri me DebtsToSettleCard */
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col flex-1 h-[358px] overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between shrink-0 bg-secondary/[0.02] border-b border-secondary/5">
                <div className="flex flex-col">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                        Receivables
                    </h2>
                    <p className="text-[11px] text-primary/40 mt-0.5 italic font-medium">Money coming your way</p>
                </div>
                <span className="text-[10px] bg-primary text-white font-bold px-2.5 py-1 rounded-lg shadow-sm shadow-primary/20">
                    {sortedExpenses.length} Items
                </span>
            </div>

            {sortedExpenses.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-secondary/20">
                    <ShieldCheck size={32} strokeWidth={1.2} className="mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">All settled up</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar-gray px-6 py-4 flex flex-col gap-2">
                    {sortedExpenses.map((expense: any, idx) => {
                        const isActionRequired = expense.isActionRequired;
                        const settlementId = expense.id || (expense.transactions?.find((t: any) => t.status === 'pending')?.id);

                        return (
                            <div
                                key={`${expense.id}-${idx}`}
                                className={`w-full h-[72px] rounded-xl px-4 border transition-all duration-200 flex items-center justify-between shrink-0 ${isActionRequired
                                        ? 'bg-emerald-50/40 border-emerald-100/60 shadow-sm shadow-emerald-100/10 hover:border-emerald-200'
                                        : 'bg-white border-secondary/10 hover:border-emerald-100 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex flex-col text-left max-w-[60%]">
                                    <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                        {expense.description}
                                    </p>
                                    <p className="text-[11px] text-secondary/60 capitalize font-medium truncate">
                                        {expense.group_name || 'Personal'}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end justify-center h-full gap-0.5">
                                    <p className="text-[14px] font-black text-emerald-600 leading-none mb-1">
                                        +€{Number(expense.statusAmount || expense.amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>

                                    {isActionRequired ? (
                                        <div className="flex gap-1.5">
                                            {settlementId ? (
                                                <>
                                                    <button
                                                        onClick={() => onConfirm(settlementId)}
                                                        className="h-[22px] w-[28px] bg-primary text-white flex items-center justify-center rounded-md hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20"
                                                    >
                                                        <Check size={12} strokeWidth={4} />
                                                    </button>
                                                    <button
                                                        onClick={() => onReject(settlementId)}
                                                        className="h-[22px] w-[28px] bg-white border border-secondary/20 text-secondary/40 flex items-center justify-center rounded-md hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 transition-all active:scale-95"
                                                    >
                                                        <X size={12} strokeWidth={4} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="h-[22px] flex items-center px-2 bg-amber-50 rounded-md border border-amber-100/50">
                                                    <p className="text-[9px] font-bold text-amber-500 flex items-center gap-1 uppercase tracking-tighter">
                                                        <Clock size={10} strokeWidth={2.5} /> Pending
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-[22px] flex items-center px-2 bg-secondary/5 rounded-md border border-secondary/5">
                                            <p className="text-[9px] font-bold text-secondary/50 flex items-center gap-1 uppercase tracking-tighter">
                                                <Clock size={10} strokeWidth={2.5} /> Expected
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <style>{`
                .custom-scrollbar-gray::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-gray::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-gray::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default PendingRequestsCard;