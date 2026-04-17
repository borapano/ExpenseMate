import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

const GroupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

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

    // RENDITJA: Krijuesi i pari, pastaj të tjerët sipas emrit
    const sortedMembers = group?.members ? [...group.members].sort((a, b) => {
        if (a.user_id === group.creator_id) return -1;
        if (b.user_id === group.creator_id) return 1;
        return a.user_name.localeCompare(b.user_name);
    }) : [];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(group?.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { console.error("Copy failed"); }
    };

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm("A jeni të sigurt?")) return;
        try {
            await api.delete(`/expenses/${expenseId}`);
            fetchGroupDetails();
        } catch (err) {
            alert("Dështoi fshirja.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 text-xs font-black uppercase mb-6 hover:text-indigo-600">
                        ← Dashboard
                    </button>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <span className="text-2xl font-black">{group?.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{group?.name}</h1>
                                <p className="text-slate-500 text-sm">{group?.description || "Pa përshkrim."}</p>
                            </div>
                        </div>
                        <div onClick={copyToClipboard} className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl cursor-pointer hover:bg-white transition-all relative">
                            <p className="text-[10px] font-black uppercase text-slate-400">Kodi</p>
                            <p className="text-lg font-mono font-black text-indigo-600 tracking-widest">{group?.code}</p>
                            {copied && <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-3 rounded-lg">U kopjua!</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COL: STATS & MEMBERS */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                            <p className="text-indigo-100 font-bold uppercase text-xs tracking-widest mb-2">Total</p>
                            <h2 className="text-4xl font-black">
                                {Number(group?.total_expenses || 0).toFixed(2)} €
                            </h2>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-slate-900 font-black text-lg mb-6">Anëtarët</h3>
                            <div className="space-y-4">
                                {sortedMembers.map((member) => (
                                    <div key={member.user_id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-indigo-50">
                                                {member.user_name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{member.user_name}</p>
                                                <p className="text-[11px] text-slate-400 font-medium">{member.user_email}</p>
                                            </div>
                                        </div>
                                        {member.user_id === group.creator_id && (
                                            <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100">ADMIN</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: EXPENSES */}
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
        </div>
    );
};

export default GroupDetails;