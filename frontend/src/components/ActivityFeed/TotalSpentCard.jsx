import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TotalSpentCard = ({ amount, previousMonthAmount }) => {
    const formattedAmount = `€${amount.toLocaleString('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const diff = amount - (previousMonthAmount ?? 0);
    const isHigher = diff > 0.005;
    const isLower = diff < -0.005;

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
                <p className={`text-xs font-semibold flex items-center gap-1 ${isHigher ? 'text-red-500' : isLower ? 'text-emerald-500' : 'text-secondary/50'
                    }`}>
                    {isHigher ? <TrendingUp size={12} /> : isLower ? <TrendingDown size={12} /> : <Minus size={12} />}
                    {`VS €${previousMonthAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Last Month`}
                </p>
            )}
        </div>
    );
};

export default TotalSpentCard;