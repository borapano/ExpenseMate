import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import { CheckCircle, CreditCard } from "lucide-react";

const GroupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    // States për Settlements
    const [settleDebt, setSettleDebt] = useState(null);

    const { user: currentUser } = useAuth();

    const fetchGroupDetails = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await api.get(`/groups/${id}`);
            setGroup(res.data);
            setError(null);
        } catch (err) {
            console.error("API Error:", err.response);
            setError("Grupi nuk u gjet ose nuk keni akses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupDetails();
    }, [id]);

    // Funksionet e Settlement
    const handleSettleUp = async () => {
        if (!settleDebt) return;
        try {
            await api.post('/settlements/', {
                amount: settleDebt.amount,
                group_id: group.id,
                receiver_id: settleDebt.user_id
            });
            alert("Kërkesa u dërgua me sukses!");
            setSettleDebt(null);
            fetchGroupDetails();
        } catch (err) {
            alert("Gabim gjatë dërgimit të pagesës.");
        }
    };

    const handleConfirmRequest = async (settlementId) => {
        try {
            await api.patch(`/settlements/${settlementId}/confirm`);
            fetchGroupDetails();
        } catch (err) {
            alert("Gabim në konfirmim!");
        }
    };

    const handleRejectRequest = async (settlementId) => {
        try {
            await api.patch(`/settlements/${settlementId}/reject`);
            fetchGroupDetails();
        } catch (err) {
            alert("Gabim në refuzim!");
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm("Je i sigurt që dëshiron të fshish këtë shpenzim?")) return;
        try {
            await api.delete(`/expenses/${expenseId}`);
            fetchGroupDetails();
        } catch (err) {
            alert("Gabim gjatë fshirjes.");
        }
    };

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
        setShowExpenseModal(true);
    };

    // RENDITJA: Krijuesi i pari, pastaj të tjerët sipas emrit
    const sortedMembers = group?.members ? [...group.members].sort((a, b) => {
        if (a.user_id === group.creator_id) return -1;
        if (b.user_id === group.creator_id) return 1;
        return a.user_name.localeCompare(b.user_name);
    }) : [];

    if (loading) return <div className="p-8 text-center">Po ngarkohet...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            {/* KËRKESAT NË PRITJE (Kush më ka paguar) */}
            {group.pending_settlements && group.pending_settlements.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 shadow-sm mb-6">
                    <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-4">
                        <CheckCircle size={20} /> Konfirmo Pagesat e Ardhura
                    </h3>
                    <div className="space-y-3">
                        {group.pending_settlements.map(req => (
                            <div key={req.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-emerald-100">
                                <span className="font-medium">{req.sender_name} të ka dërguar <span className="text-emerald-600 font-bold">{req.amount}€</span></span>
                                <div className="space-x-3">
                                    <button onClick={() => handleConfirmRequest(req.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700">Konfirmo</button>
                                    <button onClick={() => handleRejectRequest(req.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600">Refuzo</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900">{group.name}</h1>
                    <p className="text-slate-500 mt-2">{group.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[500px]">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900">Historiku</h2>
                            <button
                                onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }}
                                className="bg-slate-900 text-white font-black px-6 py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"
                            >
                                + Shto Shpenzim
                            </button>
                        </div>
                        <ExpenseList
                            expenses={group?.expenses}
                            currentUserId={currentUser.id}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteExpense}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* BORXHET E MIA */}
                    {group.my_debts && group.my_debts.length > 0 && (
                        <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 shadow-sm">
                            <h3 className="text-xl font-black text-red-900 mb-6 flex items-center gap-2">
                                <CreditCard size={24} /> Borxhet e Mia
                            </h3>
                            <div className="space-y-4">
                                {group.my_debts.map(debt => (
                                    <div key={debt.user_id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-red-50">
                                        <div>
                                            <p className="font-bold text-slate-800">{debt.user_name}</p>
                                            <p className="text-sm text-red-600 font-black">{debt.amount}€</p>
                                        </div>
                                        <button
                                            onClick={() => setSettleDebt(debt)}
                                            className="bg-red-500 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-600 transition"
                                        >
                                            Paguaj
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 mb-6">Anëtarët</h2>
                        <ul className="space-y-4">
                            {sortedMembers.map((m) => (
                                <li key={m.user_id} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
                                        {m.user_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">
                                            {m.user_name} {m.user_id === currentUser.id && "(Ti)"}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {showExpenseModal && (
                <ExpenseForm
                    group={group}
                    expenseToEdit={editingExpense}
                    onClose={() => setShowExpenseModal(false)}
                    onSuccess={() => { setShowExpenseModal(false); fetchGroupDetails(); }}
                />
            )}

            {/* MODALI I KONFIRMIT TË PAGESËS */}
            {settleDebt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-[90%] max-w-sm">
                        <h3 className="text-2xl font-black text-slate-900 mb-4">Konfirmo Pagesën</h3>
                        <p className="text-slate-600 mb-8 font-medium">
                            A po i dërgon kërkesë pagese prej <span className="font-black text-indigo-600">{settleDebt.amount}€</span> përdoruesit <span className="font-black">{settleDebt.user_name}</span>?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setSettleDebt(null)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Anulo</button>
                            <button onClick={handleSettleUp} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700">Paguaj</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetails;