import React from 'react';
import { CreditCard } from 'lucide-react';

const BudgetProgressCard = ({ spentAmount, totalBudget }) => {
    // Guard kundër pjesëtimit me 0
    const safeBudget = Number(totalBudget) > 0 ? Number(totalBudget) : 0;
    const safeSpent = Number(spentAmount) || 0;

    // Përqindja reale (mund të kalojë 100%)
    const budgetPct = safeBudget > 0
        ? Math.round((safeSpent / safeBudget) * 100)
        : 0;

    // Width-i i bar-it kufizohet në 100% (fizikisht s'mund të kalojë)
    const barWidth = Math.min(100, budgetPct);

    const getBarColor = (pct) => {
        if (pct >= 100) return '#EF4444';   // 100%+ → e kuqe
        if (pct >= 76) return '#F59E0B';    // 76-99% → amber-500 (si "Awaiting Confirmation")
        return '#1A3263';                    // 0-75% → navy (default)
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                    Budget Progress
                </span>
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <CreditCard size={16} />
                </div>
            </div>

            <p className="text-2xl font-black text-primary">{budgetPct}%</p>

            <div className="w-full bg-surface/60 rounded-full h-2.5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${barWidth}%`,
                        background: getBarColor(budgetPct),
                    }}
                />
            </div>

            <p className="text-[10px] text-secondary/60 font-semibold">
                €{safeSpent.toLocaleString('en')} / €{safeBudget.toLocaleString('en')}
            </p>
        </div>
    );
};

export default BudgetProgressCard;