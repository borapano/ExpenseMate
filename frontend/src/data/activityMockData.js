// ─────────────────────────────────────────────────────────────────────────────
// Mock data for ActivityFeed page.
// Replace the individual arrays with useEffect → fetch calls when the backend
// endpoints are ready.
// ─────────────────────────────────────────────────────────────────────────────

/** Stat cards */
export const statCards = {
  totalSpentThisMonth: 1284.50,
  topCategory: "Food & Dining",
  budgetRemaining: 715.50,
  totalBudget: 2000,
};

/** Daily expense data – last 30 days */
export const dailyExpenseData = [
  { day: "Apr 1",  amount: 32 },
  { day: "Apr 2",  amount: 58 },
  { day: "Apr 3",  amount: 20 },
  { day: "Apr 4",  amount: 75 },
  { day: "Apr 5",  amount: 44 },
  { day: "Apr 6",  amount: 90 },
  { day: "Apr 7",  amount: 38 },
  { day: "Apr 8",  amount: 62 },
  { day: "Apr 9",  amount: 29 },
  { day: "Apr 10", amount: 84 },
  { day: "Apr 11", amount: 51 },
  { day: "Apr 12", amount: 67 },
  { day: "Apr 13", amount: 43 },
  { day: "Apr 14", amount: 95 },
  { day: "Apr 15", amount: 33 },
  { day: "Apr 16", amount: 72 },
  { day: "Apr 17", amount: 18 },
  { day: "Apr 18", amount: 88 },
  { day: "Apr 19", amount: 54 },
  { day: "Apr 20", amount: 46 },
  { day: "Apr 21", amount: 77 },
  { day: "Apr 22", amount: 61 },
  { day: "Apr 23", amount: 39 },
  { day: "Apr 24", amount: 82 },
  { day: "Apr 25", amount: 25 },
  { day: "Apr 26", amount: 68 },
  { day: "Apr 27", amount: 91 },
  { day: "Apr 28", amount: 47 },
  { day: "Apr 29", amount: 56 },
  { day: "Apr 30", amount: 73 },
];

/** Category distribution */
export const categoryData = [
  { name: "Food & Dining",  value: 420, color: "#FFC570" },
  { name: "Transport",      value: 215, color: "#547792" },
  { name: "Utilities",      value: 180, color: "#1A3263" },
  { name: "Entertainment",  value: 145, color: "#EFD2B0" },
  { name: "Healthcare",     value: 210, color: "#6B8FAF" },
  { name: "Shopping",       value: 114.5, color: "#A8C5DA" },
];

/** Group spending */
export const groupSpendingData = [
  { name: "Family",       value: 510, color: "#1A3263" },
  { name: "Roommates",    value: 370, color: "#547792" },
  { name: "Trip 2024",    value: 280, color: "#FFC570" },
  { name: "Work Lunch",   value: 124.5, color: "#EFD2B0" },
];

/** Monthly comparison */
export const monthlyComparisonData = [
  { category: "Food",          thisMonth: 420, lastMonth: 355 },
  { category: "Transport",     thisMonth: 215, lastMonth: 240 },
  { category: "Utilities",     thisMonth: 180, lastMonth: 180 },
  { category: "Entertainment", thisMonth: 145, lastMonth: 95  },
  { category: "Healthcare",    thisMonth: 210, lastMonth: 130 },
  { category: "Shopping",      thisMonth: 114.5, lastMonth: 200 },
];

/** Recent transactions */
export const recentTransactions = [
  { id: 1,  name: "Grocery Run",          category: "Food & Dining",  date: "2026-04-27", amount: -64.30, group: "Family"    },
  { id: 2,  name: "Uber to Airport",      category: "Transport",      date: "2026-04-26", amount: -28.50, group: "Trip 2024" },
  { id: 3,  name: "Electricity Bill",     category: "Utilities",      date: "2026-04-25", amount: -95.00, group: "Roommates" },
  { id: 4,  name: "Netflix Subscription", category: "Entertainment",  date: "2026-04-25", amount: -15.99, group: "Family"    },
  { id: 5,  name: "Refund – Overpayment", category: "Shopping",       date: "2026-04-24", amount: +40.00, group: "Roommates" },
  { id: 6,  name: "Dinner – Casa Mia",    category: "Food & Dining",  date: "2026-04-23", amount: -82.00, group: "Work Lunch"},
  { id: 7,  name: "Pharmacy",             category: "Healthcare",     date: "2026-04-22", amount: -34.75, group: "Family"    },
  { id: 8,  name: "Bus Monthly Pass",     category: "Transport",      date: "2026-04-21", amount: -45.00, group: "Roommates" },
  { id: 9,  name: "Concert Tickets",      category: "Entertainment",  date: "2026-04-20", amount: -120.00,group: "Trip 2024" },
  { id: 10, name: "Settlement Received",  category: "Transfer",       date: "2026-04-19", amount: +55.00, group: "Family"    },
  { id: 11, name: "Supermarket",          category: "Food & Dining",  date: "2026-04-18", amount: -47.20, group: "Roommates" },
  { id: 12, name: "Doctor Visit",         category: "Healthcare",     date: "2026-04-17", amount: -60.00, group: "Family"    },
];
