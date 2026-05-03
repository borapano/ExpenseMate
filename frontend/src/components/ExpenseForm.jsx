import React, { useState, useEffect } from 'react';
import { X, Tag, Calendar, AlertCircle, Receipt } from 'lucide-react';
import api from '../api';
import { CATEGORIES, getCategoryDetails } from '../utils/categoryMap';

const ExpenseForm = ({ group, expenseToEdit, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
                participants: expenseToEdit.participants
                    .filter(p => Number(p.share_amount || p.amount || 0) > 0)
                    .map(p => p.user_id)
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
        setError(null);
        if (formData.participants.length === 0) {
            setError('Please select at least one participant.');
            return;
        }
        setLoading(true);
        try {
            const totalCents = Math.round(parseFloat(formData.amount) * 100);
            const count = formData.participants.length;
            const baseShareCents = Math.floor(totalCents / count);
            let remainderCents = totalCents - (baseShareCents * count);

            const participantsData = formData.participants.map((userId) => {
                let shareCents = baseShareCents;
                if (remainderCents > 0) { shareCents += 1; remainderCents -= 1; }
                return { user_id: userId, share_amount: Number((shareCents / 100).toFixed(2)) };
            });

            const payload = {
                amount: Number((totalCents / 100).toFixed(2)),
                description: formData.description.trim(),
                category: formData.category,
                expense_date: formData.expense_date,
                group_id: group.id,
                participants: participantsData,
                receipt_image: null
            };

            if (expenseToEdit) {
                await api.put(`/expenses/${expenseToEdit.id}`, payload);
            } else {
                await api.post('/expenses/', payload);
            }
            onSuccess();
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map(d => `${d.loc.slice(-1)}: ${d.msg}`).join(' · '));
            } else {
                setError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const parsedAmount = parseFloat(formData.amount);
    const perPerson = formData.participants.length > 0 && parsedAmount > 0
        ? (parsedAmount / formData.participants.length).toFixed(2)
        : null;

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[1.5rem] w-full max-w-3xl shadow-2xl border border-secondary/10 overflow-hidden flex flex-col max-h-[92vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="px-8 pt-7 pb-5 flex items-center justify-between border-b border-secondary/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-accent/15 rounded-xl flex items-center justify-center shrink-0">
                            <Receipt size={18} className="text-accent" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-primary tracking-tight">
                                {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
                            </h2>
                            <p className="text-xs font-semibold text-secondary/60 mt-0.5">{group?.name}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-surface rounded-full text-secondary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto flex-1
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-secondary/20
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb:hover]:bg-secondary/30">

                    <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-6">

                        {/* ── Amount ── */}
                        <div className="bg-[#FAF9F6] border border-secondary/10 rounded-2xl px-6 py-5 flex flex-col items-center gap-1">
                            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Amount</p>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-2xl font-black text-secondary/25 self-start mt-3">€</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="text-5xl font-black text-primary text-center w-52 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-secondary/15 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            {perPerson ? (
                                <p className="text-xs font-semibold text-secondary/50 mt-1">
                                    €{perPerson} each · {formData.participants.length} {formData.participants.length === 1 ? 'person' : 'people'}
                                </p>
                            ) : (
                                <p className="text-xs font-semibold text-secondary/30 mt-1">Split equally among participants</p>
                            )}
                        </div>

                        {/* ── Description + Date (same row) ── */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/40 pointer-events-none" />
                                <input
                                    type="text"
                                    required
                                    minLength={2}
                                    maxLength={255}
                                    placeholder="What was this for?"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-secondary/20 rounded-xl text-sm font-semibold text-primary placeholder:text-secondary/35 focus:border-accent outline-none transition-all"
                                />
                            </div>
                            <div className="relative shrink-0">
                                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/40 pointer-events-none" />
                                <input
                                    type="date"
                                    required
                                    min={sevenDaysAgo}
                                    max={today}
                                    value={formData.expense_date}
                                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                                    className="pl-10 pr-3 py-3 bg-white border border-secondary/20 rounded-xl text-sm font-semibold text-primary focus:border-accent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* ── Category ── */}
                        <div className="flex flex-col gap-2.5">
                            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Category</h3>
                            <div className="grid grid-cols-6 gap-2">
                                {CATEGORIES.map(cat => {
                                    const { icon, colorClass } = getCategoryDetails(cat);
                                    const isSelected = formData.category === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat })}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                                                isSelected
                                                    ? `${colorClass} border-transparent shadow-sm`
                                                    : 'bg-white border-secondary/20 text-secondary/40 hover:border-secondary/30 hover:text-secondary/60'
                                            }`}
                                        >
                                            <span className={isSelected ? '' : 'opacity-40'}>
                                                {React.cloneElement(icon, { size: 18 })}
                                            </span>
                                            <span className="text-[9px] font-semibold whitespace-nowrap text-center">
                                                {cat}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Participants ── */}
                        <div className="flex flex-col gap-2.5">
                            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Split with</h3>
                            <div className="flex flex-wrap gap-2">
                                {group?.members?.map((member) => {
                                    const isSelected = formData.participants.includes(member.user_id);
                                    const initial = (member.user_name || '?').charAt(0).toUpperCase();
                                    return (
                                        <button
                                            key={member.user_id}
                                            type="button"
                                            onClick={() => handleParticipantToggle(member.user_id)}
                                            className={`flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                                isSelected
                                                    ? 'bg-primary border-primary text-white shadow-sm'
                                                    : 'bg-white border-secondary/20 text-secondary/50 hover:border-secondary/35 hover:text-secondary/70'
                                            }`}
                                        >
                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                isSelected ? 'bg-white/15' : 'bg-secondary/10'
                                            }`}>
                                                {initial}
                                            </span>
                                            {member.user_name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Error ── */}
                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-semibold text-red-600">{error}</p>
                            </div>
                        )}

                        {/* ── Footer ── */}
                        <div className="pt-2 flex items-center justify-end gap-4 border-t border-secondary/5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-sm font-bold text-secondary hover:text-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-accent hover:bg-accent/90 text-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving…' : expenseToEdit ? 'Save Changes' : 'Add Expense'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExpenseForm;
