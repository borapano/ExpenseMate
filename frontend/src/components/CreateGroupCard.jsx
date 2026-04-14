import React from 'react';

const CreateGroupCard = ({ onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Create new group"
            className="group relative border-2 border-dashed border-slate-200 rounded-[2rem] h-56 w-full 
                 flex flex-col items-center justify-center gap-4 transition-all duration-300
                 hover:border-indigo-400 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 
                 focus:ring-2 focus:ring-indigo-500 ring-offset-2 outline-none
                 active:scale-[0.98] bg-slate-50/50"
        >
            {/* Icon Container */}
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center 
                      shadow-sm group-hover:bg-indigo-600 group-hover:scale-110 transition-all duration-300">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </div>

            <div className="text-center">
                <span className="block text-base font-black text-slate-700 group-hover:text-indigo-900 tracking-tight">
                    Krijo një grup të ri
                </span>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1">
                    Nis një projekt të ri
                </p>
            </div>

            {/* Subtle Badge */}
            <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                SHTO
            </div>
        </button>
    );
};

// KY RRESHT MUNGONTE DHE SHKAKTONTE ERROR-IN
export default CreateGroupCard;