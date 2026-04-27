import React, { useState, useEffect } from 'react';
import { X, Tag, Calendar, Users, Info } from 'lucide-react';
import api from '../api';
import { CATEGORIES } from '../utils/categoryMap';

const ExpenseForm = ({ group, expenseToEdit, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Food & Dining',
        expense_date: new Date().toISOString().split('T')[0],
        participants: []
    });

    useEffect(() => {
        if (expenseToEdit) {
            setFormData({
                description: expenseToEdit.description,
                amount: expenseToEdit.amount.toString(),
                category: expenseToEdit.category || 'Food & Dining',
                expense_date: expenseToEdit.expense_date,
                participants: expenseToEdit.participants.map(p => p.user_id)
            });
        } else if (group?.members) {
            setFormData(prev => ({
                ...prev,
                participants: group.members.map(m => m.user_id)
            }));
        }
    }, [expenseToEdit, group]);

    const handleParticipantToggle = (userId) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.includes(userId)
                ? prev.participants.filter(id => id !== userId)
                : [...prev.participants, userId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.participants.length === 0) {
            alert("Zgjidhni të paktën një pjesëmarrës!");
            return;
        }

        setLoading(true);

        try {
            // LLOGARITJA E SIGURTË NË CENTË (Për të shmangur JS Float Precision bugs)
            // Nëse shuma është 122.00, totalCents do të jetë 12200 (numër i plotë)
            const totalCents = Math.round(parseFloat(formData.amount) * 100);
            const count = formData.participants.length;

            const baseShareCents = Math.floor(totalCents / count);
            let remainderCents = totalCents - (baseShareCents * count);

            const participantsData = formData.participants.map((userId) => {
                let shareCents = baseShareCents;
                // Shpërndajmë nga 1 cent për secilin derisa mbetja të shkojë 0
                if (remainderCents > 0) {
                    shareCents += 1;
                    remainderCents -= 1;
                }

                return {
                    user_id: userId,
                    // Kthehet si numër float i pastër fiks me 2 dhjetorë (psh: 40.67)
                    share_amount: Number((shareCents / 100).toFixed(2))
                };
            });

            // Payload i sinkronizuar fiks me schemas.ExpenseCreate
            const payload = {
                amount: Number((totalCents / 100).toFixed(2)),
                description: formData.description.trim(),
                category: formData.category,
                expense_date: formData.expense_date,
                group_id: group.id,
                participants: participantsData,
                receipt_image: null
            };

            console.log("Duke dërguar Payload për Backend:", payload);

            if (expenseToEdit) {
                await api.put(`/expenses/${expenseToEdit.id}`, payload);
            } else {
                await api.post('/expenses/', payload);
            }

            onSuccess();
        } catch (err) {
            console.error("Detajet e Errorit:", err.response?.data);

            const detail = err.response?.data?.detail;
            let msg = "Gabim gjatë ruajtjes.";

            // Formatim i errorit që vjen nga Pydantic që të jetë i lexueshëm
            if (Array.isArray(detail)) {
                msg = detail.map(d => `${d.loc.slice(-1)}: ${d.msg}`).join('\n');
            } else if (typeof detail === 'string') {
                msg = detail;
            }

            alert(`Backend Error:\n${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">{expenseToEdit ? 'Edito' : 'Shto Shpenzim'}</h2>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{group?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="text-center">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Shuma Totale</label>
                        <div className="relative inline-flex items-center">
                            <input
                                type="number"
                                step="0.01"
                                required
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                className="text-5xl font-black text-slate-900 text-center w-64 bg-transparent border-none focus:ring-0 placeholder:text-slate-100"
                            />
                            <span className="text-2xl font-black text-slate-300 ml-2">€</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Tag size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                minLength="2"
                                maxLength="255"
                                placeholder="Për çfarë?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="date"
                                required
                                value={formData.expense_date}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                            />
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                <Users size={12} /> Ndarja me:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {group?.members?.map((member) => (
                                    <button
                                        key={member.user_id}
                                        type="button"
                                        onClick={() => handleParticipantToggle(member.user_id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${formData.participants.includes(member.user_id)
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                            : 'bg-slate-100 border-transparent text-slate-400'
                                            }`}
                                    >
                                        {member.user_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 active:scale-95"
                    >
                        {loading ? 'Duke dërguar...' : 'Konfirmo'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExpenseForm;