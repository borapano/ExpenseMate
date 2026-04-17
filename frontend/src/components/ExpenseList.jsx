import React from 'react';
import {
    Receipt, Calendar, User, ShoppingBag,
    Coffee, Car, Home, Wrench, HelpCircle, Edit3, Trash2
} from 'lucide-react';

const ExpenseList = ({ expenses, currentUserId, onEdit, onDelete }) => {

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

    // 1. Renditja: Primare nga created_date (data e futjes), me fallback tek expense_date
    const sortedExpenses = [...expenses].sort((a, b) =>
        new Date(b.created_date || b.expense_date) - new Date(a.created_date || a.expense_date)
    );

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
            {sortedExpenses.map((expense) => {

                // ✅ RREGULLIMI KRITIK: Krahasojmë duke i kthyer të dyja në String dhe Lowercase
                const normalizedCurrentId = String(currentUserId || "").toLowerCase();
                const normalizedPayerId = String(expense.payer_id || "").toLowerCase();

                const isPayer = normalizedPayerId === normalizedCurrentId;

                const participants = expense.participants || [];

                // ✅ RREGULLIMI PËR "SKE PJESË"
                const myParticipation = participants.find(p =>
                    String(p.user_id || "").toLowerCase() === normalizedCurrentId
                );

                const totalAmount = Number(expense.amount || 0);
                const myShare = myParticipation ? Number(myParticipation.share_amount || 0) : 0;

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
                        key={expense.id}
                        className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between relative z-10">

                            {/* LEFT SIDE */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    {getCategoryIcon(expense.category)}
                                </div>

                                <div>
                                    <h4 className="font-black text-slate-800 text-sm mb-1">
                                        {expense.description}
                                    </h4>

                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                            <User size={12} />
                                            {isPayer ? "Ti pagove" : (expense.payer_name || "Anëtar")}
                                        </span>

                                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                            <Calendar size={12} />
                                            {new Date(expense.expense_date).toLocaleDateString('sq-AL', {
                                                day: '2-digit',
                                                month: 'short'
                                            })}
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
                                                onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                                                className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                                                className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

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