import React from 'react';
import { getCategoryDetails } from '../../utils/categoryMap';

/*
 * TopCategoryCard
 *
 * Shows the single top category by spend.
 * Tiebreaker 1: number of transactions (count).
 * Tiebreaker 2: random (array order).
 * Not clickable — no modal.
 */

const fmt = (v) =>
    `€${Number(v ?? 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getTopCategory(categories) {
    if (!Array.isArray(categories) || categories.length === 0) return null;

    return [...categories].sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return (b.count ?? 0) - (a.count ?? 0);
        // If still tied → array order (random effectively)
    })[0];
}

const TopCategoryCard = ({ categoryName, monthlySpend, allCategories }) => {
    const top = getTopCategory(allCategories);

    // Fallback to props if allCategories not provided
    const name = top?.name ?? (categoryName !== 'N/A' ? categoryName : null);
    const value = top?.value ?? monthlySpend ?? 0;

    const { icon, colorClass } = name ? getCategoryDetails(name) : { icon: null, colorClass: '' };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                    Top Category
                </span>
                {name && (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
                        {icon}
                    </div>
                )}
            </div>

            {!name ? (
                <p className="text-2xl font-black text-primary/30 tracking-tight">N/A</p>
            ) : (
                <>
                    <p className="text-2xl font-black text-primary tracking-tight">
                        {name}
                    </p>
                    <p className="text-xs text-secondary/70 font-semibold">
                        {fmt(value)} this month
                    </p>
                </>
            )}
        </div>
    );
};

export default TopCategoryCard;