import React, { useState } from 'react';
import { Receipt, TrendingUp, TrendingDown, Users, Trophy, Leaf, X, Crown } from 'lucide-react';

interface Props {
    group: any;
    currentUserId: string | number;
}

// ── Members Modal ─────────────────────────────────────────────────────────────
const MembersModal: React.FC<{
    group: any; currentUserId: string; onClose: () => void;
}> = ({ group, currentUserId, onClose }) => {
    const members: any[] = group.members || [];
    const sorted = [...members].sort((a, b) => {
        if (String(a.user_id) === String(group.creator_id)) return -1;
        if (String(b.user_id) === String(group.creator_id)) return 1;
        return (a.user_name || '').localeCompare(b.user_name || '');
    });

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-secondary/10">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                        {sorted.length} Members
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-secondary/40 hover:text-primary rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* List — fixed height for ~10 rows, always scrollable */}
                <div className="px-6 py-4 flex flex-col gap-3 h-[468px] overflow-y-auto custom-scrollbar">
                    {sorted.map(m => {
                        const isMe = String(m.user_id) === currentUserId;
                        const isCreator = String(m.user_id) === String(group.creator_id);
                        return (
                            <div key={m.user_id} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-accent font-black text-sm shrink-0 select-none">
                                    {(m.user_name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    <span className="font-bold text-sm text-primary truncate">{m.user_name}</span>
                                    {isMe && (
                                        <span className="px-1.5 py-0.5 bg-accent text-primary rounded-full text-[8px] uppercase tracking-widest font-black shrink-0">
                                            You
                                        </span>
                                    )}
                                    {isCreator && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[8px] uppercase tracking-widest font-black shrink-0">
                                            <Crown size={7} strokeWidth={3} /> Admin
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const GroupStatsRow: React.FC<Props> = ({ group, currentUserId }) => {
    const [showMembersModal, setShowMembersModal] = useState(false);

    const expenses: any[] = group.expenses || [];
    const members: any[] = group.members || [];
    const uid = String(currentUserId);

    // My total spend = sum of MY share_amount across all expenses
    const myTotalSpend = expenses.reduce((sum, e) => {
        const myEntry = (e.participants || []).find((p: any) => String(p.user_id) === uid);
        return sum + Number(myEntry?.share_amount || 0);
    }, 0);

    // Net balance
    const netBalance = Number(group.net_balance || 0);

    // Spending per member = sum of their share_amounts across all expenses (not who paid)
    const spendMap: Record<string, number> = {};
    members.forEach(m => { spendMap[String(m.user_id)] = 0; });
    expenses.forEach(e => {
        (e.participants || []).forEach((p: any) => {
            const pid = String(p.user_id);
            spendMap[pid] = (spendMap[pid] || 0) + Number(p.share_amount || 0);
        });
    });

    const spendEntries = members
        .map(m => ({ user_id: String(m.user_id), user_name: m.user_name || '?', total: spendMap[String(m.user_id)] || 0 }))
        .filter(s => s.total > 0);

    const maxSpend = spendEntries.length > 0 ? Math.max(...spendEntries.map(s => s.total)) : 0;
    const minSpend = spendEntries.length > 0 ? Math.min(...spendEntries.map(s => s.total)) : 0;
    const biggestSpenders = spendEntries.filter(s => s.total === maxSpend);
    const lightestWallets = spendEntries.filter(s => s.total === minSpend && minSpend < maxSpend);
    const showInsights = spendEntries.length >= 2;

    const displayName = (s: { user_id: string; user_name: string }) =>
        s.user_id === uid ? 'You' : s.user_name;

    // ── Card style ──
    const card = "bg-white rounded-2xl border border-secondary/10 shadow-sm p-6 flex flex-col gap-3 relative overflow-hidden";

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* ── My Spendings ── */}
                <div className={card}>
                    <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-accent rounded-r-full" />
                    <div className="flex items-center gap-2">
                        <Receipt size={14} className="text-secondary/35" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">My Spendings</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-primary tabular-nums">
                            €{myTotalSpend.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-secondary/40 font-semibold mt-1">
                            Your total share in this group
                        </p>
                    </div>
                </div>

                {/* ── Net Balance ── */}
                <div className={card}>
                    <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full ${
                        netBalance > 0 ? 'bg-emerald-400' : netBalance < 0 ? 'bg-red-400' : 'bg-secondary/15'
                    }`} />
                    <div className="flex items-center gap-2">
                        {netBalance >= 0
                            ? <TrendingUp size={14} className="text-secondary/35" />
                            : <TrendingDown size={14} className="text-secondary/35" />
                        }
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Net Balance</span>
                    </div>
                    <div>
                        <p className={`text-3xl font-black tabular-nums ${
                            netBalance > 0 ? 'text-emerald-600' : netBalance < 0 ? 'text-red-500' : 'text-secondary/35'
                        }`}>
                            {netBalance > 0 ? '+' : ''}€{Math.abs(netBalance).toFixed(2)}
                        </p>
                        <p className="text-[11px] text-secondary/40 font-semibold mt-1">
                            {netBalance > 0 ? 'Others owe you' : netBalance < 0 ? 'You owe others' : 'All settled up'}
                        </p>
                    </div>
                </div>

                {/* ── Members Summary ── */}
                <div className={card}>
                    <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-primary/15 rounded-r-full" />

                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-secondary/35" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">
                            {members.length} Members
                        </span>
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                        {!showInsights ? (
                            <p className="text-[11px] text-secondary/35 font-semibold">
                                Add expenses to see spending insights.
                            </p>
                        ) : (
                            <>
                                {/* Biggest Spender */}
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center shrink-0">
                                        <Trophy size={12} className="text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-0.5">
                                            {biggestSpenders.length > 1 ? 'Biggest Spenders' : 'Biggest Spender'}
                                        </p>
                                        <p className="text-[13px] font-black text-primary truncate">
                                            {biggestSpenders.map(displayName).join(', ')}
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-black text-amber-600 shrink-0 tabular-nums">
                                        €{maxSpend.toFixed(2)}
                                    </span>
                                </div>

                                {/* Lightest Wallet */}
                                {lightestWallets.length > 0 && (
                                    <div className="flex items-center gap-2.5 pt-2 border-t border-secondary/8">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/50 flex items-center justify-center shrink-0">
                                            <Leaf size={12} className="text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
                                                {lightestWallets.length > 1 ? 'Lightest Wallets' : 'Lightest Wallet'}
                                            </p>
                                            <p className="text-[13px] font-black text-primary truncate">
                                                {lightestWallets.map(displayName).join(', ')}
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-black text-emerald-600 shrink-0 tabular-nums">
                                            €{minSpend.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Tap to see all */}
                    <button
                        onClick={() => setShowMembersModal(true)}
                        className="pt-2.5 border-t border-secondary/8 text-[10px] font-black uppercase tracking-wider text-secondary/35 hover:text-primary transition-colors text-left flex items-center gap-1.5 w-full"
                    >
                        <Users size={11} /> Tap to see all members
                    </button>
                </div>
            </div>

            {showMembersModal && (
                <MembersModal
                    group={group}
                    currentUserId={uid}
                    onClose={() => setShowMembersModal(false)}
                />
            )}
        </>
    );
};

export default GroupStatsRow;
