import React from 'react';
import { getCategoryDetails } from '../../utils/categoryMap';

const TopCategoryCard = ({ categoryName, monthlySpend }) => {
    const { icon, colorClass } = getCategoryDetails(categoryName);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                    Top Category
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
                    {icon}
                </div>
            </div>

            <p className="text-2xl font-black text-primary tracking-tight">
                {categoryName}
            </p>

            <p className="text-xs text-secondary/70 font-semibold">
                €{monthlySpend.toLocaleString('en', { minimumFractionDigits: 2 })} this month
            </p>
        </div>
    );
};

export default TopCategoryCard;