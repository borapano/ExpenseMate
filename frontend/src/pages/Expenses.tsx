import React, { useState, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { useData } from '../DataContext';
import {
    LayoutDashboard, Activity, CreditCard, Users, Settings, LogOut,
    ShieldCheck, AlertCircle
} from 'lucide-react';

import {
    ToReceiveCard,
    ToPayCard,
    PendingRequestsCard,
    DebtsToSettleCard,
    ExpenseHistoryCard
} from '../components/Expenses';
import SettleUpModal from '../components/SettleUpModal';

/*
 * Expenses Page — Full data flow:
 *
 * 1. DataContext.refreshAllData() fetches 6 endpoints on auth:
 *    - /users/me/expenses            → expenses[]
 *    - /users/me/settlement_dashboard → settlementDashboard
 *    - /groups/me, /analytics, etc.
 *
 * 2. settlementDashboard provides:
 *    - global_debts[]         → DebtsToSettleCard
 *    - global_requests[]      → PendingRequestsCard (Section 1: incoming confirmations)
 *    - expected_payments[]    → PendingRequestsCard (Section 2: receivables)
 *    - Totals for ToPayCard and ToReceiveCard
 *
 * 3. expenses[] provides:
 *    - Each expense has transaction_status (NONE, PENDING, CONFIRMED)
 *    - ExpenseHistoryCard renders status from this field
 *
 * 4. Actions (Pay, Confirm, Reject) → API call → refreshAllData() → all cards update.
 */

// ── Sidebar NavItem ──────────────────────────────────────────────────────────
const NavItem = ({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${isActive
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

// ── Page ─────────────────────────────────────────────────────────────────────
const Expenses: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const {
        expenses,
        setExpenses,
        totalExpenses,
        setTotalExpenses,
        groups,
        settlementDashboard,
        loading,
        refreshAllData,
    } = useData();
    const recentGroups = [...(groups || [])].sort((a, b) => Number(b.id) - Number(a.id));

    // ── UI state ──────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<{ id: string | null; name: string }>({ id: null, name: 'All Groups' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(5);

    // When group filter changes → reset pagination
    const handleSetSelectedGroup = (grp: { id: string | null; name: string }) => {
        setSelectedGroup(grp);
        setVisibleCount(5);
        realOffset.current = 0;
    };
    const [payingDebts, setPayingDebts] = useState(new Set<string>());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalData, setModalData] = useState<{ amount: number; receiverName: string; receiverId: string; groupId: string; expenseId: string | null; description?: string; groupName?: string } | null>(null);
    const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'error' } | null>(null);
    const historyRef = useRef<HTMLDivElement | null>(null);
    const realOffset = useRef<number>(0); // tracks true backend offset independently of filters

    // ── Dashboard-derived data ────────────────────────────────────────────
    const pendingSettlementsReceived = settlementDashboard?.global_requests ?? [];
    const payables = settlementDashboard?.global_debts ?? [];
    const receivables = settlementDashboard?.expected_payments ?? [];

    // To Pay card
    // activeToPay = sum of active debts (not pending) — same source as DebtsToSettleCard
    // pendingSent = sum of debts where I sent payment, awaiting confirmation
    const pendingSent = (payables as any[]).filter(d => d.is_pending).reduce((sum, d) => sum + (d?.amount ?? 0), 0);
    const activeToPay = (payables as any[]).filter(d => !d.is_pending).reduce((sum, d) => sum + (d?.amount ?? 0), 0);

    // To Receive card
    // activeToReceive = sum of expected_payments list — same source as PendingRequestsCard Active Credits
    // pendingReceived = sum of incoming settlements awaiting my confirmation — same source as PendingRequestsCard Action Required
    const activeToReceive = (receivables as any[]).reduce((sum, r) => sum + (r?.amount ?? 0), 0);
    const pendingReceived = (pendingSettlementsReceived as any[]).reduce((sum, r) => sum + (r?.amount ?? 0), 0);

    // ── Toast helper ──────────────────────────────────────────────────────
    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ title, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // ── Action: Confirm incoming payment ──────────────────────────────────
    const handleConfirmRequest = async (id: string) => {
        try {
            await api.patch(`/settlements/${id}/confirm`);
            showToast('Settlement Confirmed!');
            setVisibleCount(5);
            realOffset.current = 0;
            await refreshAllData();
        } catch {
            showToast('Error confirming settlement', 'error');
        }
    };

    // ── Action: Reject incoming payment ──────────────────────────────────
    const handleRejectRequest = async (id: string) => {
        try {
            await api.patch(`/settlements/${id}/reject`);
            showToast('Settlement Rejected');
            setVisibleCount(5);
            realOffset.current = 0;
            await refreshAllData();
        } catch {
            showToast('Error rejecting settlement', 'error');
        }
    };

    // ── Action: Open pay modal ────────────────────────────────────────────
    const handlePayDebt = (debt: any) => {
        setModalData({
            amount: debt.amount,
            receiverName: debt.receiver_name,
            receiverId: debt.receiver_id,
            groupId: debt.group_id,
            expenseId: debt.expense_id,
            description: debt.expense_description,
            groupName: debt.group_name,
        });
        setIsModalOpen(true);
    };

    // ── Action: Confirm payment in modal → POST /settlements/ ─────────────
    const confirmPayment = async () => {
        if (!modalData || isSubmitting) return;
        const debtId = modalData.expenseId ?? modalData.receiverId;

        setIsSubmitting(true);
        setPayingDebts(prev => new Set(prev).add(debtId));

        try {
            await api.post('/settlements/', {
                amount: modalData.amount,
                group_id: modalData.groupId,
                receiver_id: modalData.receiverId,
                expense_id: modalData.expenseId,
            });
            showToast('Payment submitted! Awaiting confirmation.');
            setIsModalOpen(false);
            setModalData(null);
            setVisibleCount(5);
            realOffset.current = 0;
            await refreshAllData();
        } catch (err) {
            setPayingDebts(prev => { const s = new Set(prev); s.delete(debtId); return s; });
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Pagination ────────────────────────────────────────────────────────
    const handleSeeMore = async () => {
        try {
            const offset = realOffset.current;
            const gid = selectedGroup.id ? `&group_id=${selectedGroup.id}` : '';
            const res = await api.get(`/users/me/expenses?limit=5&offset=${offset}${gid}`);
            const newItems = res.data?.expenses ?? [];
            setExpenses(prev => {
                // Avoid duplicates by filtering out items we already have
                const existingIds = new Set(prev.map((e: any) => e.id));
                const fresh = newItems.filter((e: any) => !existingIds.has(e.id));
                return [...prev, ...fresh];
            });
            setTotalExpenses(res.data?.total ?? 0);
            realOffset.current = offset + newItems.length;
            setVisibleCount(c => c + 5);
        } catch {
            showToast('Error loading more expenses', 'error');
        }
    };

    const handleSeeLess = () => {
        // Only collapse visible count — never destroy fetched data
        setVisibleCount(5);
    };

    // ── Filtering ─────────────────────────────────────────────────────────
    const uniqueGroups = useMemo(
        () => [{ id: null, name: 'All Groups' }, ...groups.map(g => ({ id: g.id, name: g.name }))],
        [groups]
    );

    const filteredExpenses = useMemo(
        () => (expenses as any[]).filter(e => {
            if (!e) return false;
            const matchSearch = (e.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchGroup = !selectedGroup.id || e.group_id === selectedGroup.id;
            return matchSearch && matchGroup;
        }),
        [expenses, searchQuery, selectedGroup.id]
    );

    const hasMore = selectedGroup.id
        ? visibleCount < filteredExpenses.length  // local filter active → compare against filtered count
        : expenses.length < totalExpenses;         // no filter → compare against backend total

    // ── Loading guard (show page once dashboard data arrives) ──────────────
    if (loading && !settlementDashboard) {
        return (
            <div className="flex min-h-screen bg-[#F7F4F0] items-center justify-center font-bold text-primary/50 text-sm">
                Loading...
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary relative">

            {/* Toast */}
            {toastMessage && (
                <div className={`fixed top-6 right-8 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 font-bold text-sm tracking-wide transition-all ${toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {toastMessage.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                    {toastMessage.title}
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0 sticky top-0 h-screen">
                <div className="p-8 flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                        <Users className="text-accent" size={20} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">ExpenseMate</span>
                </div>
                <div className="flex-1 flex flex-col min-h-0 px-4 mt-4">
                    <div className="shrink-0 space-y-1">
                        <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" to="/dashboard" />
                        <NavItem icon={<Activity size={19} />} label="Activity Feed" to="/activity-feed" />
                        <NavItem icon={<CreditCard size={19} />} label="Expenses" to="/expenses" />
                        <NavItem icon={<Users size={19} />} label="Groups" to="/groups" />
                    </div>

                    {/* Sub-items under Groups */}
                    {recentGroups.length > 0 && (
                        <div className="overflow-y-auto flex flex-col mt-0.5 custom-scrollbar">
                            {recentGroups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => navigate(`/groups/${group.id}`)}
                                    className="flex items-center pl-10 pr-3 py-1.5 rounded-xl text-left w-full transition-all duration-150 text-secondary/50 hover:bg-white/5 hover:text-white"
                                >
                                    <span className="text-[11px] font-semibold truncate">{group.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 shrink-0">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 text-secondary hover:text-white transition-colors w-full text-sm font-bold uppercase tracking-widest"
                    >
                        <LogOut size={19} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-primary tracking-tight">Expenses</h1>
                        <p className="text-sm text-secondary/70 font-semibold mt-0.5">Manage your transactions</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold tracking-tight">{user?.name}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-6 custom-scrollbar">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ToReceiveCard
                            totalToReceive={activeToReceive}
                            pendingReceived={pendingReceived}
                        />
                        <ToPayCard
                            totalToPay={activeToPay}
                            pendingSent={pendingSent}
                        />
                    </div>

                    {/* Actionable Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PendingRequestsCard
                            pendingSettlements={pendingSettlementsReceived}
                            receivables={receivables}
                            onConfirm={handleConfirmRequest}
                            onReject={handleRejectRequest}
                        />
                        <DebtsToSettleCard
                            payables={payables}
                            payingDebts={payingDebts}
                            onPay={handlePayDebt}
                        />
                    </div>

                    {/* Expense History */}
                    <ExpenseHistoryCard
                        filteredExpenses={filteredExpenses}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedGroup={selectedGroup}
                        setSelectedGroup={handleSetSelectedGroup}
                        uniqueGroups={uniqueGroups}
                        isFilterOpen={isFilterOpen}
                        setIsFilterOpen={setIsFilterOpen}
                        hasMore={hasMore}
                        visibleCount={visibleCount}
                        onSeeMore={handleSeeMore}
                        onSeeLess={handleSeeLess}
                        historyRef={historyRef}
                        user={user}
                    />
                </div>
            </main>

            {/* Payment Modal */}
            <SettleUpModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setModalData(null); }}
                onConfirm={confirmPayment}
                receiverName={modalData?.receiverName}
                amount={modalData?.amount}
                description={modalData?.description}
                groupName={modalData?.groupName}
            />
        </div>
    );
};

export default Expenses;