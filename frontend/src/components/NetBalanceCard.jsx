import React from 'react';
import { TrendingUp, TrendingDown, Euro, Minus } from 'lucide-react';
import { useData } from '../DataContext';

/**
 * NetBalanceCard — displays the user's overall net financial position.
 *
 * Sources balance from DataContext (settlementDashboard) instead of making
 * an independent API call. This ensures the card auto-updates whenever any
 * settlement action triggers refreshAllData() in the context.
 *
 * Net balance = total_owed_to_me − total_gross_debt
 */
const NetBalanceCard = () => {
    const { settlementDashboard, loading } = useData();

    // Derive net balance from the settlement dashboard aggregates.
    // Both values default to 0 so NaN is impossible.
    const owedToMe   = Number(settlementDashboard?.total_owed_to_me  ?? 0);
    const iOwe       = Number(settlementDashboard?.total_gross_debt   ?? 0);
    const balance    = owedToMe - iOwe;

    const isPositive = balance > 0.005;
    const isNegative = balance < -0.005;

    const getStyles = () => {
        if (isPositive) return {
            text: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100/50',
            icon: 'text-emerald-500',
            label: 'You are owed'
        };
        if (isNegative) return {
            text: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100/50',
            icon: 'text-red-500',
            label: 'You owe'
        };
        return {
            text: 'text-slate-400',
            bg: 'bg-slate-50',
            border: 'border-slate-100',
            icon: 'text-slate-400',
            label: 'Settled up'
        };
    };

    const currentStyle = getStyles();

    const formattedValue = Math.abs(balance).toLocaleString('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        <div className="bg-white rounded-[2.5rem] pt-10 pb-10 pr-10 pl-7 border border-secondary/5 shadow-sm hover:shadow-md transition-all duration-300 h-[280px] flex flex-col relative overflow-hidden group">

            {/* Background decor */}
            <div className={`absolute -right-8 -bottom-8 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 ${currentStyle.text}`}>
                <Euro size={240} />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between italic">

                {/* Top section */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/30 leading-none not-italic">
                        Total Net Balance
                    </h4>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border w-fit shadow-sm ${currentStyle.bg} ${currentStyle.border}`}>
                        {isPositive
                            ? <TrendingUp  size={14} className={currentStyle.icon} />
                            : isNegative
                                ? <TrendingDown size={14} className={currentStyle.icon} />
                                : <Minus size={14} className={currentStyle.icon} />}
                        <span className={`text-[10px] font-black uppercase tracking-tight ${currentStyle.text}`}>
                            {currentStyle.label}
                        </span>
                    </div>
                </div>

                {/* Amount */}
                <div className="flex items-center py-2 overflow-visible">
                    {loading ? (
                        <div className="w-32 h-10 bg-slate-100 rounded-xl animate-pulse" />
                    ) : (
                        <span className={`text-4xl sm:text-[2.75rem] font-black tracking-tighter transition-all duration-300 ${currentStyle.text}`}>
                            {isPositive ? '+' : isNegative ? '-' : ''}€{formattedValue}
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-2">
                    <p className="text-[11px] text-secondary/40 font-bold uppercase tracking-[0.2em] leading-none not-italic">
                        Across all your groups
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NetBalanceCard;