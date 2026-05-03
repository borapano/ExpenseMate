import React from 'react';
import { Trophy, Leaf } from 'lucide-react';

interface Props {
    group: any;
}

interface MemberSpend {
    user_id: string;
    user_name: string;
    totalPaid: number;
}

const GroupSpendingInsights: React.FC<Props> = ({ group }) => {
    const expenses: any[] = group.expenses || [];
    const members: any[] = group.members || [];

    if (members.length < 2 || expenses.length === 0) return null;

    // Build a map of total paid per member
    const spendMap: Record<string, number> = {};
    members.forEach(m => { spendMap[String(m.user_id)] = 0; });
    expenses.forEach((e: any) => {
        const pid = String(e.payer_id);
        if (pid in spendMap) {
            spendMap[pid] = (spendMap[pid] || 0) + Number(e.amount || 0);
        }
    });

    const memberSpends: MemberSpend[] = members.map(m => ({
        user_id: String(m.user_id),
        user_name: m.user_name,
        totalPaid: spendMap[String(m.user_id)] || 0,
    }));

    // Only consider members who paid at least something for "biggest spender"
    const spenders = memberSpends.filter(m => m.totalPaid > 0);
    if (spenders.length === 0) return null;

    const maxPaid = Math.max(...spenders.map(m => m.totalPaid));
    const minPaid = Math.min(...memberSpends.map(m => m.totalPaid));

    const biggestSpenders = spenders.filter(m => m.totalPaid === maxPaid);
    const lightestWallets = memberSpends.filter(m => m.totalPaid === minPaid);

    const renderNames = (items: MemberSpend[]): string => {
        if (items.length === 1) return items[0].user_name;
        if (items.length === 2) return `${items[0].user_name} & ${items[1].user_name}`;
        return `${items.slice(0, -1).map(i => i.user_name).join(', ')} & ${items[items.length - 1].user_name}`;
    };

    const initials = (name: string): string => name.charAt(0).toUpperCase();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-5">
                Spending Insights
            </h3>

            <div className="space-y-4">
                {/* Biggest Spender */}
                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100/80">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Trophy size={18} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-0.5">
                            {biggestSpenders.length > 1 ? 'Top Spenders (tie)' : 'Biggest Spender'}
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                                {biggestSpenders.slice(0, 3).map(m => (
                                    <div
                                        key={m.user_id}
                                        className="w-6 h-6 rounded-full bg-primary text-accent text-[9px] font-black flex items-center justify-center border-2 border-amber-50"
                                    >
                                        {initials(m.user_name)}
                                    </div>
                                ))}
                            </div>
                            <p className="font-black text-sm text-primary truncate">
                                {renderNames(biggestSpenders)}
                            </p>
                        </div>
                    </div>
                    <p className="font-black text-sm text-amber-700 shrink-0">
                        €{maxPaid.toFixed(2)}
                    </p>
                </div>

                {/* Lightest Wallet */}
                {minPaid !== maxPaid && (
                    <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100/80">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <Leaf size={18} className="text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">
                                {lightestWallets.length > 1 ? 'Lightest Wallets (tie)' : 'Lightest Wallet'}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-1.5">
                                    {lightestWallets.slice(0, 3).map(m => (
                                        <div
                                            key={m.user_id}
                                            className="w-6 h-6 rounded-full bg-primary text-accent text-[9px] font-black flex items-center justify-center border-2 border-emerald-50"
                                        >
                                            {initials(m.user_name)}
                                        </div>
                                    ))}
                                </div>
                                <p className="font-black text-sm text-primary truncate">
                                    {renderNames(lightestWallets)}
                                </p>
                            </div>
                        </div>
                        <p className="font-black text-sm text-emerald-700 shrink-0">
                            €{minPaid.toFixed(2)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupSpendingInsights;
