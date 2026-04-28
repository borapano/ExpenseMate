import React, { useMemo } from 'react';
import { CreditCard, ShieldCheck, Clock } from 'lucide-react';

interface Props {
    debts: any[];
    payingDebts: Set<string>;
    onPay: (debt: any) => void;
}

const DebtsToSettleCard: React.FC<Props> = ({ debts, payingDebts, onPay }) => {
    const sortedDebts = useMemo(() => {
        return [...debts].sort((a, b) => {
            const aEffective = Number(a.effective_amount ?? a.amount);
            const bEffective = Number(b.effective_amount ?? b.amount);
            
            const aActionable = aEffective > 0 && !a.is_pending;
            const bActionable = bEffective > 0 && !b.is_pending;

            if (aActionable && !bActionable) return -1;
            if (!aActionable && bActionable) return 1;
            
            // Priority 2: Pending (Info)
            if (a.is_pending && !b.is_pending) return -1;
            if (!a.is_pending && b.is_pending) return 1;

            return 0;
        });
    }, [debts]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col flex-1 h-[400px] transition-shadow duration-200 hover:shadow-md">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-5 flex items-center gap-2 shrink-0">
                <CreditCard size={14} /> Debts to Settle
            </h2>

            {sortedDebts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-secondary/40">
                    <ShieldCheck size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">No pending debts!</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 pb-2">
                    {sortedDebts.map((debt: any) => {
                        const debtId = `${debt.group_id}-${debt.user_id}`;

                        // Kontrollojmë nëse sapo u klikua (state lokal) 
                        const isProcessing = payingDebts.has(debtId);
                        const effectiveAmount = Number(debt.effective_amount ?? debt.amount);
                        const isAlreadyPending = debt.is_pending;
                        const isDisabled = isProcessing || effectiveAmount <= 0;

                        return (
                            <div key={debtId} className={`border rounded-xl p-4 flex flex-col gap-3 relative transition-all shrink-0 ${isDisabled ? 'bg-gray-50 border-gray-100' : 'bg-red-50/30 border-red-100/50'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-primary text-sm">{debt.user_name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-secondary/60 font-semibold">{debt.group_name || 'Group'}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className={`font-black text-base ${isDisabled ? 'text-secondary/50' : 'text-red-500'}`}>
                                            €{effectiveAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        {isAlreadyPending && (
                                            <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                                                <Clock size={10} />
                                                {effectiveAmount <= 0 ? 'Verification' : 'Partial'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => onPay(debt)}
                                    className={`w-full flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors ${isDisabled
                                            ? 'bg-secondary/10 text-secondary/50 cursor-not-allowed border border-transparent'
                                            : 'bg-white border border-secondary/20 text-primary hover:bg-red-50 hover:text-red-500 shadow-sm'
                                        }`}
                                >
                                    {isDisabled ? (
                                        <>
                                            <Clock size={14} className="animate-pulse" />
                                            Pending
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={14} />
                                            Pay Now
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DebtsToSettleCard;