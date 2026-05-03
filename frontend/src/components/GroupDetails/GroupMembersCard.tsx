import React from 'react';
import { Crown, Users } from 'lucide-react';

interface Props {
    group: any;
    currentUserId: string | number;
}

const GroupMembersCard: React.FC<Props> = ({ group, currentUserId }) => {
    const members: any[] = group.members || [];

    const sorted = [...members].sort((a, b) => {
        if (String(a.user_id) === String(group.creator_id)) return -1;
        if (String(b.user_id) === String(group.creator_id)) return 1;
        return (a.user_name || '').localeCompare(b.user_name || '');
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Users size={13} className="text-secondary/50" /> Members
                </h3>
                <span className="bg-secondary/10 text-secondary/60 text-[10px] font-black px-2.5 py-1 rounded-full">
                    {sorted.length}
                </span>
            </div>

            {/* Scrollable list — shows ~3 rows then scrolls */}
            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-0.5" style={{ maxHeight: '228px' }}>
                {sorted.map(m => {
                    const isMe = String(m.user_id) === String(currentUserId);
                    const isCreator = String(m.user_id) === String(group.creator_id);
                    const balance = m.balance !== undefined ? Number(m.balance) : null;

                    return (
                        <div key={m.user_id}
                            className="flex items-center justify-between gap-3 p-3 bg-[#F7F4F0] rounded-xl border border-secondary/10 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-primary text-accent flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                                    {(m.user_name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-sm text-primary truncate">{m.user_name}</span>
                                        {isMe && (
                                            <span className="bg-accent text-primary px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-black shrink-0">You</span>
                                        )}
                                        {isCreator && (
                                            <span className="flex items-center gap-0.5 bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-black shrink-0">
                                                <Crown size={7} strokeWidth={3} /> Admin
                                            </span>
                                        )}
                                    </div>
                                    {balance !== null && balance !== 0 && (
                                        <p className={`text-[10px] font-black ${balance > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {balance > 0 ? '+' : ''}{balance.toFixed(2)}€
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GroupMembersCard;
