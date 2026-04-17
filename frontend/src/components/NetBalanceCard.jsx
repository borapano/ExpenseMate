import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const NetBalanceCard = ({ data }) => {
    const netValue = Number(data?.net_balance || 0);
    const isPositive = netValue >= 0;

    const styles = {
        positive: {
            text: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            icon: 'text-emerald-500'
        },
        negative: {
            text: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            icon: 'text-red-500'
        }
    };

    const currentStyle = isPositive ? styles.positive : styles.negative;

    // Formatimi i numrit me presje per mijeshet (psh. 1,250.50)
    const formattedValue = Math.abs(netValue).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-secondary/5 shadow-sm hover:shadow-md transition-all duration-300 h-[280px] flex flex-col relative overflow-hidden group">

            {/* Background Icon - e pozicionuar qe te mos interferoje me shifrat e gjata */}
            <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 ${currentStyle.text}`}>
                <DollarSign size={200} />
            </div>

            {/* Containeri kryesor me gap te barabarte vertikal */}
            <div className="relative z-10 flex flex-col gap-y-6 h-full justify-center">

                {/* 1. SEKTORI I TOP (Label dhe Badge) */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-secondary/40 leading-none">
                        Total Net Balance
                    </h4>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border w-fit ${currentStyle.bg} ${currentStyle.border}`}>
                        {isPositive ? (
                            <TrendingUp size={14} className={currentStyle.icon} />
                        ) : (
                            <TrendingDown size={14} className={currentStyle.icon} />
                        )}
                        <span className={`text-[10px] font-black uppercase italic ${currentStyle.text}`}>
                            {isPositive ? 'In Profit' : 'In Debt'}
                        </span>
                    </div>
                </div>

                {/* 2. SEKTORI I MESIT (Shifra kryesore) */}
                <div className="flex items-baseline min-h-[60px]">
                    {/* text-5xl eshte perfekt per vlerat 1,000.00$ - nuk del jashte bordit horizontal */}
                    <span className={`text-5xl font-black tracking-tighter leading-none ${currentStyle.text}`}>
                        {isPositive ? '+' : '-'}{formattedValue}$
                    </span>
                </div>

                {/* 3. SEKTORI I POSHTEM (Info shtese) */}
                <div className="pt-2">
                    <p className="text-[11px] text-secondary/40 font-bold uppercase tracking-[0.15em] leading-none italic">
                        Across all linked groups
                    </p>
                </div>

            </div>
        </div>
    );
};

export default NetBalanceCard;