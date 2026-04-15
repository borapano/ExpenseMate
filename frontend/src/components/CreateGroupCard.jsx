import React from 'react';
import { Plus } from 'lucide-react';

const CreateGroupCard = ({ onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center gap-4 h-[180px] w-full 
                       bg-white p-6 rounded-[2rem] shadow-sm border border-dashed border-secondary/20
                       hover:shadow-md hover:border-accent/40 transition-all duration-300 
                       cursor-pointer overflow-hidden"
        >
            {/* Icon Container - Matching the logic of GroupCard icons */}
            <div className="w-12 h-12 rounded-2xl bg-[#F7F4F0] flex items-center justify-center 
                            transition-all duration-300 group-hover:bg-accent/10 group-hover:scale-110">
                <Plus
                    size={24}
                    className="text-secondary/40 group-hover:text-accent transition-colors"
                    strokeWidth={2.5}
                />
            </div>

            <div className="text-center">
                <span className="block text-sm font-bold text-primary group-hover:text-accent transition-colors">
                    Create a new group
                </span>
                <p className="text-[10px] text-secondary/50 font-black uppercase tracking-widest mt-1">
                    Start a project
                </p>
            </div>

            {/* Subtle bottom accent line like GroupCard's border-t */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-accent/10 transition-colors" />
        </button>
    );
};

export default CreateGroupCard;