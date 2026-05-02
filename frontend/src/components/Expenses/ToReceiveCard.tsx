import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';

/*
 * ToReceiveCard — Summary of money owed TO the current user.
 *
 * "Sum of others' shares in ExpenseParticipant where I am the expense.payer_id and is_settled == False."
 */

interface Props {
    totalToReceive: number;
    pendingReceived: number;
}

const fmt = (v: number) =>
    `$${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

        {pendingReceived > 0.005 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <Clock size={14} className="text-amber-500 shrink-0" />
                <div>
                    <p className="text-[13px] font-black text-amber-600 leading-none">{fmt(pendingReceived)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400 mt-0.5">
                        Awaiting Your Confirmation
                    </p>
                </div>
            </div>
        )}
    </div>
);

export default ToReceiveCard;
