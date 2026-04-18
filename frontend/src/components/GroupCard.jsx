import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Minus, User, Crown, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../AuthContext';

const GroupCard = ({ group }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Përdorim balancën e llogaritur nga backend-i
    const balance = Number(group.net_balance || 0);

    // Përcaktimi i statusit (isOwed = më kanë borxh, isOwing = i kam borxh)
    const isOwed = balance > 0.01;
    const isOwing = balance < -0.01;
    const isSettled = !isOwed && !isOwing;

    const members = group?.members || [];
    const isAdmin = String(group?.creator_id) === String(currentUser?.id);

    // Formatimi i vlerës në stilin Europian (1.234,56 €)
    const formattedBalance = Math.abs(balance).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        <div
            onClick={() => navigate(`/groups/${group.id}`)}
            className="group relative bg-white p-6 rounded-[2rem] shadow-sm border border-secondary/5 
                 hover:shadow-md hover:border-accent/40 transition-all duration-300 
                 flex flex-col h-[180px] justify-between cursor-pointer overflow-hidden"
        >
            <div>
                <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary/30 block">
                        ID: #{group?.code || '0000'}
                    </span>

                    {/* Badge i Adminit me ngjyrën Amber (e verdhë/portokalli) */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${isAdmin
                            ? 'bg-amber-50 border-amber-200/60 shadow-sm'
                            : 'bg-secondary/5 border-transparent'
                        }`}>
                        {isAdmin ? (
                            <>
                                <Crown size={10} className="text-amber-500 fill-amber-500/10" strokeWidth={2.5} />
                                <span className="text-[8px] font-black uppercase tracking-tighter text-amber-500">
                                    Admin
                                </span>
                            </>
                        ) : (
                            <>
                                <UsersIcon size={10} className="text-secondary/40" strokeWidth={2.5} />
                                <span className="text-[8px] font-black uppercase tracking-tighter text-secondary/40">
                                    Member
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <h3 className="text-base font-bold text-primary group-hover:text-accent transition-colors truncate mb-3">
                    {group?.name}
                </h3>

                {/* Shfaqja e anëtarëve (Avatarët) */}
                <div className="flex -space-x-1.5">
                    {members.length > 0 ? (
                        members.slice(0, 4).map((m, idx) => (
                            <div key={m.user_id || idx} className="w-8 h-8 rounded-full border-2 border-white bg-surface flex items-center justify-center text-[9px] font-bold shadow-sm overflow-hidden">
                                <span className="text-secondary/60">
                                    {m.user_name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-surface/50 flex items-center justify-center">
                            <User size={12} className="text-secondary/30" />
                        </div>
                    )}
                    {members.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-bold text-secondary/40">
                            +{members.length - 4}
                        </div>
                    )}
                </div>
            </div>

            {/* SEKTORI I BALANCËS DHE STATUSIT */}
            <div className="pt-3 border-t border-secondary/5 flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-secondary/40 tracking-wider">Your Balance</span>
                    <span className={`text-xs font-black mt-0.5 ${isOwed ? 'text-emerald-600' : isSettled ? 'text-secondary/50' : 'text-red-600'}`}>
                        {isSettled ? 'Settled Up' : `${isOwed ? 'Owed' : 'You owe'} €${formattedBalance}`}
                    </span>
                </div>

                {/* Ikona e lëvizjes së parave */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors ${isOwed ? 'bg-emerald-50 text-emerald-600' :
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