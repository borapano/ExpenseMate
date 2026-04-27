import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard, Activity, CreditCard, Users, Settings, LogOut, Bell,
  TrendingDown, TrendingUp, Wallet, Tag, ShoppingCart, Zap, Bus, Film,
  Heart, ArrowRightLeft, Utensils, ChevronDown, CalendarDays,
} from 'lucide-react';

import DailyExpenseChart     from '../components/charts/DailyExpenseChart';
import CategoryPieChart      from '../components/charts/CategoryPieChart';
import GroupSpendingChart    from '../components/charts/GroupSpendingChart';
import MonthlyComparisonChart from '../components/charts/MonthlyComparisonChart';

import {
  statCards,
  dailyExpenseData,
  categoryData,
  groupSpendingData,
  monthlyComparisonData,
  recentTransactions,
} from '../data/activityMockData';

// ─── Sidebar Nav Item ────────────────────────────────────────────────────────
const NavItem = ({ icon, label, active = false, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200
      ${active
        ? 'bg-secondary/20 text-accent shadow-sm'
        : 'text-secondary hover:bg-white/5 hover:text-white'}`}
  >
    <div className={active ? 'text-accent' : 'text-secondary/60'}>{icon}</div>
    <span className="font-bold text-sm tracking-wide">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />}
  </div>
);

// ─── Category icon lookup ─────────────────────────────────────────────────────
const categoryIconMap = {
  'Food & Dining':  <Utensils   size={16} />,
  'Transport':      <Bus        size={16} />,
  'Utilities':      <Zap        size={16} />,
  'Entertainment':  <Film       size={16} />,
  'Healthcare':     <Heart      size={16} />,
  'Shopping':       <ShoppingCart size={16} />,
  'Transfer':       <ArrowRightLeft size={16} />,
};

const categoryColorMap = {
  'Food & Dining':  'bg-amber-100 text-amber-700',
  'Transport':      'bg-sky-100 text-sky-700',
  'Utilities':      'bg-violet-100 text-violet-700',
  'Entertainment':  'bg-pink-100 text-pink-700',
  'Healthcare':     'bg-rose-100 text-rose-700',
  'Shopping':       'bg-emerald-100 text-emerald-700',
  'Transfer':       'bg-indigo-100 text-indigo-700',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, trend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">{label}</span>
      <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
    <p className="text-2xl font-black text-primary tracking-tight">{value}</p>
    {sub && (
      <p className="text-xs text-secondary/70 font-semibold flex items-center gap-1">
        {trend === 'up'   && <TrendingUp   size={12} className="text-emerald-500" />}
        {trend === 'down' && <TrendingDown size={12} className="text-danger" />}
        {sub}
      </p>
    )}
  </div>
);

// ─── Chart Card wrapper ───────────────────────────────────────────────────────
const ChartCard = ({ title, children, legend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 hover:shadow-md transition-shadow duration-200">
    <h3 className="text-xs font-black uppercase tracking-widest text-primary/70 mb-4">{title}</h3>
    {children}
    {legend && (
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {legend.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-semibold text-secondary/80">{item.name}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Date Range Picker (mock) ─────────────────────────────────────────────────
const DateRangePicker = () => {
  const ranges = ['This Week', 'This Month', 'Last Month', 'Last 3 Months', 'This Year'];
  const [selected, setSelected] = useState('This Month');
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-secondary/20 text-primary text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
      >
        <CalendarDays size={15} className="text-accent" />
        {selected}
        <ChevronDown size={14} className={`text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-secondary/10 rounded-2xl shadow-xl z-50 overflow-hidden">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => { setSelected(r); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors
                ${selected === r ? 'bg-primary text-accent' : 'text-primary hover:bg-surface/50'}`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Transaction Row ──────────────────────────────────────────────────────────
const TransactionRow = ({ tx }) => {
  const isPositive = tx.amount > 0;
  const icon   = categoryIconMap[tx.category] || <Tag size={16} />;
  const colors = categoryColorMap[tx.category] || 'bg-gray-100 text-gray-600';
  const dateObj = new Date(tx.date);
  const formatted = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface/40 transition-colors duration-150 group cursor-pointer">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary truncate group-hover:text-secondary transition-colors">{tx.name}</p>
        <p className="text-[10px] text-secondary/60 font-semibold">{tx.category} · {formatted}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-danger'}`}>
          {isPositive ? '+' : ''}€{Math.abs(tx.amount).toFixed(2)}
        </p>
        <p className="text-[10px] text-secondary/50 font-semibold">{tx.group}</p>
      </div>
    </div>
  );
};

// ─── Activity Feed Page ───────────────────────────────────────────────────────
const ActivityFeed = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const budgetPct = Math.round((statCards.totalSpentThisMonth / statCards.totalBudget) * 100);

  return (
    <div className="flex min-h-screen bg-[#F7F4F0] font-sans text-primary">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-primary text-white flex-col hidden md:flex shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
            <Users className="text-accent" size={20} />
          </div>
          <span className="text-2xl font-bold tracking-tight">ExpenseMate</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard"     onClick={() => navigate('/dashboard')} />
          <NavItem icon={<Activity        size={19} />} label="Activity Feed" active />
          <NavItem icon={<CreditCard      size={19} />} label="Expenses"      />
          <NavItem icon={<Users           size={19} />} label="Groups"        onClick={() => navigate('/dashboard')} />
          <NavItem icon={<Settings        size={19} />} label="Settings"      />
        </nav>

        <div className="p-6 border-t border-white/5 mt-auto">
          <button
            onClick={logout}
            className="flex items-center gap-3 text-secondary hover:text-white transition-colors w-full text-sm font-bold uppercase tracking-widest"
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="px-8 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-black text-primary tracking-tight">Activity Feed</h1>
            <p className="text-sm text-secondary/70 font-semibold mt-0.5">Your spending overview at a glance</p>
          </div>
          <div className="flex items-center gap-4">
            <DateRangePicker />
            <button className="relative p-2 text-secondary hover:text-primary">
              <Bell size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-secondary/10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-accent text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-bold tracking-tight">{user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 space-y-8">

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              label="Total Spent This Month"
              value={`€${statCards.totalSpentThisMonth.toLocaleString('en', { minimumFractionDigits: 2 })}`}
              sub="vs €1,142 last month"
              icon={<Wallet size={16} />}
              trend="up"
            />
            <StatCard
              label="Top Category"
              value={statCards.topCategory}
              sub="€420 this month"
              icon={<Utensils size={16} />}
            />
            <StatCard
              label="Budget Remaining"
              value={`€${statCards.budgetRemaining.toLocaleString('en', { minimumFractionDigits: 2 })}`}
              sub={`${budgetPct}% of €${statCards.totalBudget} used`}
              icon={<TrendingDown size={16} />}
              trend="down"
            />
            {/* Budget progress card */}
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Budget Progress</span>
                <CreditCard size={16} className="text-primary" />
              </div>
              <p className="text-2xl font-black text-primary">{budgetPct}%</p>
              <div className="w-full bg-surface/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${budgetPct}%`,
                    background: budgetPct > 80
                      ? '#EF4444'
                      : budgetPct > 60
                      ? '#FFC570'
                      : '#1A3263',
                  }}
                />
              </div>
              <p className="text-[10px] text-secondary/60 font-semibold">
                €{statCards.totalSpentThisMonth} / €{statCards.totalBudget}
              </p>
            </div>
          </div>

          {/* ── CHARTS + SIDEBAR grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left/Center: 2×2 grid of charts */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* 1. Daily Expense Line Chart */}
              <div className="md:col-span-2">
                <ChartCard title="Daily Expense Trend – Last 30 Days">
                  <DailyExpenseChart data={dailyExpenseData} />
                </ChartCard>
              </div>

              {/* 2. Category Pie */}
              <ChartCard
                title="Category Distribution"
                legend={categoryData.map(d => ({ name: d.name, color: d.color }))}
              >
                <CategoryPieChart data={categoryData} />
              </ChartCard>

              {/* 3. Group Spending Pie */}
              <ChartCard
                title="Group Spending"
                legend={groupSpendingData.map(d => ({ name: d.name, color: d.color }))}
              >
                <GroupSpendingChart data={groupSpendingData} />
              </ChartCard>

              {/* 4. Monthly Comparison Bar */}
              <div className="md:col-span-2">
                <ChartCard title="Monthly Comparison – This Month vs Last Month">
                  <MonthlyComparisonChart data={monthlyComparisonData} />
                </ChartCard>
              </div>
            </div>

            {/* Right: Recent Transactions */}
            <div className="flex flex-col">
              <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary/70">Recent Transactions</h3>
                  <span className="text-[10px] bg-primary/5 text-primary font-bold px-2.5 py-1 rounded-full">
                    {recentTransactions.length} items
                  </span>
                </div>

                {/* Totals pill row */}
                <div className="flex gap-2 mb-5">
                  <div className="flex-1 bg-danger/5 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] font-bold text-danger/70 uppercase tracking-wider">Spent</p>
                    <p className="text-sm font-black text-danger">
                      €{recentTransactions
                          .filter(t => t.amount < 0)
                          .reduce((s, t) => s + Math.abs(t.amount), 0)
                          .toFixed(2)}
                    </p>
                  </div>
                  <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Received</p>
                    <p className="text-sm font-black text-emerald-600">
                      €{recentTransactions
                          .filter(t => t.amount > 0)
                          .reduce((s, t) => s + t.amount, 0)
                          .toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto -mx-2 space-y-0.5 pr-1 custom-scrollbar">
                  {recentTransactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityFeed;
