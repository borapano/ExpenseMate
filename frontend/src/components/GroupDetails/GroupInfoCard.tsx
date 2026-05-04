import React, { useState } from 'react';
import { Edit2, Check, X, Calendar, Users, Trash2, Crown, Copy } from 'lucide-react';
import api from '../../api';

interface Props {
    group: any;
    currentUser: any;
    onGroupUpdated: () => void;
    onGroupDeleted: () => void;
    onToast: (msg: string, type?: 'success' | 'error') => void;
}

const GroupInfoCard: React.FC<Props> = ({
    group, currentUser,
    onGroupUpdated, onGroupDeleted, onToast,
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

    const createdAt = group?.created_date
        ? new Date(group.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    // ── Edit mode ─────────────────────────────────────────────────────────────
    if (isEditing) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/15 overflow-hidden">
                <div className="h-0.5 w-full bg-gradient-to-r from-accent/70 via-accent/40 to-transparent" />
                <div className="px-6 py-5 flex items-end justify-between gap-8">
                    <div className="flex flex-1 min-w-0 gap-8">
                        <div className="flex-1 min-w-0">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-secondary/40 mb-2">
                                Group Name
                            </label>
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                placeholder="Group name"
                                autoFocus
                                className="w-full text-base font-black bg-transparent border-b-2 border-secondary/20 focus:border-accent py-1 text-primary placeholder:text-secondary/25 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="flex-[1.5] min-w-0">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-secondary/40 mb-2">
                                Description <span className="normal-case font-semibold text-secondary/30">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                                placeholder="Short description of this group"
                                className="w-full text-sm font-semibold bg-transparent border-b border-secondary/15 focus:border-accent/60 py-1 text-secondary/80 placeholder:text-secondary/25 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-2">
                            <button onClick={saveEdit} disabled={isSaving}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all">
                                <Check size={12} /> {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={cancelEdit} className="p-2 border border-secondary/15 hover:bg-secondary/5 rounded-xl transition-all">
                                <X size={13} className="text-secondary/45" />
                            </button>
                        </div>
                        {editError && <p className="text-red-500 text-[10px] font-bold">{editError}</p>}
                    </div>
                </div>
            </div>
        );
    }

    // ── View mode ─────────────────────────────────────────────────────────────
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 px-6 py-4 flex items-center justify-between gap-6">

            {/* Left — name + description + meta */}
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">

                {/* Group name + action icons (edit + delete) */}
                <div className="flex items-center gap-0.5 min-w-0">
                    <h2 className="text-base font-black text-primary truncate mr-1.5">{group.name}</h2>

                    {isAdmin && (
                        <>
                            {/* Edit button — always visible for admin */}
                            <button
                                onClick={startEdit}
                                className="shrink-0 p-1.5 text-secondary/25 hover:text-secondary/60 hover:bg-secondary/8 rounded-lg transition-all"
                                title="Edit group"
                            >
                                <Edit2 size={12} />
                            </button>

                            {/* Delete button — only when no expenses, inline confirm */}
                            {!hasExpenses && !showDeleteConfirm && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="shrink-0 p-1.5 text-secondary/25 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete group"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}

                            {/* Delete confirmation — inline */}
                            {showDeleteConfirm && (
                                <div className="flex items-center gap-1.5 ml-1.5">
                                    <span className="text-[10px] font-bold text-secondary/50 whitespace-nowrap">Delete permanently?</span>
                                    <button onClick={deleteGroup}
                                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wide transition-all">
                                        Yes
                                    </button>
                                    <button onClick={() => setShowDeleteConfirm(false)}
                                        className="px-2 py-1 bg-secondary/8 hover:bg-secondary/12 text-secondary/60 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all">
                                        No
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-secondary/50 font-semibold truncate">
                    {group.description || 'No description provided.'}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200/60 rounded-full">
                            <Crown size={9} className="text-amber-500 fill-amber-400/20" strokeWidth={2.5} />
                            <span className="text-[8px] font-black uppercase tracking-wider text-amber-500">Admin</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/5 border border-secondary/10 rounded-full">
                            <Users size={9} className="text-secondary/40" strokeWidth={2.5} />
                            <span className="text-[8px] font-black uppercase tracking-wider text-secondary/40">Member</span>
                        </span>
                    )}

                    <span className="text-secondary/15 text-xs">·</span>

                    <span className="text-xs font-semibold text-secondary/40 flex items-center gap-1">
                        <Users size={10} className="text-secondary/30" />
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>

                    {createdAt && <>
                        <span className="text-secondary/15 text-xs">·</span>
                        <span className="text-xs font-semibold text-secondary/40 flex items-center gap-1">
                            <Calendar size={10} className="text-secondary/30" />
                            Since {createdAt}
                        </span>
                    </>}
                </div>
            </div>

            {/* Right — invite code + (divider + leave for non-admins) */}
            <div className="flex items-center gap-3 shrink-0">

                {/* Invite code */}
                {group.code && (
                    <button
                        onClick={copyCode}
                        className="flex items-center gap-2 bg-[#F7F4F0] border border-secondary/10 hover:border-secondary/20 rounded-xl px-3.5 py-2.5 transition-all group"
                        title="Copy invite code"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-[8px] font-black uppercase tracking-widest text-secondary/30 leading-none mb-1">
                                Invite Code
                            </span>
                            <span className="text-sm font-black tracking-[0.20em] text-primary font-mono">
                                {group.code}
                            </span>
                        </div>
                        <div className={`ml-1 w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                            copied ? 'bg-emerald-500' : 'bg-white border border-secondary/15 group-hover:border-secondary/25'
                        }`}>
                            {copied
                                ? <Check size={10} className="text-white" strokeWidth={3} />
                                : <Copy size={10} className="text-secondary/35" />
                            }
                        </div>
                    </button>
                )}

            </div>
        </div>
    );
};

export default GroupInfoCard;
