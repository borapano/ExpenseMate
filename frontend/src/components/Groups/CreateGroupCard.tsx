import React from 'react';
import { PlusCircle, ArrowRight } from 'lucide-react';

interface CreateGroupCardProps {
    onClick: () => void;
}

const CreateGroupCard: React.FC<CreateGroupCardProps> = ({ onClick }) => (
    <div
        onClick={onClick}
        className="bg-primary hover:bg-primary/95 text-white rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
        <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2 mb-1.5">
                <PlusCircle className="text-accent" size={20} /> Create New Group
            </h2>
            <p className="text-sm font-medium text-secondary/80 max-w-sm">
                Start a new expense hub for your trips, apartment, or events.
            </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <ArrowRight className="text-accent" />
        </div>
    </div>
);

export default CreateGroupCard;