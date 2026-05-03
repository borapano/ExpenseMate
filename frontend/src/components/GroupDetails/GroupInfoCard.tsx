import React, { useState } from 'react';
import { Copy, Edit2, Check, X, Calendar, Users, LogOut, Trash2, Crown, Hash } from 'lucide-react';
import api from '../../api';

interface Props {
    group: any;
    currentUser: any;
    canLeave: boolean;
    onGroupUpdated: () => void;
    onGroupDeleted: () => void;
    onLeaveGroup: () => void;
    onToast: (msg: string, type?: 'success' | 'error') => void;
}

const GroupInfoCard: React.FC<Props> = ({
    group, currentUser, canLeave,
    onGroupUpdated, onGroupDeleted, onLeaveGroup, onToast,
}) => {
    const isAdmin = String(currentUser?.id) === String(group?.creator_id);
    const hasExpenses = (group?.expenses || []).length > 0;
    const members: any[] = group?.members || [];

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState('');
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const startEdit = () => {
        setEditName(group.name || '');
        setEditDesc(group.description || '');
        setEditError('');
        setIsEditing(true);
    };
    const cancelEdit = () => { setIsEditing(false); setEditError(''); };

    const saveEdit = async () => {
        if (!editName.trim()) { setEditError('Name cannot be empty.'); return; }
        setIsSaving(true); setEditError('');
        try {
            await api.put(`/groups/${group.id}`, { name: editName.trim(), description: editDesc.trim() });
            setIsEditing(false);
            onGroupUpdated();
            onToast('Group updated!');
        } catch (e: any) {
            setEditError(e?.response?.data?.detail || 'Failed to save.');
        } finally { setIsSaving(false); }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(group.code);
        setCopied(true);
        onToast('Invite code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const deleteGroup = async () => {
        try {
            await api.delete(`/groups/${group.id}`);
            onGroupDeleted();
        } catch (e: any) { onToast(e?.response?.data?.detail || 'Failed to delete.', 'error'); }
        finally { setShowDeleteConfirm(false); }
    };

    const leaveGroup = async () => {
        try {
            await api.post(`/groups/${group.id}/leave`);
            onLeaveGroup();
        } catch (e: any) { onToast(e?.response?.data?.detail || 'Failed to leave.', 'error'); }
        finally { setShowLeaveConfirm(false); }
    };

    const createdAt = group?.created_date
        ? new Date(group.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const initials = (group?.name || '?').charAt(0).toUpperCase();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col md:flex-row gap-6">

            {/* ── Left ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">
                {!isEditing ? (
                    <>
                        {/* Avatar + Name + Description */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-accent font-black text-xl shrink-0 shadow-sm select-none">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-black text-primary tracking-tight leading-tight">
                                        {group.name}
                                    </h1>
                                    {isAdmin && (
                                        <button
                                            onClick={startEdit}
                                            className="p-1.5 text-secondary/30 hover:text-primary hover:bg-secondary/8 rounded-lg transition-all"
                                            title="Edit group"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-secondary/50 font-semibold mt-0.5 line-clamp-1">
                                    {group.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>

                        {/* Meta chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            {isAdmin ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/70 text-amber-700 rounded-lg text-[11px] font-black uppercase tracking-wider">
                                    <Crown size={10} strokeWidth={2.5} /> Admin
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/5 border border-secondary/12 text-secondary/55 rounded-lg text-[11px] font-black uppercase tracking-wider">
                                    <Users size={10} /> Member
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4F0] border border-secondary/10 text-secondary/50 rounded-lg text-[11px] font-semibold">
                                <Users size={10} /> {members.length} {members.length === 1 ? 'member' : 'members'}
                            </span>
                            {createdAt && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4F0] border border-secondary/10 text-secondary/50 rounded-lg text-[11px] font-semibold">
                                    <Calendar size={10} /> Since {createdAt}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            {isAdmin && !hasExpenses && !showDeleteConfirm && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 border border-red-200/50 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all"
                                >
                                    <Trash2 size={10} /> Delete Group
                                </button>
                            )}
                            {showDeleteConfirm && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-secondary/55">Delete permanently?</span>
                                    <button onClick={deleteGroup} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wide transition-all">Yes</button>
                                    <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 bg-secondary/8 hover:bg-secondary/15 text-secondary rounded-lg text-[10px] font-black uppercase tracking-wide transition-all">No</button>
                                </div>
                            )}
                            {!isAdmin && canLeave && !showLeaveConfirm && (
                                <button
                                    onClick={() => setShowLeaveConfirm(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-secondary/55 hover:bg-secondary/8 border border-secondary/12 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all"
                                >
                                    <LogOut size={10} /> Leave Group
                                </button>
                            )}
                            {!isAdmin && !canLeave && (
                                <span className="text-[10px] text-secondary/30 font-semibold">Settle all balances before leaving</span>
                            )}
                            {showLeaveConfirm && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-secondary/55">Leave this group?</span>
                                    <button onClick={leaveGroup} className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-wide transition-all">Yes</button>
                                    <button onClick={() => setShowLeaveConfirm(false)} className="px-3 py-1.5 bg-secondary/8 hover:bg-secondary/15 text-secondary rounded-lg text-[10px] font-black uppercase tracking-wide transition-all">No</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* ── Edit form ── */
                    <div className="flex flex-col gap-3 max-w-md">
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                            placeholder="Group name"
                            autoFocus
                            className="text-xl font-black border border-secondary/20 rounded-xl px-4 py-2.5 text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                        />
                        <textarea
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="text-sm font-semibold border border-secondary/20 rounded-xl px-4 py-2.5 text-secondary/70 placeholder:text-secondary/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none transition-all"
                        />
                        {editError && <p className="text-red-500 text-xs font-bold">{editError}</p>}
                        <div className="flex items-center gap-2">
                            <button onClick={saveEdit} disabled={isSaving}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all">
                                <Check size={13} /> {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={cancelEdit} className="p-2 border border-secondary/15 hover:bg-secondary/5 rounded-xl transition-all">
                                <X size={14} className="text-secondary/50" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right: Invite code ── */}
            <div className="shrink-0 bg-[#F7F4F0] border border-secondary/10 rounded-2xl p-5 flex flex-col gap-2 min-w-[168px] justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                    <Hash size={11} className="text-secondary/35" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Invite Code</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="font-black text-2xl tracking-[0.25em] text-primary select-all">{group.code}</span>
                    <button
                        onClick={copyCode}
                        className="p-2 bg-white hover:bg-white/70 border border-secondary/10 rounded-lg transition-all shadow-sm shrink-0"
                        title="Copy code"
                    >
                        {copied
                            ? <Check size={13} className="text-emerald-500" />
                            : <Copy size={13} className="text-secondary/40" />
                        }
                    </button>
                </div>
                <p className="text-[9px] font-semibold text-secondary/25 mt-1">Share to invite members</p>
            </div>
        </div>
    );
};

export default GroupInfoCard;
