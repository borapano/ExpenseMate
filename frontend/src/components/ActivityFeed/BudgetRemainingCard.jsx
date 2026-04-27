import React from 'react';
import { TrendingDown } from 'lucide-react';

const BudgetRemainingCard = ({ remainingAmount, totalBudget, spentAmount }) => {
    // Llogaritja e përqindjes së përdorur
    const budgetPct = Math.round((spentAmount / totalBudget) * 100);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                    Budget Remaining
                </span>
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <TrendingDown size={16} />
                </div>
            </div>

            <p className="text-2xl font-black text-primary tracking-tight">
                €{remainingAmount.toLocaleString('en', { minimumFractionDigits: 2 })}
            </p>

            <p className="text-xs text-secondary/70 font-semibold flex items-center gap-1">
                <TrendingDown size={12} className="text-danger" />
                {budgetPct}% of €{totalBudget.toLocaleString('en')} used
            </p>
        </div>
    );
};

export default BudgetRemainingCard;