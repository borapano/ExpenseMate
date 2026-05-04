import React from 'react';

const MonthlyGraphCard = ({ data }) => {
    const rawData = Array.isArray(data?.monthly_data) && data.monthly_data.length > 0
        ? data.monthly_data
        : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const chartData = rawData.slice(-10);
    const monthlyTotal = Number(data?.monthly_spend || 0);

    // Guard: Math.max(...[]) → -Infinity; use 1 as floor to avoid NaN heights
    const maxVal = Math.max(...chartData, 1);

    return (
        <div className="bg-white p-9 rounded-[2.5rem] border border-secondary/5 shadow-sm hover:shadow-md transition-all duration-300 h-[280px] flex flex-col justify-between relative overflow-hidden group">

            {/* Header i Grafikut */}
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-secondary/40 leading-none">
                            Spending Analysis
                        </h4>
                        <span className="text-2xl font-black text-primary tracking-tighter block">
                            Last 10 Days
                        </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">
                            Total Spend
                        </span>
                        <div className="px-4 py-2 rounded-full bg-accent/10 border border-accent/20 shadow-sm">
                            <span className="text-sm font-black text-accent">
                                €{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zona e Grafikut */}
            <div className="relative z-10 h-28 w-full flex items-end gap-4 px-2 mt-4">
                {chartData.map((val, i) => {
                    const heightPercentage = maxVal > 0 ? (val / maxVal) * 100 : 10;
                    return (
                        <div key={i} className="flex-1 group/bar relative flex flex-col items-center h-full justify-end">
                            {/* SHTYLLAT: Përdorim ngjyrën Accent të pastër nga paleta jonë */}
                            <div
                                className="w-full bg-[#EBB16D] rounded-t-xl transition-all duration-500 group-hover/bar:bg-[#F4C48E] group-hover/bar:shadow-[0_4px_20px_rgba(235,177,109,0.4)]"
                                style={{ height: `${heightPercentage}%` }}
                            ></div>

                            {/* Kutiza e vlerës (Tooltip) poshtë */}
                            <div className="absolute -bottom-8 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 bg-primary text-accent text-[9px] font-black px-2 py-1 rounded-md shadow-lg translate-y-[-4px] group-hover/bar:translate-y-0 z-20 whitespace-nowrap">€{val}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legjenda e poshtme */}
            <div className="relative z-10 flex justify-between items-center border-t border-secondary/5 pt-8 mt-2">
                <span className="text-[9px] font-bold text-secondary/30 uppercase tracking-[0.2em]">10 Days Ago</span>
                <div className="flex gap-1.5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-1 w-1 bg-secondary/10 rounded-full"></div>
                    ))}
                </div>
                <span className="text-[9px] font-bold text-secondary/30 uppercase tracking-[0.2em]">Today</span>
            </div>
        </div>
    );
};

export default MonthlyGraphCard;