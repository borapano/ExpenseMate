import React, { useMemo } from 'react';
import { ShieldCheck, Check, X, Clock } from 'lucide-react';

interface Props {
    requests: any[];
    expectedPayments: any[];
    onConfirm: (id: string) => void;
    onReject: (id: string) => void;
}

const PendingRequestsCard: React.FC<Props> = ({ requests, expectedPayments, onConfirm, onReject }) => {
    
    // Kombinimi i të dyja listave. Requests janë në krye, Expected Payments në fund.
    const combinedList = useMemo(() => {
        const reqs = requests.map(r => ({ ...r, type: 'request' }));
        // Expected payments që nuk janë plotësisht të mbuluara nga pending requests
        const expected = expectedPayments
            .filter(e => e.effective_amount > 0)
            .map(e => ({ ...e, type: 'expected' }));
        return [...reqs, ...expected];
    }, [requests, expectedPayments]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col flex-1 h-[400px] transition-shadow duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-5 shrink-0">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                    Receivables
                </h2>
                <span className="text-[10px] bg-accent/20 text-primary font-bold px-3 py-1 rounded-full">
                    {combinedList.length} Items
                </span>
            </div>

            {combinedList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-secondary/40">
                    <ShieldCheck size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">All caught up!</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-1 pb-2">
                    {combinedList.map((item: any, idx) => {
                        if (item.type === 'request') {
                            return (
                                <div key={`req-${item.id}-${idx}`} className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col transition-colors hover:bg-emerald-50 shrink-0">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm font-bold text-primary">{item.sender_name || 'Sender'}</p>
                                            <p className="text-[10px] font-semibold text-secondary/70">in {item.group_name || 'Group'}</p>
                                        </div>
                                        <p className="text-sm font-black text-emerald-600">
                                            +€{Number(item.amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="mt-auto flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onConfirm(item.id)}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Check size={14} /> Accept
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onReject(item.id)}
                                            className="flex-1 bg-white border border-secondary/20 hover:bg-red-50 hover:text-red-500 text-secondary text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                        >
                                            <X size={14} /> Decline
                                        </button>
                                    </div>
                                </div>
                            );
                        } else {
                            // Expected payment
                            return (
                                <div key={`exp-${item.user_id}-${item.group_id}`} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between shrink-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-primary">{item.user_name || 'Anonymous'}</p>
                                            <p className="text-[10px] font-semibold text-secondary/70">in {item.group_name || 'Group'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-secondary/60">
                                                €{Number(item.effective_amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-[9px] font-bold text-amber-500 flex items-center justify-end gap-1 mt-0.5 uppercase tracking-wider">
                                                <Clock size={10} />
                                                Expected
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    })}
                </div>
            )}
        </div>
    );
};

export default PendingRequestsCard;