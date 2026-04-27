import React from 'react';
import { Wallet, TrendingUp } from 'lucide-react';

const TotalSpentCard = ({ amount, previousMonthAmount }) => {
    // Formatimi i vlerës monetare
    const formattedAmount = `€${amount.toLocaleString('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                    Total Spent This Month
                </span>
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <Wallet size={16} />
                </div>
            </div>

            <p className="text-2xl font-black text-primary tracking-tight">
                {formattedAmount}
            </p>

            {previousMonthAmount != null && (
                <p className="text-xs text-secondary/70 font-semibold flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-500" />
                    {`VS €${previousMonthAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Last Month`}
                </p>
            )}
        </div>
    );
};

export default TotalSpentCard;