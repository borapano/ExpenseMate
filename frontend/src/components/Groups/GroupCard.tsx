import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GroupParticipant {
    user_id: string;
    user_name: string;
}

interface GroupCardProps {
    group: {
        id: string;
        name: string;
        description: string;
        invite_code: string;
        total_spending?: number;
        net_balance?: number;
        members?: GroupParticipant[];
    };
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
    const navigate = useNavigate();
    const netBal = Number(group.net_balance || 0);
    const members = group.members || [];

    return (
        <div
            onClick={() => navigate(`/groups/${group.id}`)}
            className="bg-white/80 p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col hover:scale-105 hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-2">
                    <h3 className="text-lg font-black text-primary truncate" title={group.name}>{group.name}</h3>
                    {group.description && (
                        <p className="text-xs text-secondary/60 font-semibold line-clamp-1 mt-1">
                            {group.description}
                        </p>
                    )}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F7F4F0] flex items-center justify-center text-[10px] font-black text-primary/40 shrink-0">
                    {group.invite_code}
                </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 bg-[#F7F4F0] p-4 rounded-xl mt-2 mb-5">
                <div>
                    <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest mb-1">Total Spent</p>
                    <p className="font-bold text-sm text-primary">€{Number(group.total_spending || 0).toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest mb-1">Your Net Bal</p>
                    <p className={`font-black text-base ${netBal > 0 ? 'text-emerald-500' : netBal < 0 ? 'text-danger' : 'text-primary'}`}>
                        {netBal > 0 ? '+' : ''}{netBal.toFixed(2)}€
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-2">
                    {members.slice(0, 4).map((m, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm" title={m.user_name}>
                            {m.user_name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {members.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                            +{members.length - 4}
                        </div>
                    )}
                </div>
                <span className="text-xs font-bold text-accent group-hover:underline flex items-center gap-1">
                    View Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
            </div>
        </div>
    );
};

export default GroupCard;