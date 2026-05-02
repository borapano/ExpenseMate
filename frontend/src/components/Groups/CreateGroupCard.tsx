import React from 'react';
import { Plus, Users } from 'lucide-react';

interface CreateGroupCardProps {
    onClick: () => void;
}

const CreateGroupCard: React.FC<CreateGroupCardProps> = ({ onClick }) => (
    <div
        onClick={onClick}
        className="bg-primary rounded-2xl shadow-sm p-5 flex flex-col justify-between h-full cursor-pointer hover:bg-primary/95 hover:shadow-md transition-all duration-200 group overflow-hidden relative"
    >
        {/* Background decorative icon */}
        <Users
            size={130}
            className="absolute -right-6 -bottom-5 text-white opacity-[0.03] pointer-events-none transition-transform duration-300 group-hover:scale-110"
            strokeWidth={1}
        />

        {/* Top: label + title + description + action icon */}
        <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    New Group
                </span>
                <h2 className="text-base font-black text-white tracking-tight">
                    Create a Group
                </h2>
                <p className="text-[11px] font-semibold text-white/50 whitespace-nowrap">
                    Create a shared space to split bills, track who owes what.
                </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/15 transition-colors">
                <Plus size={20} className="text-accent" strokeWidth={2.5} />
            </div>
        </div>

        {/* Bottom: feature chips */}
        <div className="flex items-center gap-2 mt-auto pt-4 flex-wrap">
            {['Split bills', 'Track balances', 'Settle up'].map((label) => (
                <span
                    key={label}
                    className="px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-[10px] font-bold text-white/40 tracking-wide"
                >
                    {label}
                </span>
            ))}
        </div>
    </div>
);

export default CreateGroupCard;