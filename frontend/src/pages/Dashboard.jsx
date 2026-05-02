import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
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
            `flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${isActive
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
    const {
        groups,
        settlementDashboard,
        spendingHistory,
        loading,
        refreshAllData
    } = useData();
    const navigate = useNavigate();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);

    // Derived states from context - Unified Source of Truth
    const globalDebts = settlementDashboard?.global_debts || [];
    const globalRequests = settlementDashboard?.global_requests || [];
    const expectedPayments = settlementDashboard?.expected_payments || [];

    const stats = useMemo(() => ({
        net_balance: settlementDashboard?.effective_receive_total || 0, // Using effective for net display
        total_owed_to_you: settlementDashboard?.total_owed_to_me || 0,
        total_you_owe: settlementDashboard?.total_gross_debt || 0,
        monthly_spend: spendingHistory.monthly_spend,
        monthly_data: spendingHistory.monthly_data
    }), [settlementDashboard, spendingHistory]);

    console.log("Component Data (Dashboard):", { globalDebts, globalRequests, expectedPayments, stats });

    // Initial load is handled by DataContext
    useEffect(() => {
        refreshAllData();
    }, [refreshAllData]);

    const handleConfirmRequest = async (id) => {
        try {
            await api.patch(`/settlements/${id}/confirm`);
            refreshAllData();
        } catch (err) {
            console.error("Confirmation error", err);
        }
    };

    const handleRejectRequest = async (id) => {
        try {
            await api.patch(`/settlements/${id}/reject`);
            refreshAllData();
        } catch (err) {
            console.error("Rejection error", err);
        }
    };

    if (loading && !settlementDashboard) {
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
                    <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" to="/dashboard" />
                    <NavItem icon={<Activity size={19} />} label="Activity Feed" to="/activity-feed" />
                    <NavItem icon={<CreditCard size={19} />} label="Expenses" to="/expenses" />
                    <NavItem icon={<Users size={19} />} label="Groups" to="/groups" />
                    <NavItem icon={<Settings size={19} />} label="Settings" to="/settings" />
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 items-start">
                        <div className="lg:col-span-4">
                            <NetBalanceCard data={{ net_balance: settlementDashboard?.effective_total || 0 }} />
                        </div>
                        <div className="lg:col-span-8">
                            <MonthlyGraphCard data={{
                                monthly_spend: stats.monthly_spend,
                                monthly_data: stats.monthly_data
                            }} />
                        </div>
                    </div>

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
                                        total_owed_to_you: stats?.total_owed_to_you || 0,
                                        total_you_owe: stats?.total_you_owe || 0
                                    }}
                                />

                                {/* ─── ACTION CENTER: INCOMING REQUESTS ─── */}
                                {globalRequests.length > 0 && (
                                    <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] shadow-sm border border-emerald-100/50">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-4 flex items-center gap-2">
                                            <CheckCircle size={14} /> To Verify
                                        </h4>
                                        <div className="space-y-3">
                                            {(globalRequests || []).map(req => (
                                                <div key={req.id} className="bg-white p-4 rounded-[1.5rem] flex flex-col gap-3 shadow-sm border border-emerald-50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-primary text-sm">{req.sender_name}</p>
                                                            <p className="text-[10px] text-secondary/60 uppercase font-bold">{req.group_name}</p>
                                                        </div>
                                                        <p className="font-black text-emerald-600">€{req.amount}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleConfirmRequest(req.id)} className="flex-1 bg-primary text-white text-[11px] uppercase tracking-wider font-bold py-2 rounded-xl hover:bg-primary/90 transition-all">Confirm</button>
                                                        <button onClick={() => handleRejectRequest(req.id)} className="flex-1 bg-white border border-secondary/20 text-secondary text-[11px] uppercase tracking-wider font-bold py-2 rounded-xl hover:bg-gray-50 transition-all">Reject</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ─── ACTION CENTER: DEBTS & PENDING ─── */}
                                {(globalDebts.length > 0 || expectedPayments.length > 0) && (
                                    <div className="bg-red-50/50 p-6 rounded-[2.5rem] shadow-sm border border-red-100/50 mt-6">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-red-800 mb-4 flex items-center gap-2">
                                            <CreditCard size={14} /> Debts to Settle
                                        </h4>
                                        <div className="space-y-3">
                                            {/* To Pay */}
                                            {(globalDebts || []).map(debt => (
                                                <div key={`debt-${debt.group_id}-${debt.user_id}`} className="bg-white p-4 rounded-[1.5rem] flex justify-between items-center shadow-sm border border-red-50">
                                                    <div>
                                                        <p className="font-bold text-primary text-sm">{debt.user_name}</p>
                                                        <p className="text-[10px] text-secondary/60 uppercase font-bold">{debt.group_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-red-600">-€{debt.effective_amount || debt.amount}</p>
                                                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">To Pay</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Awaiting Confirmation */}
                                            {(expectedPayments || []).map(exp => (
                                                <div key={`exp-${exp.group_id}-${exp.user_id}`} className="bg-amber-50/50 p-4 rounded-[1.5rem] flex justify-between items-center shadow-sm border border-amber-100/50">
                                                    <div>
                                                        <p className="font-bold text-amber-900 text-sm">{exp.user_name}</p>
                                                        <p className="text-[10px] text-amber-700/60 uppercase font-bold">{exp.group_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-amber-600">-€{exp.amount}</p>
                                                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter flex items-center gap-1 justify-end">
                                                            <Clock size={10} /> Awaiting Confirmation
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* S'ka asgjë */}
                                {globalRequests.length === 0 && globalDebts.length === 0 && expectedPayments.length === 0 && (
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-secondary/5 text-center py-10 opacity-60">
                                        <p className="text-secondary/40 text-[10px] font-bold uppercase tracking-[0.2em]">All settled up</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={refreshAllData} />
            <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={refreshAllData} />
        </div>
    );
};

export default Dashboard;