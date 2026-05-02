import React, { useState, useEffect, useRef } from 'react';
import { Hash, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../api';

interface JoinGroupCardProps {
    inviteCode: string;
    setInviteCode: (code: string) => void;
    onJoin: (e: React.FormEvent) => void;
    isJoining: boolean;
    userGroups: Array<{ code: string; name: string }>;
}

type CodeStatus = 'idle' | 'already_member' | 'checking' | 'not_found' | 'valid';

const JoinGroupCard: React.FC<JoinGroupCardProps> = ({
    inviteCode,
    setInviteCode,
    onJoin,
    isJoining,
    userGroups,
}) => {
    const [codeStatus, setCodeStatus] = useState<CodeStatus>('idle');
    const [memberGroupName, setMemberGroupName] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const charsLeft = 6 - inviteCode.length;
    const isReady = inviteCode.length === 6 && codeStatus === 'valid';

    useEffect(() => {
        // Anulo çdo request të mëparshëm
        if (abortRef.current) abortRef.current.abort();

        if (inviteCode.length < 6) {
            setCodeStatus('idle');
            setMemberGroupName('');
            return;
        }

        // Check client-side: already a member?
        const existing = userGroups.find(g => g.code === inviteCode);
        if (existing) {
            setCodeStatus('already_member');
            setMemberGroupName(existing.name);
            return;
        }

        // Check via API: does this code exist?
        const controller = new AbortController();
        abortRef.current = controller;
        setCodeStatus('checking');

        api.get(`/groups/validate/${inviteCode}`, { signal: controller.signal })
            .then(res => {
                setCodeStatus(res.data.exists ? 'valid' : 'not_found');
            })
            .catch(err => {
                if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
                setCodeStatus('not_found');
            });

        return () => controller.abort();
    }, [inviteCode, userGroups]);

    const renderStatus = () => {
        if (inviteCode.length === 0) {
            return (
                <span className="text-[10px] text-secondary/30 font-semibold">
                    6 characters required
                </span>
            );
        }
        if (inviteCode.length < 6) {
            return (
                <span className="text-[10px] text-secondary/40 font-semibold">
                    {charsLeft} {charsLeft === 1 ? 'character' : 'characters'} left
                </span>
            );
        }
        switch (codeStatus) {
            case 'checking':
                return (
                    <span className="flex items-center gap-1 text-[10px] text-secondary/40 font-semibold">
                        <Loader2 size={10} className="animate-spin" />
                        Checking...
                    </span>
                );
            case 'already_member':
                return (
                    <span className="flex items-center gap-1.5 text-[10px] text-amber-500 font-black">
                        <AlertCircle size={10} />
                        You're already in "{memberGroupName}"
                    </span>
                );
            case 'not_found':
                return (
                    <span className="flex items-center gap-1.5 text-[10px] text-red-500 font-black">
                        <AlertCircle size={10} />
                        This code doesn't exist
                    </span>
                );
            case 'valid':
                return (
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black">
                        <CheckCircle size={10} />
                        Ready to join
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white border border-secondary/10 rounded-2xl shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">
                        Have a code?
                    </span>
                    <h2 className="text-base font-black text-primary tracking-tight">
                        Join a Group
                    </h2>
                    <p className="text-[11px] font-semibold text-secondary/50 whitespace-nowrap">
                        Enter your 6-character invite code to join an existing group.
                    </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-[#F7F4F0] border border-secondary/10 flex items-center justify-center shrink-0">
                    <Hash size={18} className="text-secondary/40" strokeWidth={2} />
                </div>
            </div>

            {/* Form */}
            <form onSubmit={onJoin} className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                        <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/30" />
                        <input
                            type="text"
                            placeholder="e.g. AB12CD"
                            maxLength={6}
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="w-full pl-8 pr-3 py-2.5 bg-[#F7F4F0] border border-secondary/10 rounded-xl text-sm font-black uppercase text-primary tracking-widest outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-secondary/25 placeholder:tracking-normal placeholder:font-semibold placeholder:normal-case"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isJoining || !isReady}
                        className="flex items-center gap-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
                    >
                        {isJoining ? (
                            <span className="animate-pulse">...</span>
                        ) : (
                            <>
                                Join
                                <ArrowRight
                                    size={12}
                                    strokeWidth={2.5}
                                    className={`transition-transform duration-200 ${isReady ? 'translate-x-0.5' : ''}`}
                                />
                            </>
                        )}
                    </button>
                </div>

                {/* Status message */}
                <div className="flex items-center justify-end px-1 min-h-[16px]">
                    {renderStatus()}
                </div>
            </form>

        </div>
    );
};

export default JoinGroupCard;