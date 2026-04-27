import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import {
    LayoutDashboard, Activity, CreditCard, Users, Settings, LogOut, Bell, CheckCircle
} from 'lucide-react';

import NetBalanceCard from '../components/NetBalanceCard';
import FinancialHealthCard from '../components/FinancialHealthCard';
import MonthlyGraphCard from '../components/MonthlyGraphCard';
import GroupCard from '../components/GroupCard';
import CreateGroupCard from '../components/CreateGroupCard';
import { CreateGroupModal, JoinGroupModal } from '../components/GroupModals';

const NavItem = ({ icon, label, to }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                isActive
                    ? 'bg-secondary/20 text-accent shadow-sm'
                    : 'text-secondary hover:bg-white/5 hover:text-white'
            }`
        }
    >
        {({ isActive }) => (
            <>
                <div className={isActive ? 'text-accent' : 'text-secondary/60'}>{icon}</div>
                <span className="font-bold text-sm tracking-wide">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />}
            </>
        )}
    </NavLink>
);

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // States të reja për Settlements
    const [globalDebts, setGlobalDebts] = useState([]);
    const [globalRequests, setGlobalRequests] = useState([]);

    const [stats, setStats] = useState({
        net_balance: 0,
        total_owed_to_you: 0,
        total_you_owe: 0,
        monthly_spend: 0,
        monthly_data: []
    });

    const fetchData = async () => {
        try {
            setLoading(true);

            const [groupsRes, stlRes, historyRes] = await Promise.all([
                api.get('/groups/me'),
                api.get('/users/me/settlement_dashboard'),
                api.get('/users/me/spending-history')
            ]);

            const groupsData = groupsRes.data || [];
            setGroups(groupsData);

            // Setojmë listat e borxheve nga Endpoint i ri
            setGlobalDebts(stlRes.data.global_debts || []);
            setGlobalRequests(stlRes.data.global_requests || []);

            let net = 0;
            let owedToYou = 0;
            let youOwe = 0;

            groupsData.forEach(group => {
                const balance = Number(group.net_balance || 0);
                net += balance;
                if (balance > 0) {
                    owedToYou += balance;
                } else if (balance < 0) {
                    youOwe += Math.abs(balance);
                }
            });

            setStats({
                net_balance: net,
                total_owed_to_you: owedToYou,
                total_you_owe: youOwe,
                monthly_spend: historyRes.data.monthly_spend || 0,
                monthly_data: historyRes.data.monthly_data || []
            });

            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Action Handlers për Settlements
    const handleConfirmRequest = async (id) => {
        try {
            await api.patch(`/settlements/${id}/confirm`);
            fetchData();
        } catch (err) {
            alert("Gabim në konfirmim!");
        }
    };

    const handleRejectRequest = async (id) => {
        try {
            await api.patch(`/settlements/${id}/reject`);
            fetchData();
        } catch (err) {
            alert("Gabim në refuzim!");
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#F7F4F0] z-[999] flex flex-col items-center justify-center">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <Users className="text-accent" size={28} />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-primary">ExpenseMate</span>
                </div>
                <div className="mt-6 w-48 h-1 bg-secondary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent animate-[loading_1.5s_infinite]"></div>
                </div>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes loading {
                        0% { width: 0%; transform: translateX(-100%); }
                        50% { width: 100%; transform: translateX(0%); }
                        100% { width: 0%; transform: translateX(100%); }
                    }
                `}} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">
            {/* SIDEBAR */}
            <aside className="w-64 bg-primary text-white flex flex-col hidden md:flex shrink-0">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                        <Users className="text-accent" size={20} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">ExpenseMate</span>
                </div>
                <nav className="flex-1 px-4 space-y-1 mt-4">
                    <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard"     to="/dashboard" />
                    <NavItem icon={<Activity size={19} />}        label="Activity Feed" to="/activity-feed" />
                    <NavItem icon={<CreditCard size={19} />}      label="Expenses"      to="/expenses" />
                    <NavItem icon={<Users size={19} />}           label="Groups"        to="/dashboard" />
                    <NavItem icon={<Settings size={19} />}        label="Settings"      to="/settings" />
                </nav>
                <div className="p-6 border-t border-white/5 mt-auto">
                    <button onClick={logout} className="flex items-center gap-3 text-secondary hover:text-white transition-colors w-full group text-sm font-bold uppercase tracking-widest">
                        <LogOut size={19} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="px-8 py-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        Dashboard: <span className="font-medium text-secondary text-base">Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋</span>
                    </h2>
                    <div className="flex items-center gap-5">
                        <button className="relative p-2 text-secondary hover:text-primary"><Bell size={22} /></button>
                        <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold shadow-inner border border-white/10">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-bold tracking-tight">{user?.name || 'User'}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-10">
                    {/* Rreshti i Parë: Net Balance dhe Grafiku */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 items-start">
                        <div className="lg:col-span-4">
                            <NetBalanceCard data={{ net_balance: stats.net_balance }} />
                        </div>

                        <div className="lg:col-span-8">
                            <MonthlyGraphCard data={{
                                monthly_spend: stats.monthly_spend,
                                monthly_data: stats.monthly_data
                            }} />
                        </div>
                    </div>

                    {/* Rreshti i Dytë: Grupet dhe Action Center */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-8 px-2 h-[32px]">
                                <h3 className="text-base font-black uppercase tracking-widest text-primary/80 italic leading-none">Group Grid</h3>
                                <button onClick={() => setIsJoinOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-all border-b-2 border-transparent hover:border-accent">
                                    + Join with Code
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <CreateGroupCard onClick={() => setIsCreateOpen(true)} />
                                {groups?.map(group => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="mb-8 px-2 h-[32px] flex items-center">
                                <h3 className="text-base font-black uppercase tracking-widest text-primary/80 text-sm leading-none">Action Center</h3>
                            </div>

                            <div className="space-y-6">
                                <FinancialHealthCard
                                    data={{
                                        total_owed_to_you: stats.total_owed_to_you,
                                        total_you_owe: stats.total_you_owe
                                    }}
                                />

                                {/* ---------------- ✅ SEKSIONI I RI I BORXHEVE ---------------- */}

                                {/* Kërkesat në Pritje (Të tjerët të kanë dërguar lekë) */}
                                {globalRequests.length > 0 && (
                                    <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] shadow-sm border border-emerald-100/50">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-4 flex items-center gap-2">
                                            <CheckCircle size={14} /> Konfirmo Pagesat
                                        </h4>
                                        <div className="space-y-3">
                                            {globalRequests.map(req => (
                                                <div key={req.id} className="bg-white p-4 rounded-[1.5rem] flex flex-col gap-3 shadow-sm border border-emerald-50">
                                                    <div>
                                                        <p className="font-bold text-primary text-sm">{req.sender_name}</p>
                                                        <p className="text-xs text-secondary/80">Të ka dërguar <span className="font-black text-emerald-600">{req.amount}€</span></p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleConfirmRequest(req.id)} className="flex-1 bg-emerald-500 text-white text-[11px] uppercase tracking-wider font-bold py-2 rounded-xl hover:bg-emerald-600 transition-colors">Konfirmo</button>
                                                        <button onClick={() => handleRejectRequest(req.id)} className="flex-1 bg-red-500 text-white text-[11px] uppercase tracking-wider font-bold py-2 rounded-xl hover:bg-red-600 transition-colors">Refuzo</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Borxhet Globale (Ti u detyrohesh të tjerëve) */}
                                {globalDebts.length > 0 && (
                                    <div className="bg-red-50/50 p-6 rounded-[2.5rem] shadow-sm border border-red-100/50 mt-6">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-red-800 mb-4 flex items-center gap-2">
                                            <CreditCard size={14} /> Borxhet e Mia
                                        </h4>
                                        <div className="space-y-3">
                                            {globalDebts.map(debt => (
                                                <div key={`${debt.group_id}-${debt.user_id}`} className="bg-white p-4 rounded-[1.5rem] flex justify-between items-center shadow-sm border border-red-50">
                                                    <div>
                                                        <p className="font-bold text-primary text-sm">{debt.user_name}</p>
                                                        <p className="text-xs text-secondary/80">Në: {debt.group_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-red-600">{debt.amount}€</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Nëse s'ka borxhe ose kërkesa, shfaqim një mesazh pozitiv */}
                                {globalRequests.length === 0 && globalDebts.length === 0 && (
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-secondary/5 text-center py-10 opacity-60">
                                        <p className="text-secondary/40 text-[10px] font-bold uppercase tracking-[0.2em]">Të gjitha borxhet janë të shlyera</p>
                                    </div>
                                )}

                                {/* ----------------------------------------------------------------- */}

                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchData} />
            <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchData} />
        </div>
    );
};

export default Dashboard;