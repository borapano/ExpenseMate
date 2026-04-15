import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    LayoutDashboard,
    Activity,
    CreditCard,
    Users,
    Settings,
    LogOut,
    Bell,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

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

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await api.get('/groups/me');
            setGroups(response.data || []);
        } catch (error) {
            console.error("Error loading groups:", error);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">
            {/* --- SIDEBAR --- */}
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

            {/* --- MAIN CONTENT --- */}
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
                    {/* Top Row: Balance & Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
                        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-secondary/5 flex flex-col justify-between min-h-[240px]">
                            <span className="text-lg font-bold uppercase tracking-tight text-secondary/80 text-sm">Your Net Balance</span>
                            <div className="my-2">
                                <span className="text-6xl font-black text-emerald-600 tracking-tighter">+45.50</span>
                                <p className="text-emerald-700 font-bold text-xl mt-1 opacity-90">owed (credit)</p>
                            </div>
                            <p className="text-secondary/60 text-xs font-medium uppercase tracking-widest">Across all groups</p>
                        </div>

                        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-secondary/5">
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-lg font-bold">Monthly Spending Overview</span>
                                <span className="text-xs font-black text-primary bg-accent/30 px-4 py-2 rounded-full uppercase tracking-tighter">Spend This Month: $180.00</span>
                            </div>
                            <div className="h-40 w-full flex items-end px-4 py-2 gap-3 bg-[#FAF9F6]/50 rounded-3xl pt-10">
                                {[30, 55, 40, 95, 60, 85, 98, 80, 70, 45].map((h, i) => (
                                    <div key={i} className="flex-1 bg-[#EBB16D] rounded-t-xl transition-all hover:bg-accent group relative shadow-sm" style={{ height: `${h}%` }}>
                                        <div className={`absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-primary text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 z-10 ${h > 75 ? 'top-2' : '-top-9'}`}>
                                            ${h * 2}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Lower Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h3 className="text-base font-black uppercase tracking-widest text-primary/80 italic">Group Grid</h3>
                                <button onClick={() => setIsJoinOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-all border-b-2 border-transparent hover:border-accent">+ Join with Code</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <CreateGroupCard onClick={() => setIsCreateOpen(true)} />
                                {!loading && groups?.map(group => <GroupCard key={group.id} group={group} />)}
                            </div>
                        </div>

                        {/* Action Center */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-base font-black uppercase tracking-widest text-primary/80 px-2 text-sm">Action Center</h3>

                            {/* Financial Health - Lartesia h-[180px] per nivelim fiks */}
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-secondary/5 h-[180px] flex flex-col justify-between">
                                <h4 className="font-bold text-[10px] uppercase tracking-wider text-secondary">Financial Health</h4>
                                <div className="grid grid-cols-2 gap-3 flex-1 items-center">
                                    <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100/50 flex flex-col items-center justify-center">
                                        <span className="text-[8px] font-black text-emerald-800/60 uppercase block mb-1 tracking-tighter text-center">Total Owed To You</span>
                                        <span className="text-xl font-black text-emerald-700">$120.50</span>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-3xl border border-red-100/50 flex flex-col items-center justify-center">
                                        <span className="text-[8px] font-black text-red-800/60 uppercase block mb-1 tracking-tighter text-center">Total You Owe</span>
                                        <span className="text-xl font-black text-red-700">$75.00</span>
                                    </div>
                                </div>
                            </div>

                            {/* Unsettled Debts */}
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-secondary/5">
                                <h4 className="font-bold text-xs mb-5 uppercase tracking-wider text-secondary">Unsettled Debts</h4>
                                <div className="space-y-4">
                                    {/* Item 1 */}
                                    <div className="flex items-center justify-between p-4 bg-[#F7F4F0]/50 hover:bg-surface/20 rounded-3xl transition-all cursor-pointer group border border-transparent hover:border-secondary/10">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-accent border-4 border-white shadow-sm shrink-0">JD</div>
                                            <div className="flex flex-col min-w-0">
                                                <p className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform leading-snug break-words">
                                                    John Doe owes you $12.50
                                                </p>
                                                <p className="text-[11px] text-secondary font-medium tracking-tight opacity-70 italic mt-0.5">Weekend Trip</p>
                                            </div>
                                        </div>
                                        <div className="ml-4 shrink-0">
                                            <TrendingUp className="text-emerald-500" size={20} />
                                        </div>
                                    </div>
                                    {/* Item 2 */}
                                    <div className="flex items-center justify-between p-4 bg-[#F7F4F0]/50 hover:bg-surface/20 rounded-3xl transition-all cursor-pointer group border border-transparent hover:border-secondary/10">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-[10px] font-black text-primary border-4 border-white shadow-sm shrink-0">AS</div>
                                            <div className="flex flex-col min-w-0">
                                                <p className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform leading-snug break-words">
                                                    You owe $45.00 to Anna Smith
                                                </p>
                                                <p className="text-[11px] text-secondary font-medium tracking-tight opacity-70 italic mt-0.5">Apartment 4B</p>
                                            </div>
                                        </div>
                                        <div className="ml-4 shrink-0">
                                            <TrendingDown className="text-danger" size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchGroups} />
            <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchGroups} />
        </div>
    );
};

export default Dashboard;