import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const FinancialHealthCard = ({ data }) => {
    // Logjika e sinkronizuar me backend (Balance model)
    const owedToYou = Number(data?.total_owed_to_you || 0);
    const youOwe = Number(data?.total_you_owe || 0);

    // Llogaritja për progress bar
    const totalFlow = owedToYou + Math.abs(youOwe);
    const healthPercentage = totalFlow === 0 ? 50 : (owedToYou / totalFlow) * 100;

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-secondary/5 h-[180px] flex flex-col justify-between group hover:shadow-md transition-all duration-300 overflow-hidden relative">

            {/* HEADER SEKSIONI */}
            <div className="relative z-10">
                <div className="space-y-1">
                    <h4 className="font-bold text-[10px] uppercase tracking-[0.25em] text-secondary/40 leading-none">
                        Financial Health
                    </h4>
                    <p className="text-[10px] text-secondary/30 font-medium italic">Status across all groups</p>
                </div>
            </div>

            {/* GRID I SHIFRAVE */}
            <div className="grid grid-cols-2 gap-8 relative z-10">
                {/* Seksioni: Të tjerët të kanë borxh */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                            <ArrowDownLeft size={12} className="text-emerald-600" />
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">
                            Owed to you
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-primary tracking-tighter">
                            {owedToYou.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$
                        </span>
                    </div>
                </div>

                {/* Seksioni: Ti u ke borxh */}
                <div className="space-y-2 border-l border-secondary/10 pl-6">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center border border-red-100/50">
                            <ArrowUpRight size={12} className="text-red-500" />
                        </div>
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-tight">
                            You owe
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-primary tracking-tighter">
                            {Math.abs(youOwe).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$
                        </span>
                    </div>
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="relative z-10">
                <div className="w-full h-1 bg-[#FAF9F6] rounded-full overflow-hidden border border-secondary/5">
                    <div
                        className={`h-full transition-all duration-1000 ease-out ${owedToYou >= Math.abs(youOwe) ? 'bg-emerald-500' : 'bg-red-400'}`}
                        style={{ width: `${healthPercentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default FinancialHealthCard;