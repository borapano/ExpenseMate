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
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 flex items-center justify-between border-b border-secondary/10">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                        {sorted.length} Members
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-secondary/40 hover:text-primary rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>
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
                                        <span className="px-1.5 py-0.5 bg-accent text-primary rounded-full text-[8px] uppercase tracking-widest font-black shrink-0">You</span>
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

    // ── My Spendings ─────────────────────────────────────────────────────────
    const myTotalSpend = expenses.reduce((sum, e) => {
        const myEntry = (e.participants || []).find((p: any) => String(p.user_id) === uid);
        return sum + Number(myEntry?.share_amount || 0);
    }, 0);
    const myExpenseCount = expenses.filter((e: any) =>
        (e.participants || []).some((p: any) => String(p.user_id) === uid)
    ).length;
    const groupTotalSpend = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const mySharePct = groupTotalSpend > 0 ? (myTotalSpend / groupTotalSpend) * 100 : 0;
    const avgPerExpense = myExpenseCount > 0 ? myTotalSpend / myExpenseCount : 0;

    // ── Net Balance (optimistic — treat pending as settled) ───────────────────
    const rawNetBalance = Number(group.net_balance || 0);

    // Pending outgoing: I sent payment, awaiting their confirmation → treat as paid
    const pendingOutgoingAmount = (group.my_debts || [])
        .filter((d: any) => d.is_pending)
        .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
    const pendingOutgoingCount = (group.my_debts || []).filter((d: any) => d.is_pending).length;

    // Pending incoming: others sent me payment, awaiting MY confirmation → treat as received
    const pendingIncomingAmount = (group.pending_settlements || [])
        .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
    const pendingIncomingCount = (group.pending_settlements || []).length;

    // Optimistic: treat pending outgoing as paid (reduces debt) and pending incoming as received (reduces receivable)
    const netBalance = rawNetBalance + pendingOutgoingAmount - pendingIncomingAmount;

    // Active (non-pending) debts
    const activeDebtCount = (group.my_debts || []).filter((d: any) => !d.is_pending).length;

    // Expected to receive: expenses where I'm payer, participants who haven't paid or sent a payment yet
    const expectedReceivableCount = expenses
        .filter((e: any) => String(e.payer_id) === uid)
        .reduce((count: number, e: any) => {
            const outstanding = (e.participants || []).filter((p: any) =>
                String(p.user_id) !== uid &&
                p.status !== 'PAYER' &&
                p.status !== 'CONFIRMED' &&
                !p.is_settled &&
                p.status !== 'PENDING'
            );
            return count + outstanding.length;
        }, 0);

    // ── Members Insights ──────────────────────────────────────────────────────
    const spendMap: Record<string, number> = {};
    members.forEach(m => { spendMap[String(m.user_id)] = 0; });
    expenses.forEach(e => {
        (e.participants || []).forEach((p: any) => {
            const pid = String(p.user_id);
            spendMap[pid] = (spendMap[pid] || 0) + Number(p.share_amount || 0);
        });
    });

    const spentEntries = members
        .map(m => ({ user_id: String(m.user_id), user_name: m.user_name || '?', total: spendMap[String(m.user_id)] || 0 }))
        .filter(s => s.total > 0);

    const hasAnySpending = spentEntries.length > 0;
    const maxSpend = hasAnySpending ? Math.max(...spentEntries.map(s => s.total)) : 0;
    const minSpend = hasAnySpending ? Math.min(...spentEntries.map(s => s.total)) : 0;
    const allEqualSpend = hasAnySpending && maxSpend === minSpend;

    const biggestSpenders = hasAnySpending ? spentEntries.filter(s => s.total === maxSpend) : [];
    const lightestWallets = hasAnySpending && !allEqualSpend ? spentEntries.filter(s => s.total === minSpend) : [];

    const displayName = (s: { user_id: string; user_name: string }) =>
        s.user_id === uid ? 'You' : s.user_name;

    const formatEntries = (arr: typeof biggestSpenders): string => {
        if (arr.length === 0) return '—';
        if (arr.length > 2) return `${arr.length} members`;
        return arr.map(displayName).join(' & ');
    };

    const biggestLabel = !hasAnySpending ? '—' : allEqualSpend ? 'Everyone' : formatEntries(biggestSpenders);
    const biggestAmt: number | null = hasAnySpending ? maxSpend : null;
    const biggestTitle = !hasAnySpending ? 'Biggest Spender' :
        allEqualSpend ? 'Equal Spenders' :
        biggestSpenders.length > 1 ? 'Biggest Spenders' : 'Biggest Spender';

    const lightestLabel = !hasAnySpending || allEqualSpend ? '—' : formatEntries(lightestWallets);
    const lightestAmt: number | null = !hasAnySpending || allEqualSpend ? null : minSpend;

    // ── Card base ─────────────────────────────────────────────────────────────
    const card = "bg-white rounded-2xl border border-secondary/10 shadow-sm p-6 flex flex-col relative overflow-hidden h-[210px]";

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* ── My Spendings ── */}
                <div className={card + " justify-between"}>
                    <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-accent rounded-r-full" />

                    <div className="flex items-center gap-2">
                        <Receipt size={13} className="text-secondary/30" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/35">My Spendings</span>
                    </div>

                    <div>
                        <p className="text-3xl font-black text-primary tabular-nums leading-tight">
                            €{myTotalSpend.toFixed(2)}
                        </p>
                        <p className="text-xs text-secondary/40 font-semibold mt-1">
                            {myExpenseCount === 0
                                ? 'No expenses yet'
                                : `Across ${myExpenseCount} ${myExpenseCount === 1 ? 'expense' : 'expenses'}`}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-1.5">
                        {groupTotalSpend > 0 ? (
                            <>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(mySharePct, 100)}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-accent/80">
                                        {mySharePct.toFixed(0)}% of group total
                                    </span>
                                    {avgPerExpense > 0 && (
                                        <span className="text-[10px] font-semibold text-secondary/35">
                                            avg €{avgPerExpense.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-[10px] font-semibold text-secondary/25">No group expenses yet</p>
                        )}
                    </div>
                </div>

                {/* ── Net Balance (optimistic) ── */}
                <div className={card + " justify-between"}>
                    <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full ${
                        netBalance > 0 ? 'bg-emerald-400' : netBalance < 0 ? 'bg-red-400' : 'bg-secondary/15'
                    }`} />

                    <div className="flex items-center gap-2">
                        {netBalance >= 0
                            ? <TrendingUp size={13} className="text-secondary/30" />
                            : <TrendingDown size={13} className="text-secondary/30" />
                        }
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Net Balance</span>
                    </div>

                    <div>
                        <p className={`text-3xl font-black tabular-nums leading-tight ${
                            netBalance > 0 ? 'text-emerald-600' : netBalance < 0 ? 'text-red-500' : 'text-secondary/35'
                        }`}>
                            {netBalance > 0 ? '+' : netBalance < 0 ? '-' : ''}€{Math.abs(netBalance).toFixed(2)}
                        </p>
                        <p className="text-xs text-secondary/40 font-semibold mt-1">
                            {netBalance > 0 ? 'Others owe you' : netBalance < 0 ? 'You owe others' : 'All settled up'}
                        </p>
                    </div>

                    {/* Context pills — conditional on sign */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {netBalance < -0.005 && (
                            <>
                                {activeDebtCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-100 rounded-lg text-[9px] font-black text-red-500 uppercase tracking-wider">
                                        {activeDebtCount} to pay
                                    </span>
                                )}
                                {pendingOutgoingCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] font-black text-amber-500 uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                        {pendingOutgoingCount} pending
                                    </span>
                                )}
                                {activeDebtCount === 0 && pendingOutgoingCount === 0 && (
                                    <span className="text-[10px] font-semibold text-secondary/30">No pending payments</span>
                                )}
                            </>
                        )}
                        {netBalance > 0.005 && (
                            <>
                                {pendingIncomingCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[9px] font-black text-blue-500 uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                                        {pendingIncomingCount} to confirm
                                    </span>
                                )}
                                {expectedReceivableCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                                        {expectedReceivableCount} expected
                                    </span>
                                )}
                                {pendingIncomingCount === 0 && expectedReceivableCount === 0 && (
                                    <span className="text-[10px] font-semibold text-secondary/30">No action needed</span>
                                )}
                            </>
                        )}
                        {Math.abs(netBalance) <= 0.005 && (
                            <span className="text-[10px] font-semibold text-secondary/30">Fully balanced</span>
                        )}
                    </div>
                </div>

                {/* ── Members Summary ── */}
                <div className={card + " gap-3"}>
                    <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-primary/15 rounded-r-full" />

                    <div className="flex items-center gap-2">
                        <Users size={13} className="text-secondary/30" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/35">
                            {members.length} {members.length === 1 ? 'Member' : 'Members'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center shrink-0">
                            <Trophy size={12} className="text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/80 mb-0.5">{biggestTitle}</p>
                            <p className="text-[13px] font-black text-primary truncate">{biggestLabel}</p>
                        </div>
                        {biggestAmt !== null && (
                            <span className="text-[11px] font-black text-amber-600 shrink-0 tabular-nums">
                                €{biggestAmt.toFixed(2)}
                            </span>
                        )}
                    </div>

                    {/* Standalone separator with breathing room on both sides */}
                    <div className="border-t border-secondary/10" />

                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/50 flex items-center justify-center shrink-0">
                            <Leaf size={12} className="text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80 mb-0.5">Lightest Wallet</p>
                            <p className="text-[13px] font-black text-primary truncate">{lightestLabel}</p>
                        </div>
                        {lightestAmt !== null && (
                            <span className="text-[11px] font-black text-emerald-600 shrink-0 tabular-nums">
                                €{lightestAmt.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => setShowMembersModal(true)}
                        className="mt-auto border-t border-secondary/8 pt-2 text-[10px] font-black uppercase tracking-wider text-secondary/35 hover:text-primary transition-colors text-left flex items-center gap-1.5 w-full"
                    >
                        <Users size={11} /> View all members
                    </button>
                </div>

            </div>

            {showMembersModal && (
                <MembersModal group={group} currentUserId={uid} onClose={() => setShowMembersModal(false)} />
            )}
        </>
    );
};

export default GroupStatsRow;
