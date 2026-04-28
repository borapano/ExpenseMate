import React from 'react';
import { Clock } from 'lucide-react';

interface Props {
    amount: number;
    effectiveAmount?: number;
    pendingAmount?: number;
}

const ToPayCard: React.FC<Props> = ({ amount, effectiveAmount = amount, pendingAmount = 0 }) => {
    // Formatimi i vlerës monetare
    const formattedAmount = `€${effectiveAmount.toLocaleString('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const formattedPending = `€${pendingAmount.toLocaleString('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col gap-2 relative overflow-hidden h-full transition-shadow duration-200 hover:shadow-md cursor-default">
            {/* Sfondi dekorativ në cep (red për To Pay) */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />

            <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                To Pay
            </p>

            <div className="flex flex-col gap-1">
                <p className="text-3xl font-black text-red-600 tracking-tight">
                    {formattedAmount}
                </p>
                <p className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Clock size={12} />
                    {formattedPending} in verification
                </p>
            </div>

            <p className="text-[10px] text-secondary/50 font-bold mt-1">
                Total owed across groups
            </p>
        </div>
    );
};

export default ToPayCard;