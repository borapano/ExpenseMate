import React from 'react';
import {
    Receipt, Calendar, User, ShoppingBag,
    Coffee, Car, Home, Wrench, HelpCircle, Edit3, Trash2
} from 'lucide-react';

const ExpenseList = ({ expenses, currentUserId, onEdit, onDelete, isLoading }) => {
    // Debug log to track what is being received
    console.log("Activity Feed Data:", expenses);

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Ushqim': return <Coffee className="text-orange-500" size={20} />;
            case 'Transport': return <Car className="text-blue-500" size={20} />;
            case 'Qira': return <Home className="text-purple-500" size={20} />;
            case 'Argëtim': return <ShoppingBag className="text-pink-500" size={20} />;
            case 'Fatura': return <Wrench className="text-red-500" size={20} />;
            default: return <HelpCircle className="text-gray-500" size={20} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 animate-pulse bg-slate-50 rounded-[2rem]">
                <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
                <div className="w-32 h-4 bg-slate-200 rounded mb-2"></div>
                <div className="w-24 h-3 bg-slate-200 rounded"></div>
            </div>
        );
    }

    // 1. Renditja: Primare nga created_date (data e futjes), me fallback tek expense_date
    const sortedExpenses = expenses && Array.isArray(expenses) 
        ? [...expenses].sort((a, b) => new Date(b?.created_date || b?.expense_date) - new Date(a?.created_date || a?.expense_date))
        : [];

    if (!sortedExpenses || sortedExpenses.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <Receipt className="text-slate-300 mx-auto mb-4" size={32} />
                <p className="text-slate-500 font-bold">Nuk ka ende shpenzime.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedExpenses && sortedExpenses.map((expense) => {
                if (!expense) return null;

                // ✅ RREGULLIMI KRITIK: Krahasojmë duke i kthyer të dyja në String dhe Lowercase
                const normalizedCurrentId = String(currentUserId || "").toLowerCase();
                const normalizedPayerId = String(expense?.payer_id || "").toLowerCase();

                const isPayer = normalizedPayerId === normalizedCurrentId;

                const participants = expense?.participants || [];

                // ✅ RREGULLIMI PËR "SKE PJESË"
                const myParticipation = participants.find(p =>
                    String(p?.user_id || "").toLowerCase() === normalizedCurrentId
                );

                const totalAmount = Number(expense?.amount || 0);
                const myShare = myParticipation ? Number(myParticipation?.share_amount || 0) : 0;

                let statusText = 'Ske pjesë';
                let statusColor = 'text-slate-400';

                if (isPayer) {
                    // Nëse unë pagova 10€ dhe pjesa ime ishte 2€, do marr 8€ mbrapsht
                    const toReceive = totalAmount - myShare;
                    statusText = `Ti merr: €${toReceive.toFixed(2)}`;
                    statusColor = 'text-emerald-500';
                } else if (myParticipation) {
                    statusText = `Detyrohesh: €${myShare.toFixed(2)}`;
                    statusColor = 'text-rose-500';
                }

                return (
                    <div
                        key={expense?.id || Math.random()}
                        className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between relative z-10">

                            {/* LEFT SIDE */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    {getCategoryIcon(expense?.category)}
                                </div>

                                <div>
                                    <h4 className="font-black text-slate-800 text-sm mb-1">
                                        {expense?.description || "Pa përshkrim"}
                                    </h4>

                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                            <User size={12} />
                                            {isPayer ? "Ti pagove" : (expense?.payer_name || "Anëtar")}
                                        </span>

                                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                            <Calendar size={12} />
                                            {expense?.expense_date ? new Date(expense.expense_date).toLocaleDateString('sq-AL', {
                                                day: '2-digit',
                                                month: 'short'
                                            }) : "Data panjohur"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-sm font-black text-slate-900">
                                        €{totalAmount.toFixed(2)}
                                    </div>
                                    <div className={`text-[10px] font-black mt-0.5 uppercase ${statusColor}`}>
                                        {statusText}
                                    </div>
                                </div>

                                {/* EDIT/DELETE - Vetëm për krijuesin */}
                                <div className="flex items-center gap-1 border-l border-slate-100 pl-3 min-w-[60px] justify-end">
                                    {isPayer && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit && onEdit(expense); }}
                                                className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(expense?.id); }}
                                                className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* LIST OF PARTICIPANTS */}
                        {participants.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-50 relative z-10 flex flex-wrap gap-2">
                                {participants.map((p, idx) => (
                                    <div key={idx} className="text-[10px] font-medium bg-slate-50 px-2 py-1 rounded text-slate-500 border border-slate-100 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        {p?.user_name || "Unknown"} <span className="font-bold text-slate-700">€{Number(p?.share_amount || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SHIRITI ANASH (STATUS INDICATOR) */}
                        <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${isPayer ? 'bg-emerald-400' : myParticipation ? 'bg-rose-400' : 'bg-slate-200'
                                }`}
                        ></div>
                    </div>
                );
            })}
        </div>
    );
};

export default ExpenseList;