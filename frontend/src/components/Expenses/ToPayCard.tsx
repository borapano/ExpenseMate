import React from 'react';
import { TrendingDown } from 'lucide-react';

interface Props {
    totalToPay: number;
    pendingSent: number;
}

const fmt = (v: number) =>
    `$${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ToPayCard: React.FC<Props> = ({ totalToPay, pendingSent }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary/10 flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/5 rounded-bl-full pointer-events-none" />

        <p className="text-[10px] font-black uppercase tracking-widest text-secondary/50">
            To Pay
        </p>

        <div>
            <p className="text-3xl font-black text-red-600 tracking-tight leading-none">
                {fmt(totalToPay)}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/40 mt-1 flex items-center gap-1">
                <TrendingDown size={11} /> Total Active Debts
            </p>
        </div>

        {pendingSent > 0.005 ? (
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-[11px] font-black text-amber-500 tracking-wide">
                    {fmt(pendingSent)} Pending Confirmation
                </p>
            </div>
        ) : (
            <p className="text-[11px] font-semibold text-secondary/30 tracking-wide">
                No pending confirmation
            </p>
        )}
    </div>
);

export default ToPayCard;