import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Minus, User } from 'lucide-react';

const GroupCard = ({ group }) => {
    const navigate = useNavigate();
    const balance = Number(group?.user_balance) || 0;
    const isOwed = balance > 0;
    const isSettled = balance === 0;
    const members = group?.members || [];

    return (
        <div
            onClick={() => navigate(`/groups/${group.id}`)}
            className="group relative bg-white p-6 rounded-[2rem] shadow-sm border border-secondary/5 
                 hover:shadow-md hover:border-accent/40 transition-all duration-300 
                 flex flex-col h-[180px] justify-between cursor-pointer overflow-hidden"
        >
            <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-secondary/30 block mb-0.5">
                    ID: #{group?.code || '0000'}
                </span>

                <h3 className="text-base font-bold text-primary group-hover:text-accent transition-colors truncate mb-3">
                    {group?.name}
                </h3>

                <div className="flex -space-x-1.5">
                    {members.length > 0 ? (
                        members.slice(0, 4).map((m, idx) => (
                            <div key={m.id || idx} className="w-8 h-8 rounded-full border-2 border-white bg-surface flex items-center justify-center text-[9px] font-bold shadow-sm overflow-hidden">
                                {(m.avatar_url || m.avatar) ? (
                                    <img src={m.avatar_url || m.avatar} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-secondary/60">{m.name?.charAt(0).toUpperCase() || <User size={12} />}</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-surface/50 flex items-center justify-center">
                            <User size={12} className="text-secondary/30" />
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-3 border-t border-secondary/5 flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-secondary/40 tracking-wider">Your Balance</span>
                    <span className={`text-xs font-black mt-0.5 ${isOwed ? 'text-emerald-600' : isSettled ? 'text-secondary/50' : 'text-red-600'}`}>
                        {isSettled ? 'Settled Up' : `${isOwed ? 'Owed' : 'You owe'} $${Math.abs(balance).toFixed(2)}`}
                    </span>
                </div>

                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${isOwed ? 'bg-emerald-50 text-emerald-600' :
                    isSettled ? 'bg-secondary/5 text-secondary/30' :
                        'bg-red-50 text-red-600'
                    }`}>
                    {isOwed ? <ArrowUpRight size={18} strokeWidth={2.5} /> :
                        isSettled ? <Minus size={18} strokeWidth={2.5} /> :
                            <ArrowDownLeft size={18} strokeWidth={2.5} />}
                </div>
            </div>
        </div>
    );
};

export default GroupCard;