import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Euro, Minus } from 'lucide-react';
import api from '../api';

const NetBalanceCard = () => {
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await api.get('/users/me/balance');
                const netValue = response.data?.net_balance ?? 0;
                setBalance(Number(netValue));
            } catch (error) {
                console.error("❌ Error fetching balance:", error);
                setBalance(0);
            }
        };
        fetchBalance();
    }, []);

    const isPositive = balance > 0;
    const isNegative = balance < 0;
    const isZero = balance === 0;

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

    const formattedValue = Math.abs(balance).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        /* Ndryshuar pl-10 ne pl-7 për të pakësuar hapësirën majtas */
        <div className="bg-white rounded-[2.5rem] pt-10 pb-10 pr-10 pl-7 border border-secondary/5 shadow-sm hover:shadow-md transition-all duration-300 h-[280px] flex flex-col relative overflow-hidden group">

            {/* Background Decor Icon */}
            <div className={`absolute -right-8 -bottom-8 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 ${currentStyle.text}`}>
                <Euro size={240} />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between italic">

                {/* 1. TOP SECTION */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/30 leading-none not-italic">
                        Total Net Balance
                    </h4>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border w-fit shadow-sm ${currentStyle.bg} ${currentStyle.border}`}>
                        {isPositive ? <TrendingUp size={14} className={currentStyle.icon} /> :
                            isNegative ? <TrendingDown size={14} className={currentStyle.icon} /> :
                                <Minus size={14} className={currentStyle.icon} />}

                        <span className={`text-[10px] font-black uppercase tracking-tight ${currentStyle.text}`}>
                            {currentStyle.label}
                        </span>
                    </div>
                </div>

                {/* 2. MIDDLE SECTION */}
                <div className="flex items-center py-2 overflow-visible">
                    <span className={`text-4xl sm:text-[2.75rem] font-black tracking-tighter transition-all duration-300 ${currentStyle.text}`}>
                        {isPositive ? '+' : isNegative ? '-' : ''}€{formattedValue}
                    </span>
                </div>

                {/* 3. BOTTOM SECTION */}
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