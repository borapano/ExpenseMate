import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from './api';
import { useAuth } from './AuthContext';

interface Expense {
    id: string;
    description: string;
    amount: number;
    payer_id: string;
    payer_name: string;
    group_id: string;
    group_name: string;
    category?: string;
    expense_date?: string;
    date?: string;
    participants?: any[];
}

interface Group {
    id: string;
    name: string;
    description: string;
    code: string;
    net_balance?: number;
    total_spending?: number;
    members?: any[];
}

interface SettlementDashboard {
    global_debts: any[];
    global_requests: any[];
    expected_payments: any[];
    total_owed_to_me: number;
    total_gross_debt: number;
    effective_total: number;
    total_pending_sent: number;
    total_pending_received: number;
    effective_receive_total: number;
}

interface Analytics {
    stats: any;
    charts: any;
}

interface SpendingHistory {
    monthly_spend: number;
    monthly_data: any[];
}

interface DataContextType {
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    totalExpenses: number;
    setTotalExpenses: React.Dispatch<React.SetStateAction<number>>;
    groups: Group[];
    setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
    settlementDashboard: SettlementDashboard | null;
    analytics: Analytics;
    spendingHistory: SpendingHistory;
    loading: boolean;
    initialLoadDone: boolean;
    refreshAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [groups, setGroups] = useState<Group[]>([]);
    const [settlementDashboard, setSettlementDashboard] = useState<SettlementDashboard | null>(null);
    const [analytics, setAnalytics] = useState<Analytics>({ stats: null, charts: null });
    const [spendingHistory, setSpendingHistory] = useState<SpendingHistory>({ monthly_spend: 0, monthly_data: [] });
    
    const [loading, setLoading] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    const refreshAllData = useCallback(async () => {
        if (!isAuthenticated) return;
        
        try {
            setLoading(true);
            const [expensesRes, groupsRes, dashboardRes, statsRes, chartsRes, historyRes] = await Promise.all([
                api.get('/users/me/expenses?limit=50&offset=0'),
                api.get('/groups/me'),
                api.get('/users/me/settlement_dashboard'),
                api.get('/users/me/analytics/stats'),
                api.get('/users/me/analytics/charts'),
                api.get('/users/me/spending-history')
            ]);

            console.log("DEBUG FRONTEND DATA - Dashboard:", dashboardRes.data);
            console.log("DEBUG FRONTEND DATA - Expenses:", expensesRes.data);
            
            setExpenses(expensesRes.data?.expenses || []);
            setTotalExpenses(expensesRes.data?.total || 0);
            setGroups(groupsRes.data || []);
            setSettlementDashboard(dashboardRes.data || null);
            setAnalytics({
                stats: statsRes.data || null,
                charts: chartsRes.data || null
            });
            setSpendingHistory({
                monthly_spend: historyRes.data?.monthly_spend || 0,
                monthly_data: historyRes.data?.monthly_data || []
            });
            
            setInitialLoadDone(true);
        } catch (error) {
            console.error('[DataContext] Global Refresh Error:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial load on mount or auth change
    useEffect(() => {
        if (isAuthenticated) {
            refreshAllData();
        } else {
            // Reset state on logout
            setExpenses([]);
            setGroups([]);
            setSettlementDashboard(null);
            setAnalytics({ stats: null, charts: null });
            setSpendingHistory({ monthly_spend: 0, monthly_data: [] });
            setInitialLoadDone(false);
        }
    }, [isAuthenticated, refreshAllData]);

    const value: DataContextType = {
        expenses,
        setExpenses,
        totalExpenses,
        setTotalExpenses,
        groups,
        setGroups,
        settlementDashboard,
        analytics,
        spendingHistory,
        loading,
        initialLoadDone,
        refreshAllData
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
