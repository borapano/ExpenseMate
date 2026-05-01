import React, { useMemo } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';

interface Props {
    expenses: any[];
    payingDebts: Set<string>;
    onPay: (expense: any) => void;
}

const DebtsToSettleCard: React.FC<Props> = ({ expenses, payingDebts, onPay }) => {
    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => {
            return b.statusAmount - a.statusAmount;
        });
    }, [expenses]);

    return (
        <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col flex-1 h-[358px] overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between shrink-0 bg-secondary/[0.02] border-b border-secondary/5">
                <div className="flex flex-col text-left">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                        Debts to Settle
                    </h2>
                    <p className="text-[11px] text-primary/40 mt-0.5 italic font-medium">Your pending balances</p>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar-gray px-6 py-4 flex flex-col gap-3">
                    {sortedExpenses.map((expense: any) => {
                        const debtId = `expense-${expense.id}`;
                        const displayAmount = Math.abs(Number(expense.statusAmount));
                        const isPaying = payingDebts.has(debtId);

                        return (
                            <div
                                key={expense.id}
                                className="w-full rounded-xl p-4 border transition-all duration-200 min-h-[76px] flex flex-col justify-center shrink-0 bg-white border-secondary/10 shadow-sm shadow-transparent hover:shadow-sm hover:border-red-100"
                            >
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex flex-col text-left max-w-[60%]">
                                        <p className="text-[13px] font-bold text-primary leading-tight truncate">
                                            {expense.description}
                                        </p>
                                        <p className="text-[11px] text-secondary/60 capitalize font-medium truncate">
                                            to {expense.payer_name || 'Member'} • {expense.group_name || 'Personal'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <p className="text-[14px] font-black leading-none text-red-500">
                                            -€{displayAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>

                                        {expense.isPending ? (
                                            <div className="px-2 py-1 bg-amber-50 rounded-md border border-amber-100/50">
                                                <p className="text-[9px] font-bold text-amber-500 flex items-center gap-1 uppercase tracking-tighter">
                                                    <Clock size={10} strokeWidth={2.5} /> Awaiting Confirmation
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={isPaying}
                                                onClick={() => onPay(expense)}
                                                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-[9px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-md transition-all shadow-sm shadow-primary/20 active:scale-95 border-none"
                                            >
                                                {isPaying ? 'Processing...' : 'Pay'}
                                            </button>
                                        )}
                                    </div>
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

export default DebtsToSettleCard;