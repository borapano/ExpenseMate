import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Minus, Crown, Users as UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

interface GroupParticipant {
    user_id: string;
    user_name: string;
}

interface GroupCardProps {
    group: {
        id: string;
        name: string;
        description: string;
        code: string;
        net_balance?: number;
        members?: GroupParticipant[];
        creator_id?: string;
    };
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const balance = Number(group.net_balance || 0);
    const isOwed = balance > 0.01;
    const isOwing = balance < -0.01;
    const isSettled = !isOwed && !isOwing;

    const members = group.members || [];
    const isAdmin = String(group.creator_id) === String(currentUser?.id);

    const formattedBalance = Math.abs(balance).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <div
            onClick={() => navigate(`/groups/${group.id}`)}
            className="bg-white rounded-2xl border border-secondary/10 shadow-sm flex flex-col overflow-hidden cursor-pointer hover:shadow-md hover:border-secondary/20 transition-all duration-200 group"
        >
            {/* Top bar accent */}
            <div className="h-1 bg-primary w-full" />

            <div className="p-6 flex flex-col flex-1 gap-4">

                {/* Row 1: Role badge + Invite code */}
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${isAdmin
                        ? 'bg-amber-50 border-amber-200/60'
                        : 'bg-secondary/5 border-secondary/10'
                        }`}>
                        {isAdmin ? (
                            <>
                                <Crown size={9} className="text-amber-500 fill-amber-400/20" strokeWidth={2.5} />
                                <span className="text-[8px] font-black uppercase tracking-wider text-amber-500">Admin</span>
                            </>
                        ) : (
                            <>
                                <UsersIcon size={9} className="text-secondary/40" strokeWidth={2.5} />
                                <span className="text-[8px] font-black uppercase tracking-wider text-secondary/40">Member</span>
                            </>
                        )}
                    </div>

                    <div className="shrink-0 px-2.5 py-1 bg-primary/5 rounded-lg">
                        <span className="text-[10px] font-black text-primary/40 tracking-widest uppercase">
                            {group.code}
                        </span>
                    </div>
                </div>

                {/* Row 2: Name + Description */}
                <div>
                    <h3
                        className="text-base font-black text-primary truncate tracking-tight group-hover:text-accent transition-colors"
                        title={group.name}
                    >
                        {group.name}
                    </h3>
                    {group.description ? (
                        <p className="text-[11px] text-secondary/50 font-semibold line-clamp-1 mt-0.5">
                            {group.description}
                        </p>
                    ) : (
                        <p className="text-[11px] text-secondary/30 font-semibold mt-0.5 italic">
                            No description
                        </p>
                    )}
                </div>

                {/* Row 3: Members avatars */}
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {members.slice(0, 5).map((m, idx) => (
                            <div
                                key={idx}
                                className="w-7 h-7 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary shadow-sm"
                                title={m.user_name}
                            >
                                {m.user_name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {members.length > 5 && (
                            <div className="w-7 h-7 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary/40 shadow-sm tracking-tighter">
                                ...
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-semibold text-secondary/40">
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>
                </div>

                {/* Row 4: Balance footer */}
                <div className="pt-3 border-t border-secondary/10 flex items-center justify-between mt-auto">
                    <div>
                        <span className="text-[8px] font-black uppercase text-secondary/40 tracking-wider block">
                            Your Balance
                        </span>
                        <span className={`text-xs font-black mt-0.5 block ${isOwed ? 'text-emerald-600' : isOwing ? 'text-red-500' : 'text-secondary/40'
                            }`}>
                            {isSettled
                                ? 'Settled Up'
                                : isOwed
                                    ? `You are owed €${formattedBalance}`
                                    : `You owe €${formattedBalance}`
                            }
                        </span>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isOwed
                        ? 'bg-emerald-50 text-emerald-600'
                        : isSettled
                            ? 'bg-secondary/5 text-secondary/30'
                            : 'bg-red-50 text-red-500'
                        }`}>
                        {isOwed
                            ? <ArrowUpRight size={16} strokeWidth={2.5} />
                            : isSettled
                                ? <Minus size={16} strokeWidth={2.5} />
                                : <ArrowDownLeft size={16} strokeWidth={2.5} />
                        }
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GroupCard;