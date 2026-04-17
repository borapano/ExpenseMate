import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Euro } from 'lucide-react';
import axios from 'axios'; // Sigurohu që ke axios të instaluar

const NetBalanceCard = ({ currentUserId }) => {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                // Thirrja në Backend (përshtat URL-në nëse është ndryshe)
                // Supozojmë se ke një endpoint që llogarit balancën totale të përdoruesit
                const response = await axios.get(`http://localhost:8000/users/${currentUserId}/balance`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                // Backend duhet të kthejë një objekt psh: { "net_balance": 150.50 }
                setBalance(Number(response.data.net_balance || 0));
            } catch (error) {
                console.error("Gabim në marrjen e balancës:", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) {
            fetchBalance();
        }
    }, [currentUserId]);

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

    // Formatimi i numrit në Euro (psh. 1.250,50 €)
    const formattedValue = Math.abs(balance).toLocaleString('sq-AL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (loading) {
        return <div className="h-[280px] bg-slate-50 animate-pulse rounded-[2.5rem]" />;
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-secondary/5 shadow-sm hover:shadow-md transition-all duration-300 h-[280px] flex flex-col relative overflow-hidden group">

            {/* Background Icon - Ndryshuar në Euro */}
            <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 ${currentStyle.text}`}>
                <Euro size={200} />
            </div>

            <div className="relative z-10 flex flex-col gap-y-6 h-full justify-center">

                {/* 1. SEKTORI I TOP */}
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

                {/* 2. SEKTORI I MESIT - Ndryshuar në € */}
                <div className="flex items-baseline min-h-[60px]">
                    <span className={`text-5xl font-black tracking-tighter leading-none ${currentStyle.text}`}>
                        {isPositive ? '+' : '-'}{formattedValue}€
                    </span>
                </div>

                {/* 3. SEKTORI I POSHTEM */}
                <div className="pt-2">
                    <p className="text-[11px] text-secondary/40 font-bold uppercase tracking-[0.15em] leading-none italic">
                        Në të gjitha grupet e lidhura
                    </p>
                </div>

            </div>
        </div>
    );
};

export default NetBalanceCard;