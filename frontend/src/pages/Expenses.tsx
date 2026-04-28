import React, { useEffect, useState, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
    LayoutDashboard, Activity, CreditCard, Users, Settings, LogOut,
    Bell, ShieldCheck, AlertCircle
} from 'lucide-react';

// Importet e komponenteve të reja
import ToReceiveCard from '../components/Expenses/ToReceiveCard';
import ToPayCard from '../components/Expenses/ToPayCard';
import PendingRequestsCard from '../components/Expenses/PendingRequestsCard';
import DebtsToSettleCard from '../components/Expenses/DebtsToSettleCard';
import ExpenseHistoryCard from '../components/Expenses/ExpenseHistoryCard';

const NavItem = ({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-secondary/20 text-accent shadow-sm' : 'text-secondary hover:bg-white/5 hover:text-white'
            }`}
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

const Expenses: React.FC = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [pendingDebts, setPendingDebts] = useState<any[]>([]);
    const [expectedPayments, setExpectedPayments] = useState<any[]>([]);

    // UI states
    const [searchQuery, setSearchQuery] = useState("");
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<{ id: string | null, name: string }>({ id: null, name: "All Groups" });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Pagination states
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [visibleCount, setVisibleCount] = useState(5);

    const historyRef = useRef<HTMLDivElement | null>(null);

    const [payingDebts, setPayingDebts] = useState(new Set<string>());
    const [toastMessage, setToastMessage] = useState<{ title: string, type: 'success' | 'error' } | null>(null);

    const [amountToReceive, setAmountToReceive] = useState(0);
    const [amountOwed, setAmountOwed] = useState(0);

    // New dashboard totals
    const [effectiveTotal, setEffectiveTotal] = useState(0);
    const [totalPendingSent, setTotalPendingSent] = useState(0);
    const [totalPendingReceived, setTotalPendingReceived] = useState(0);
    const [effectiveReceiveTotal, setEffectiveReceiveTotal] = useState(0);

    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ title, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expensesRes, groupsRes, dashboardRes] = await Promise.all([
                api.get(`/users/me/expenses?limit=5&offset=0${selectedGroup.id ? `&group_id=${selectedGroup.id}` : ''}`),
                api.get('/groups/me'),
                api.get('/users/me/settlement_dashboard')
            ]);
            setExpenses(expensesRes.data?.expenses || []);
            setTotalExpenses(expensesRes.data?.total || 0);
            setGroups(groupsRes.data || []);
            setVisibleCount(5);

            // Fetch from dashboard instead of groups where applicable
            const data = dashboardRes.data;
            setAmountToReceive(data?.total_owed_to_me || 0);
            setAmountOwed(data?.total_gross_debt || 0);
            
            setPendingRequests(data?.global_requests || []);
            setPendingDebts(data?.global_debts || []);
            setExpectedPayments(data?.expected_payments || []);
            
            setEffectiveTotal(data?.effective_total || 0);
            setTotalPendingSent(data?.total_pending_sent || 0);
            
            setTotalPendingReceived(data?.total_pending_received || 0);
            setEffectiveReceiveTotal(data?.effective_receive_total || 0);
            
        } catch (error) {
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSeeMore = async () => {
        try {
            const currentOffset = expenses.length;
            const res = await api.get(`/users/me/expenses?limit=5&offset=${currentOffset}${selectedGroup.id ? `&group_id=${selectedGroup.id}` : ''}`);
            setExpenses(prev => [...prev, ...(res.data?.expenses || [])]);
            setTotalExpenses(res.data?.total || 0);
            setVisibleCount(prev => prev + 5);
        } catch (err) {
            showToast("Error loading more expenses", "error");
        }
    };

    const handleSeeLess = () => {
        setVisibleCount(5);
        // Resetting back to initial 5 expenses
        setExpenses(prev => prev.slice(0, 5));
    };

    useEffect(() => { 
        fetchData(); 
    }, [selectedGroup.id]);

    const handleConfirmRequest = async (id: string) => {
        try {
            await api.patch(`/settlements/${id}/confirm`);
            showToast("Settlement Confirmed!");
            fetchData();
        } catch (err) { showToast("Error confirming settlement", "error"); }
    };

    const handleRejectRequest = async (id: string) => {
        try {
            await api.patch(`/settlements/${id}/reject`);
            showToast("Settlement Rejected", "error");
            fetchData();
        } catch (err) { showToast("Error rejecting settlement", "error"); }
    };

    const handlePayDebt = async (debt: any) => {
        const debtId = `${debt.group_id}-${debt.user_id}`;
        try {
            setPayingDebts(prev => new Set(prev).add(debtId));
            const payload = {
                amount: parseFloat(Number(debt.effective_amount ?? debt.amount).toFixed(2)),
                group_id: debt.group_id,
                receiver_id: debt.user_id
            };
            await api.post('/settlements/', payload);
            showToast("Payment submitted for confirmation!");
            fetchData();
        } catch (err) {
            setPayingDebts(prev => {
                const next = new Set(prev);
                next.delete(debtId);
                return next;
            });
            showToast("Error submitting payment.", "error");
        }
    };

    const uniqueGroups = useMemo(() => {
        return [{ id: null, name: "All Groups" }, ...groups.map(g => ({ id: g.id, name: g.name }))];
    }, [groups]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter((e: any) => {
            return e.description.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [expenses, searchQuery]);

    const hasMore = expenses.length < totalExpenses;

    if (loading) return <div className="flex min-h-screen bg-[#F7F4F0] items-center justify-center font-bold text-primary">Loading...</div>;

    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary relative">
            {toastMessage && (
                <div className={`fixed top-6 right-8 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 font-bold text-sm tracking-wide transition-all ${toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {toastMessage.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                    {toastMessage.title}
                </div>
            )}

            <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0">
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
                    <button onClick={logout} className="flex items-center gap-3 text-secondary hover:text-white transition-colors w-full text-sm font-bold uppercase tracking-widest">
                        <LogOut size={19} /> Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-primary tracking-tight">Expenses</h1>
                        <p className="text-sm text-secondary/70 font-semibold mt-0.5">Manage your transactions</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-secondary hover:text-primary transition-colors">
                            <Bell size={22} />
                            {pendingRequests.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />}
                        </button>
                        <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold tracking-tight">{user?.name}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ToReceiveCard 
                            amount={amountToReceive} 
                            effectiveAmount={effectiveReceiveTotal}
                            pendingAmount={totalPendingReceived}
                        />
                        <ToPayCard
                            amount={amountOwed}
                            effectiveAmount={effectiveTotal}
                            pendingAmount={totalPendingSent}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PendingRequestsCard
                            requests={pendingRequests}
                            expectedPayments={expectedPayments}
                            onConfirm={handleConfirmRequest}
                            onReject={handleRejectRequest}
                        />
                        <DebtsToSettleCard
                            debts={pendingDebts}
                            payingDebts={payingDebts}
                            onPay={handlePayDebt}
                        />
                    </div>

                    <ExpenseHistoryCard
                        filteredExpenses={filteredExpenses}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedGroup={selectedGroup}
                        setSelectedGroup={setSelectedGroup}
                        uniqueGroups={uniqueGroups}
                        isFilterOpen={isFilterOpen}
                        setIsFilterOpen={setIsFilterOpen}
                        hasMore={hasMore}
                        visibleCount={visibleCount}
                        onSeeMore={handleSeeMore}
                        onSeeLess={handleSeeLess}
                        historyRef={historyRef}
                        user={user}
                        pendingDebts={pendingDebts}
                        pendingRequests={pendingRequests}
                    />
                </div>
            </main>
        </div>
    );
};

export default Expenses;