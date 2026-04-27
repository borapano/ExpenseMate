import React from 'react';
import {
    Utensils, ShoppingBasket, Car, Home, Zap, Film,
    ShoppingBag, Plane, HeartPulse, CreditCard, HelpCircle
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
    "Bills & Subscriptions"
];

export const getCategoryDetails = (categoryName) => {
    switch (categoryName) {
        case "Food & Dining":
            return {
                icon: <Utensils size={20} />,
                colorClass: "bg-amber-500/15 text-amber-600",
                hexColor: "#d97706" 
            };
        case "Groceries":
            return {
                icon: <ShoppingBasket size={20} />,
                colorClass: "bg-emerald-500/15 text-emerald-600",
                hexColor: "#059669" 
            };
        case "Transportation":
            return {
                icon: <Car size={20} />,
                colorClass: "bg-blue-500/15 text-blue-600",
                hexColor: "#2563eb" 
            };
        case "Housing":
            return {
                icon: <Home size={20} />,
                colorClass: "bg-indigo-500/15 text-indigo-600",
                hexColor: "#4f46e5" 
            };
        case "Utilities":
            return {
                icon: <Zap size={20} />,
                colorClass: "bg-yellow-500/15 text-yellow-600",
                hexColor: "#ca8a04" 
            };
        case "Entertainment":
            return {
                icon: <Film size={20} />,
                colorClass: "bg-purple-500/15 text-purple-600",
                hexColor: "#9333ea" 
            };
        case "Shopping":
            return {
                icon: <ShoppingBag size={20} />,
                colorClass: "bg-pink-500/15 text-pink-600",
                hexColor: "#db2777" 
            };
        case "Travel":
            return {
                icon: <Plane size={20} />,
                colorClass: "bg-sky-500/15 text-sky-600",
                hexColor: "#0284c7" 
            };
        case "Health":
            return {
                icon: <HeartPulse size={20} />,
                colorClass: "bg-red-500/15 text-red-600",
                hexColor: "#dc2626" 
            };
        case "Bills & Subscriptions":
            return {
                icon: <CreditCard size={20} />,
                colorClass: "bg-slate-500/15 text-slate-600",
                hexColor: "#475569" 
            };
        default:
            return {
                icon: <HelpCircle size={20} />,
                colorClass: "bg-gray-500/15 text-gray-600",
                hexColor: "#4b5563"
            };
    }
};
