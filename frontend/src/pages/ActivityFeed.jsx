import React, { useState, useEffect, Component } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import api from '../api';

import {
  LayoutDashboard, Activity, CreditCard, Users, Settings, LogOut, Bell,
  AlertTriangle, Edit2, Check, X
} from 'lucide-react';

import DailyExpenseChart from '../components/charts/DailyExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import GroupSpendingChart from '../components/charts/GroupSpendingChart';
import MonthlyComparisonChart from '../components/charts/MonthlyComparisonChart';

import TotalSpentCard from '../components/ActivityFeed/TotalSpentCard';
import TopCategoryCard from '../components/ActivityFeed/TopCategoryCard';
import BudgetRemainingCard from '../components/ActivityFeed/BudgetRemainingCard';
import BudgetProgressCard from '../components/ActivityFeed/BudgetProgressCard';

// ─── 1. PALETAT E SINKRONIZUARA ─────────────────────────────────────────────
const categoryPalette = [
  "#1A3263", "#224482", "#2E58A3", "#3B6CC5", "#547792",
  "#6B8EAB", "#82A5C4", "#9BBCCF", "#FFC570", "#FFD699", "#EFD2B0"
];

const groupPalette = [
  "#1A3263",
  "#224482",
  "#2E58A3",
  "#3B6CC5",
  "#FFC570",
  "#EFD2B0",
];

// ─── Monthly Budget Editor ───────────────────────────────────────────────────
const MonthlyBudgetEditor = ({ budget, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { setTempBudget(budget); }, [budget]);

  const handleSave = async () => {
    const floatBudget = parseFloat(tempBudget);
    if (isNaN(floatBudget) || floatBudget < 0) {
      alert("Please enter a valid budget (0 or greater)");
      return;
    }
    setIsLoading(true);
    try {
      await api.put('/users/me/budget', { monthly_budget: floatBudget });
      if (onSave) onSave(floatBudget);
      setIsEditing(false);
    } catch (err) {
      console.error("Gabim gjatë ruajtjes së buxhetit", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white/70 backdrop-blur px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-tighter text-secondary/50">Monthly Budget</span>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <span className="text-sm font-black text-primary tracking-tight">
              €{Number(budget).toLocaleString('en', { minimumFractionDigits: 2 })}
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-primary">€</span>
              <input
                type="number" step="0.01" min="0" autoFocus value={tempBudget}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || parseFloat(val) >= 0) {
                    setTempBudget(val);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                className="w-24 text-sm font-black text-primary bg-transparent outline-none border-b border-secondary/20 focus:border-accent"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center border-l border-secondary/10 ml-2 pl-2 gap-1">
        {isEditing ? (
          <>
            <button onClick={handleSave} disabled={isLoading} className="text-emerald-600"><Check size={16} /></button>
            <button onClick={() => setIsEditing(false)} className="text-rose-500"><X size={16} /></button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-secondary hover:text-primary"><Edit2 size={14} /></button>
        )}
      </div>
    </div>
  );
};

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ChartErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div className="h-[220px] flex flex-col items-center justify-center text-secondary/30">
        <AlertTriangle size={20} /> <span className="text-xs font-semibold">Chart unavailable</span>
      </div>
    );
    return this.props.children;
  }
}

// ─── Nav Item ────────────────────────────────────────────────────────────────
const NavItem = ({ icon, label, to }) => (
  <NavLink to={to} className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${isActive ? 'bg-secondary/20 text-accent shadow-sm' : 'text-secondary hover:bg-white/5 hover:text-white'}`}>
    {({ isActive }) => (
      <><div className={isActive ? 'text-accent' : 'text-secondary/60'}>{icon}</div><span className="font-bold text-sm">{label}</span>{isActive && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />}</>
    )}
  </NavLink>
);

// ─── Chart Card ──────────────────────────────────────────────────────────────
const ChartCard = ({ title, children, legend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 hover:shadow-md transition-shadow h-full">
    <h3 className="text-xs font-black uppercase tracking-widest text-primary/70 mb-4">{title}</h3>
    <ChartErrorBoundary>{children}</ChartErrorBoundary>
    {legend && (
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {legend.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-semibold text-secondary/80">{item.name}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const ActivityFeed = () => {
  const { user, logout, refreshUser } = useAuth();
  const { analytics, refreshAllData, loading } = useData();
  
  const stats = analytics.stats;
  const charts = analytics.charts;
  // Use user.monthly_budget directly from AuthContext as it's the primary source
  const monthlyBudget = user?.monthly_budget || 1000;

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  if (loading && !stats) {
    return (
      <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl" />
          <p className="text-sm font-black text-primary/40 uppercase tracking-widest">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">
      <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center"><Users className="text-accent" size={20} /></div>
          <span className="text-2xl font-bold">ExpenseMate</span>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" to="/dashboard" />
          <NavItem icon={<Activity size={19} />} label="Activity Feed" to="/activity-feed" />
          <NavItem icon={<CreditCard size={19} />} label="Expenses" to="/expenses" />
          <NavItem icon={<Users size={19} />} label="Groups" to="/dashboard" />
          <NavItem icon={<Settings size={19} />} label="Settings" to="/settings" />
        </nav>
        <div className="p-6 border-t border-white/5 mt-auto">
          <button onClick={logout} className="flex items-center gap-3 text-secondary hover:text-white w-full text-sm font-bold uppercase"><LogOut size={19} />Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-6 flex items-center justify-between border-b bg-white/30 backdrop-blur-md sticky top-0 z-10">
          <div><h1 className="text-xl font-black">Spending Overview</h1><p className="text-sm text-secondary/70 font-semibold">Your real-time financial analysis</p></div>
          <div className="flex items-center gap-4">
            <MonthlyBudgetEditor 
              budget={monthlyBudget} 
              onSave={async () => {
                await refreshUser();
                await refreshAllData();
              }} 
            />
            <div className="w-[1px] h-8 bg-secondary/10 hidden sm:block" />
            <button className="relative p-2 text-secondary hover:text-primary"><Bell size={22} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" /></button>
            <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              <span className="text-sm font-bold">{user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-12 space-y-8 mt-6">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20 text-secondary/40 font-semibold animate-pulse">Loading analytics data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <TotalSpentCard amount={stats?.totalSpentMonth || 0} previousMonthAmount={stats?.totalSpentLastMonth || 0} />
                <TopCategoryCard categoryName={stats?.topCategory?.name || 'N/A'} monthlySpend={stats?.topCategory?.amount || 0} />
                <BudgetRemainingCard remainingAmount={monthlyBudget - (stats?.totalSpentMonth || 0)} totalBudget={monthlyBudget} spentAmount={stats?.totalSpentMonth || 0} />
                <BudgetProgressCard spentAmount={stats?.totalSpentMonth || 0} totalBudget={monthlyBudget} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><ChartCard title="Daily Expense Trends"><DailyExpenseChart data={charts?.dailyTrends || []} /></ChartCard></div>

                {/* CATEGORY DISTRIBUTION - SINKRONIZUAR ME categoryPalette */}
                <ChartCard
                  title="Category Distribution"
                  legend={(charts?.categorySplit || []).map((d, index) => ({
                    name: d.name,
                    color: categoryPalette[index % categoryPalette.length]
                  }))}
                >
                  <CategoryPieChart data={charts?.categorySplit || []} />
                </ChartCard>

                {/* GROUP SPENDING - TANI I SINKRONIZUAR ME groupPalette */}
                <ChartCard
                  title="Group Spending"
                  legend={(charts?.groupSpending || []).map((d, index) => ({
                    name: d.name,
                    color: groupPalette[index % groupPalette.length]
                  }))}
                >
                  <GroupSpendingChart data={charts?.groupSpending || []} />
                </ChartCard>

                <div className="md:col-span-2"><ChartCard title="Monthly Comparison"><MonthlyComparisonChart data={charts?.monthlyComparison || []} /></ChartCard></div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ActivityFeed;