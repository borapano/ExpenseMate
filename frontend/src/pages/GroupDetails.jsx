import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import DebtList from '../components/DebtList';
import { CheckCircle, AlertCircle } from 'lucide-react';

const GroupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Inline action error banner (replaces alert() calls)
    const [actionError, setActionError] = useState(null);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const { user: currentUser } = useAuth();

    const showActionError = (msg) => {
        setActionError(msg);
        setTimeout(() => setActionError(null), 4000);
    };

    const fetchGroupDetails = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await api.get(`/groups/${id}`);
            setGroup(res.data);
            setError(null);
        } catch (err) {
            console.error('[GroupDetails] API Error:', err.response);
            setError('Grupi nuk u gjet ose nuk keni akses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupDetails();
    }, [id]);

    const handleConfirmRequest = async (settlementId) => {
        try {
            await api.patch(`/settlements/${settlementId}/confirm`);
            fetchGroupDetails();
        } catch (err) {
            showActionError('Gabim në konfirmim të pagesës.');
        }
    };

    const handleRejectRequest = async (settlementId) => {
        try {
            await api.patch(`/settlements/${settlementId}/reject`);
            fetchGroupDetails();
        } catch (err) {
            showActionError('Gabim në refuzim të pagesës.');
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm('Je i sigurt që dëshiron të fshish këtë shpenzim?')) return;
        try {
            await api.delete(`/expenses/${expenseId}`);
            fetchGroupDetails();
        } catch (err) {
            showActionError('Gabim gjatë fshirjes së shpenzimit.');
        }
    };

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
        setShowExpenseModal(true);
    };

    // Creator first, then others alphabetically
    const sortedMembers = group?.members
        ? [...group.members].sort((a, b) => {
              if (String(a.user_id) === String(group.creator_id)) return -1;
              if (String(b.user_id) === String(group.creator_id)) return 1;
              return a.user_name.localeCompare(b.user_name);
          })
        : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                    <div className="w-32 h-3 rounded-full bg-slate-200" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">

            {/* ── Inline action error banner ── */}
            {actionError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl shadow-sm">
                    <AlertCircle size={18} className="shrink-0" />
                    <span className="text-sm font-semibold">{actionError}</span>
                </div>
            )}

            {/* ── Incoming pending settlements (others have sent me payment) ── */}
            {group.pending_settlements && group.pending_settlements.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-4">
                        <CheckCircle size={20} /> Konfirmo Pagesat e Ardhura
                    </h3>
                    <div className="space-y-3">
                        {group.pending_settlements.map(req => (
                            <div key={req.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-emerald-100">
                                <span className="font-medium">
                                    {req.sender_name} të ka dërguar{' '}
                                    <span className="text-emerald-600 font-bold">{req.amount}€</span>
                                </span>
                                <div className="space-x-3">
                                    <button
                                        onClick={() => handleConfirmRequest(req.id)}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
                                    >
                                        Konfirmo
                                    </button>
                                    <button
                                        onClick={() => handleRejectRequest(req.id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
                                    >
                                        Refuzo
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Group header ── */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900">{group.name}</h1>
                    <p className="text-slate-500 mt-2">{group.description}</p>
                </div>
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Expense history */}
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

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* ── My debts — uses DebtList for consistent optimistic UI ── */}
                    {group.my_debts && group.my_debts.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <DebtList
                                debts={group.my_debts}
                                groupId={String(group.id)}
                                onRefresh={fetchGroupDetails}
                            />
                        </div>
                    )}

                    {/* Members */}
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
                                            {m.user_name}{' '}
                                            {String(m.user_id) === String(currentUser.id) && (
                                                <span className="text-indigo-500">(Ti)</span>
                                            )}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Expense form modal */}
            {showExpenseModal && (
                <ExpenseForm
                    group={group}
                    expenseToEdit={editingExpense}
                    onClose={() => setShowExpenseModal(false)}
                    onSuccess={() => { setShowExpenseModal(false); fetchGroupDetails(); }}
                />
            )}
        </div>
    );
};

export default GroupDetails;