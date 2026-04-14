import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const GroupCard = ({ group }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Kontrollojmë nëse përdoruesi aktual është krijuesi i grupit
    const isCreator = group?.creator_id === user?.id;

    return (
        <div
            onClick={() => navigate(`/groups/${group.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/groups/${group.id}`)}
            role="button"
            tabIndex={0}
            className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-100 
                 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 
                 transition-all duration-300 ease-out flex flex-col h-44 justify-between 
                 ring-offset-2 focus:ring-2 focus:ring-indigo-500 outline-none overflow-hidden"
        >
            {/* Dekorim vizual në sfond që shfaqet vetëm kur bëhet hover */}
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out opacity-50" />

            <div>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 truncate transition-colors">
                            {group?.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                ID: {group?.code}
                            </span>
                        </div>
                    </div>

                    {/* Ikona e grupit */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-4.746c.096-.319-.18-.612-.512-.612h-1.391a1.125 1.125 0 0 1-1.125-1.125V9.457a1.125 1.125 0 0 1 .414-.868l.627-.514c.236-.194.225-.564-.021-.741a10.073 10.073 0 0 0-3.446-1.303 1.125 1.125 0 0 0-1.288.751l-.53 1.584a1.125 1.125 0 0 1-1.125.75H9.75a1.125 1.125 0 0 1-1.125-.75l-.53-1.584a1.125 1.125 0 0 0-1.288-.751 10.074 10.074 0 0 0-3.446 1.303c-.246.177-.257.547-.021.741l.627.514a1.125 1.125 0 0 1 .414.868v1.306c0 .622-.504 1.125-1.125 1.125H1.77c-.332 0-.608.293-.512.612a9.107 9.107 0 0 0 3.741 4.746c.215.148.503.117.684-.071l.73-.761a1.125 1.125 0 0 1 1.622 0l.5.522A1.125 1.125 0 0 1 8.877 20h6.246a1.125 1.125 0 0 1 .796-.329l.5-.522a1.125 1.125 0 0 1 1.622 0l.73.761c.181.188.469.219.684.071Z" />
                        </svg>
                    </div>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic">
                    {group?.description || "Ky grup nuk ka ende një përshkrim..."}
                </p>
            </div>

            {/* Footer i kartës me informacionin e krijuesit */}
            <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-auto">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">Statusi</span>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isCreator ? 'bg-green-500' : 'bg-indigo-400'}`} />
                    <span className={`text-xs font-semibold ${isCreator ? 'text-green-600' : 'text-slate-600'}`}>
                        {isCreator ? "Krijues" : "Anëtar"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GroupCard;