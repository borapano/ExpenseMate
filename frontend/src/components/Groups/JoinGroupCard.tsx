import React from 'react';
import { Hash } from 'lucide-react';

interface JoinGroupCardProps {
    inviteCode: string;
    setInviteCode: (code: string) => void;
    onJoin: (e: React.FormEvent) => void;
    isJoining: boolean;
}

const JoinGroupCard: React.FC<JoinGroupCardProps> = ({
    inviteCode,
    setInviteCode,
    onJoin,
    isJoining
}) => (
    <div className="bg-white border border-secondary/10 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden transition-all hover:bg-gray-50/50">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/5 rounded-full pointer-events-none" />
        <div className="w-full">
            <h2 className="text-lg font-black text-primary tracking-tight flex items-center gap-2 mb-3">
                <Hash className="text-primary/50" size={20} /> Join a Group
            </h2>
            <form onSubmit={onJoin} className="flex gap-2 w-full max-w-sm relative z-10">
                <input
                    type="text"
                    placeholder="Enter 6-char Code"
                    maxLength={6}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="flex-1 min-w-0 bg-[#F7F4F0] border border-secondary/10 rounded-xl px-4 py-2.5 text-sm font-black uppercase text-primary tracking-widest outline-none focus:border-accent transition-colors placeholder:text-secondary/30 placeholder:tracking-normal"
                />
                <button
                    type="submit"
                    disabled={isJoining}
                    className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isJoining ? '...' : 'Join'}
                </button>
            </form>
        </div>
    </div>
);

export default JoinGroupCard;