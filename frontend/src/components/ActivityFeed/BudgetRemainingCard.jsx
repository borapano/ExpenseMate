import React from 'react';
import { TrendingDown } from 'lucide-react';

const BudgetRemainingCard = ({ remainingAmount, totalBudget, spentAmount }) => {
    // Guard kundër pjesëtimit me 0
    const safeBudget = Number(totalBudget) > 0 ? Number(totalBudget) : 0;
    const safeSpent = Number(spentAmount) || 0;
    const safeRemaining = Number(remainingAmount) || 0;

    // Përqindja reale e përdorur (mund të kalojë 100%)
    const budgetPct = safeBudget > 0
        ? Math.round((safeSpent / safeBudget) * 100)
        : 0;

    // Gjendjet kryesore
    const isOver = safeRemaining < 0;                          // > 100%
    const isDepleted = safeRemaining === 0 && safeBudget > 0;  // = 100%
    const overspentBy = Math.abs(safeRemaining);

    // Numri kryesor (sa €) — kuq vetëm kur ka mbaruar ose është mbi
    const numberColor = (isOver || isDepleted) ? 'text-red-500' : 'text-primary';

    // Subteksti i poshtëm
    const renderSubtext = () => {
        if (safeBudget === 0) {
            return <span>No budget set</span>;
        }
        if (isOver) {
            return (
                <span className="text-red-500">
                    €{overspentBy.toLocaleString('en', { minimumFractionDigits: 2 })} over monthly budget
                </span>
            );
        }
        if (isDepleted) {
            return <span className="text-red-500">No budget left this month</span>;
        }
        return <span>{budgetPct}% of €{safeBudget.toLocaleString('en')} used</span>;
    };

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

            <p className={`text-2xl font-black tracking-tight ${numberColor}`}>
                {isOver ? '-' : ''}€{(isOver ? overspentBy : safeRemaining)
                    .toLocaleString('en', { minimumFractionDigits: 2 })}
            </p>

            <p className="text-xs text-secondary/70 font-semibold flex items-center gap-1">
                <TrendingDown size={12} className="text-red-500" />
                {renderSubtext()}
            </p>
        </div>
    );
};

export default BudgetRemainingCard;