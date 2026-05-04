import React from 'react';
import { TrendingUp } from 'lucide-react';

interface Props {
    totalToReceive: number;
    pendingReceived: number;
}

const fmt = (v: number) =>
    `€${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ToReceiveCard: React.FC<Props> = ({ totalToReceive, pendingReceived }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary/10 flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

        <p className="text-[10px] font-black uppercase tracking-widest text-secondary/50">
            To Receive
        </p>

        <div>
            <p className="text-3xl font-black text-emerald-600 tracking-tight leading-none">
                {fmt(totalToReceive)}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/40 mt-1 flex items-center gap-1">
                <TrendingUp size={11} /> Total Active Receivables
            </p>
        </div>

        {pendingReceived > 0.005 ? (
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-[11px] font-black text-amber-500 tracking-wide">
                    {fmt(pendingReceived)} Awaiting Your Confirmation
                </p>
            </div>
        ) : (
            <p className="text-[11px] font-semibold text-secondary/30 tracking-wide">
                No awaiting your confirmation
            </p>
        )}
    </div>
);

export default ToReceiveCard;