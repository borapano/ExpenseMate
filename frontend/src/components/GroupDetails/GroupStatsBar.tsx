import React from 'react';
import { Receipt, TrendingUp, Users } from 'lucide-react';

interface Props {
    group: any;
    currentUserId: string | number;
}

const GroupStatsBar: React.FC<Props> = ({ group, currentUserId }) => {
    const expenses: any[] = group.expenses || [];

    // Total paid by me in this group
    const myTotalSpent = expenses
        .filter(e => String(e.payer_id) === String(currentUserId))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const netBalance = Number(group.net_balance || 0);
    const memberCount = group.members?.length || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* My Spending */}
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-2 mb-3">
                    <Receipt size={15} className="text-secondary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">
                        My Spending
                    </span>
                </div>
                <p className="text-3xl font-black text-primary">
                    €{myTotalSpent.toFixed(2)}
                </p>
                <p className="text-[10px] text-secondary/40 font-semibold mt-1">Total paid by you</p>
            </div>

            {/* Net Balance */}
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                <div
                    className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full pointer-events-none ${
                        netBalance > 0
                            ? 'bg-emerald-500/10'
                            : netBalance < 0
                            ? 'bg-red-500/10'
                            : 'bg-primary/5'
                    }`}
                />
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={15} className="text-secondary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">
                        Net Balance
                    </span>
                </div>
                <p
                    className={`text-3xl font-black ${
                        netBalance > 0
                            ? 'text-emerald-600'
                            : netBalance < 0
                            ? 'text-red-500'
                            : 'text-primary'
                    }`}
                >
                    {netBalance > 0 ? '+' : ''}
                    {netBalance.toFixed(2)}€
                </p>
                <p className="text-[10px] text-secondary/40 font-semibold mt-1">
                    {netBalance > 0
                        ? 'Others owe you'
                        : netBalance < 0
                        ? 'You owe others'
                        : 'All settled up'}
                </p>
            </div>

            {/* Members */}
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-2 mb-3">
                    <Users size={15} className="text-secondary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">
                        Members
                    </span>
                </div>
                <p className="text-3xl font-black text-primary">{memberCount}</p>
                <p className="text-[10px] text-secondary/40 font-semibold mt-1">
                    {memberCount === 1 ? 'member in this group' : 'members in this group'}
                </p>
            </div>
        </div>
    );
};

export default GroupStatsBar;
