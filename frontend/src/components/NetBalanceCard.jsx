import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Euro } from 'lucide-react';
import api from '../api'; // Sigurohu që ky path është i saktë

const NetBalanceCard = () => {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                // Thirrja në endpoint-in që sapo shtuam në main.py
                const response = await api.get('/users/me/balance');

                // Sigurohemi që marrim numër, jo null apo undefined
                const netValue = response.data?.net_balance ?? 0;
                setBalance(Number(netValue));
            } catch (error) {
                console.error("❌ Gabim në marrjen e balancës:", error);
                setBalance(0); // Në rast gabimi, shfaqim 0
            } finally {
                setLoading(false); // Ndalojmë loading në çdo rast
            }
        };

        fetchBalance();
    }, []);

    const isPositive = balance >= 0;

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

    // Formatimi sipas standardit shqiptar/europian
    const formattedValue = Math.abs(balance).toLocaleString('sq-AL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Nëse është duke u ngarkuar, shfaqim një skelet (shimmer) që të mos jetë blank
    if (loading) {
        return (
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm h-[280px] animate-pulse flex flex-col justify-center">
                <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
                <div className="h-12 w-48 bg-slate-100 rounded mb-4"></div>
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-secondary/5 shadow-sm hover:shadow-md transition-all duration-300 h-[280px] flex flex-col relative overflow-hidden group">

            {/* Background Icon */}
            <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 ${currentStyle.text}`}>
                <Euro size={200} />
            </div>

            <div className="relative z-10 flex flex-col gap-y-6 h-full justify-center">

                {/* 1. SEKTORI TOP */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-secondary/40 leading-none">
                        Balanca Totale Neto
                    </h4>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border w-fit ${currentStyle.bg} ${currentStyle.border}`}>
                        {isPositive ? (
                            <TrendingUp size={14} className={currentStyle.icon} />
                        ) : (
                            <TrendingDown size={14} className={currentStyle.icon} />
                        )}
                        <span className={`text-[10px] font-black uppercase italic ${currentStyle.text}`}>
                            {isPositive ? 'Për të marrë' : 'Për të dhënë'}
                        </span>
                    </div>
                </div>

                {/* 2. SEKTORI I MESIT */}
                <div className="flex items-baseline min-h-[60px]">
                    <span className={`text-5xl font-black tracking-tighter leading-none ${currentStyle.text}`}>
                        {isPositive ? '+' : '-'}{formattedValue}€
                    </span>
                </div>

                {/* 3. SEKTORI I POSHTEM */}
                <div className="pt-2">
                    <p className="text-[11px] text-secondary/40 font-bold uppercase tracking-[0.15em] leading-none italic">
                        Në të gjitha grupet
                    </p>
                </div>

            </div>
        </div>
    );
};

export default NetBalanceCard;