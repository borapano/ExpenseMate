import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import {
    LayoutDashboard, Activity, CreditCard, Users, Settings, LogOut, Bell
} from 'lucide-react';

import NetBalanceCard from '../components/NetBalanceCard';
import FinancialHealthCard from '../components/FinancialHealthCard';
import MonthlyGraphCard from '../components/MonthlyGraphCard';
import GroupCard from '../components/GroupCard';
import CreateGroupCard from '../components/CreateGroupCard';
import { CreateGroupModal, JoinGroupModal } from '../components/GroupModals';

const NavItem = ({ icon, label, active = false }) => (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${active ? 'bg-secondary/20 text-accent shadow-sm' : 'text-secondary hover:bg-white/5 hover:text-white'}`}>
        <div className={active ? 'text-accent' : 'text-secondary/60'}>{icon}</div>
        <span className="font-bold text-sm tracking-wide">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full"></div>}
    </div>
);

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [groups, setGroups] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [loading, setLoading] = useState(true);

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

            // 1. Thirrja në API: Marrim të gjitha grupet ku përdoruesi është anëtar
            const groupsRes = await api.get('/groups/me');
            const groupsData = groupsRes.data || [];
            setGroups(groupsData);

            // 2. Llogaritja e Balancave në Frontend (duke u bazuar te të dhënat e Backend)
            let net = 0;
            let owedToYou = 0;
            let youOwe = 0;

            // Iterojmë nëpër grupe për të llogaritur shifrat e NetBalance dhe FinancialHealth
            groupsData.forEach(group => {
                // Konvertojmë user_balance në numër (backend e kthen si Decimal/String)
                const balance = Number(group.user_balance || 0);

                net += balance;
                if (balance > 0) {
                    owedToYou += balance;
                } else if (balance < 0) {
                    youOwe += Math.abs(balance);
                }
            });

            // 3. Përditësojmë state-in me vlerat reale
            setStats({
                net_balance: net,
                total_owed_to_you: owedToYou,
                total_you_owe: youOwe,
                monthly_spend: 0, // Kjo do të kërkojë endpoint-in e ri analytics në backend
                monthly_data: [35, 55, 40, 75, 60, 90, 100, 65, 80, 70] // Mock për momentin
            });

            // I japim pak kohë procesit për të shmangur fluturimin e menjëhershëm të loading
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Global Loading Screen (mbetet i paprekur siç e kërkove)
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
                    <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" active />
                    <NavItem icon={<Activity size={19} />} label="Activity Feed" />
                    <NavItem icon={<CreditCard size={19} />} label="Expenses" />
                    <NavItem icon={<Users size={19} />} label="Groups" />
                    <NavItem icon={<Settings size={19} />} label="Settings" />
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
                            {/* Tani i pasojmë vlerën e llogaritur nga loop-i i API-së */}
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
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-secondary/5 text-center py-10 opacity-60">
                                    <p className="text-secondary/40 text-[10px] font-bold uppercase tracking-[0.2em]">Debts List Coming Soon</p>
                                </div>
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