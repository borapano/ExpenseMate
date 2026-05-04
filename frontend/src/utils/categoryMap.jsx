import React from 'react';
import {
    Utensils, ShoppingBasket, Car, Home, Zap, Film,
    ShoppingCart, Plane, HeartPulse, FileText, HelpCircle, Tag
} from 'lucide-react';

export const CATEGORIES = [
    "Food & Dining",
    "Groceries",
    "Transportation",
    "Housing",
    "Utilities",
    "Entertainment",
    "Shopping",
    "Travel",
    "Health",
    "Bills & Subscriptions",
    "Other"
];

// ── Canonical table-row style (small icon boxes in tables) ────────────────────
// Used by GroupExpenseTable and ExpenseHistoryCard
export const getTableCatStyle = (categoryName, iconSize = 13) => {
    switch (categoryName) {
        case 'Food & Dining':
            return { icon: <Utensils size={iconSize} />, bg: 'bg-amber-100', text: 'text-amber-700' };
        case 'Groceries':
            return { icon: <ShoppingBasket size={iconSize} />, bg: 'bg-emerald-100', text: 'text-emerald-700' };
        case 'Transportation':
        case 'Transport':
            return { icon: <Car size={iconSize} />, bg: 'bg-sky-100', text: 'text-sky-700' };
        case 'Housing':
            return { icon: <Home size={iconSize} />, bg: 'bg-indigo-100', text: 'text-indigo-700' };
        case 'Utilities':
            return { icon: <Zap size={iconSize} />, bg: 'bg-violet-100', text: 'text-violet-700' };
        case 'Entertainment':
            return { icon: <Film size={iconSize} />, bg: 'bg-pink-100', text: 'text-pink-700' };
        case 'Shopping':
            return { icon: <ShoppingCart size={iconSize} />, bg: 'bg-rose-100', text: 'text-rose-700' };
        case 'Travel':
            return { icon: <Plane size={iconSize} />, bg: 'bg-cyan-100', text: 'text-cyan-700' };
        case 'Health':
        case 'Healthcare':
            return { icon: <HeartPulse size={iconSize} />, bg: 'bg-red-100', text: 'text-red-700' };
        case 'Bills & Subscriptions':
            return { icon: <FileText size={iconSize} />, bg: 'bg-orange-100', text: 'text-orange-700' };
        case 'Other':
        default:
            return { icon: <Tag size={iconSize} />, bg: 'bg-gray-100', text: 'text-gray-500' };
    }
};

// ── Form button style (larger icons, same colors as table) ────────────────────
// Used by ExpenseForm category picker
export const getCategoryDetails = (categoryName) => {
    switch (categoryName) {
        case "Food & Dining":
            return { icon: <Utensils size={20} />, colorClass: "bg-amber-100 text-amber-700", hexColor: "#d97706" };
        case "Groceries":
            return { icon: <ShoppingBasket size={20} />, colorClass: "bg-emerald-100 text-emerald-700", hexColor: "#059669" };
        case "Transportation":
            return { icon: <Car size={20} />, colorClass: "bg-sky-100 text-sky-700", hexColor: "#0284c7" };
        case "Housing":
            return { icon: <Home size={20} />, colorClass: "bg-indigo-100 text-indigo-700", hexColor: "#4f46e5" };
        case "Utilities":
            return { icon: <Zap size={20} />, colorClass: "bg-violet-100 text-violet-700", hexColor: "#7c3aed" };
        case "Entertainment":
            return { icon: <Film size={20} />, colorClass: "bg-pink-100 text-pink-700", hexColor: "#db2777" };
        case "Shopping":
            return { icon: <ShoppingCart size={20} />, colorClass: "bg-rose-100 text-rose-700", hexColor: "#e11d48" };
        case "Travel":
            return { icon: <Plane size={20} />, colorClass: "bg-cyan-100 text-cyan-700", hexColor: "#0891b2" };
        case "Health":
            return { icon: <HeartPulse size={20} />, colorClass: "bg-red-100 text-red-700", hexColor: "#dc2626" };
        case "Bills & Subscriptions":
            return { icon: <FileText size={20} />, colorClass: "bg-orange-100 text-orange-700", hexColor: "#ea580c" };
        case "Other":
            return { icon: <HelpCircle size={20} />, colorClass: "bg-gray-100 text-gray-500", hexColor: "#6b7280" };
        default:
            return { icon: <HelpCircle size={20} />, colorClass: "bg-gray-100 text-gray-500", hexColor: "#4b5563" };
    }
};
