import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getCategoryDetails } from '../../utils/categoryMap';

/*
 * TopCategoryCard
 *
 * Shows top 1-3 categories by spend.
 * Tiebreaker: number of transactions (count). If still tied → random (array order).
 * Click → opens modal with all categories ranked by spend.
 */

const fmt = (v) =>
    `€${Number(v ?? 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Helpers ────────────────────────────────────────────────────────────────
function getTop3(categories) {
    if (!Array.isArray(categories) || categories.length === 0) return [];

    // Sort by amount desc, then by count desc (tiebreaker)
    const sorted = [...categories].sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return (b.count ?? 0) - (a.count ?? 0);
    });

    const maxAmount = sorted[0]?.value ?? 0;

    // Find cutoff: include top items until we have 3 or hit a clear drop
    // If 4th item ties with 3rd → 3rd is chosen by tiebreaker (count) already
    return sorted.slice(0, 3);
}

// ── Modal ──────────────────────────────────────────────────────────────────
const CategoryModal = ({ categories, onClose }) => {
    const sorted = [...(categories ?? [])].sort((a, b) => b.value - a.value);
    const max = sorted[0]?.value ?? 1;

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-secondary/10">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                        All Categories This Month
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-secondary/40 hover:text-primary rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* List */}
                <div className="px-6 py-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {sorted.length === 0 ? (
                        <p className="text-sm text-secondary/40 font-semibold text-center py-6">
                            No spending data this month.
                        </p>
                    ) : sorted.map((cat, idx) => {
                        const { icon, colorClass } = getCategoryDetails(cat.name);
                        const pct = max > 0 ? (cat.value / max) * 100 : 0;

                        return (
                            <div key={cat.name} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[10px] font-black text-secondary/30 w-4 shrink-0">
                                            #{idx + 1}
                                        </span>
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                            {React.cloneElement(icon, { size: 12 })}
                                        </div>
                                        <span className="text-sm font-bold text-primary truncate">
                                            {cat.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-primary shrink-0 ml-2">
                                        {fmt(cat.value)}
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div className="h-1 bg-secondary/8 rounded-full overflow-hidden ml-10">
                                    <div
                                        className="h-full rounded-full bg-primary/20 transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────
const TopCategoryCard = ({ categoryName, monthlySpend, allCategories }) => {
    const [modalOpen, setModalOpen] = useState(false);

    const top3 = getTop3(allCategories);
    const hasMultiple = top3.length > 1;

    // Fallback to single category props if allCategories not provided
    const displayCategories = top3.length > 0
        ? top3
        : categoryName && categoryName !== 'N/A'
            ? [{ name: categoryName, value: monthlySpend }]
            : [];

    return (
        <>
            <div
                className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setModalOpen(true)}
                title="Click to see all categories"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        {hasMultiple ? 'Top Categories' : 'Top Category'}
                    </span>
                    {/* Show icon of #1 category */}
                    {displayCategories[0] && (() => {
                        const { icon, colorClass } = getCategoryDetails(displayCategories[0].name);
                        return (
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
                                {icon}
                            </div>
                        );
                    })()}
                </div>

                {displayCategories.length === 0 ? (
                    <p className="text-2xl font-black text-primary/30 tracking-tight">N/A</p>
                ) : hasMultiple ? (
                    /* Multiple top categories */
                    <div className="flex flex-col gap-1.5">
                        {displayCategories.map((cat, idx) => {
                            const { icon, colorClass } = getCategoryDetails(cat.name);
                            return (
                                <div key={cat.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                            {React.cloneElement(icon, { size: 11 })}
                                        </div>
                                        <span className={`text-sm font-black tracking-tight truncate ${idx === 0 ? 'text-primary' : 'text-primary/60'}`}>
                                            {cat.name}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-black shrink-0 ml-2 ${idx === 0 ? 'text-primary' : 'text-primary/50'}`}>
                                        {fmt(cat.value)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Single top category */
                    <>
                        <p className="text-2xl font-black text-primary tracking-tight">
                            {displayCategories[0].name}
                        </p>
                        <p className="text-xs text-secondary/70 font-semibold">
                            {fmt(displayCategories[0].value)} this month
                        </p>
                    </>
                )}

                <p className="text-[9px] font-bold text-secondary/30 uppercase tracking-widest mt-auto">
                    Tap to see all →
                </p>
            </div>

            {modalOpen && (
                <CategoryModal
                    categories={allCategories ?? (categoryName !== 'N/A' ? [{ name: categoryName, value: monthlySpend }] : [])}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </>
    );
};

export default TopCategoryCard;