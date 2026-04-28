import React from 'react';
import { CreditCard } from 'lucide-react';

const BudgetProgressCard = ({ spentAmount, totalBudget }) => {
    const budgetPct = Math.round((spentAmount / totalBudget) * 100);

    // Përcaktimi i ngjyrës së bar-it bazuar në përqindjen
    const getBarColor = (pct) => {
        if (pct > 80) return '#EF4444'; // Kuqe (Rrezik)
        if (pct > 60) return '#FFC570'; // Portokalli (Kujdes)
        return '#1A3263'; // Blu (Normal)
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                    Budget Progress
                </span>
                <CreditCard size={16} className="text-primary" />
            </div>

            <p className="text-2xl font-black text-primary">{budgetPct}%</p>

            <div className="w-full bg-surface/60 rounded-full h-2.5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${budgetPct}%`,
                        background: getBarColor(budgetPct),
                    }}
                />
            </div>

            <p className="text-[10px] text-secondary/60 font-semibold">
                €{spentAmount.toLocaleString('en')} / €{totalBudget.toLocaleString('en')}
            </p>
        </div>
    );
};

export default BudgetProgressCard;