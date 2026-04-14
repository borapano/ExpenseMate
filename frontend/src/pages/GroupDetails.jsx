import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const GroupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGroupDetails = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await api.get(`/groups/${id}`);
                setGroup(res.data);
                setError(null);
            } catch (err) {
                console.error("API Error:", err.response);
                setError("Grupi nuk u gjet ose nuk keni akses.");
            } finally {
                setLoading(false);
            }
        };
        fetchGroupDetails();
    }, [id]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(group?.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error("Copy failed");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 font-bold animate-pulse">Duke ngarkuar grupin...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full text-center p-10 bg-white rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Ups! Diçka shkoi gabim</h3>
                <p className="text-slate-500 mb-8">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all">
                    Kthehu në Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* --- HEADER SECTION --- */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-6 hover:text-indigo-600 transition-colors"
                    >
                        <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Dashboard
                    </button>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                                {/* KORRIGJIM: toUpperCase me () */}
                                <span className="text-2xl font-black">{group?.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">{group?.name}</h1>
                                <div className="flex flex-col gap-1">
                                    <p className="text-slate-500 font-medium text-sm">{group?.description || "Nuk ka përshkrim."}</p>

                                    {/* --- DATA E KRIJIMIT (SHTESA RE) --- */}
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                        </svg>
                                        <span className="text-[11px] font-bold uppercase tracking-wider">
                                            Krijuar më: {group?.created_at ? new Date(group.created_at).toLocaleDateString('sq-AL', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* INVITE CODE */}
                        <div
                            onClick={copyToClipboard}
                            className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white hover:border-indigo-300 transition-all group relative"
                        >
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Kodi i ftesës</p>
                                <p className="text-lg font-mono font-black text-indigo-600 tracking-widest">{group?.code}</p>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5-.125c.162 0 .324.012.484.036m3.712 1.958a9.13 9.13 0 0 1 1.635-1.111c.214-.112.457-.168.701-.168h4.593a1.125 1.125 0 0 1 1.125 1.125V13.5c0 .621-.504 1.125-1.125 1.125h-3.375" />
                                </svg>
                            </div>
                            {copied && <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-3 rounded-lg">U kopjua!</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* --- LEFT COLUMN: STATS & MEMBERS --- */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* TOTAL EXPENSES CARD */}
                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-indigo-100 font-bold uppercase text-xs tracking-widest mb-2">Total Shpenzime</p>
                                <h2 className="text-4xl font-black">{group?.total_expenses.toLocaleString()} <span className="text-xl font-normal">ALL</span></h2>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        {/* MEMBERS LIST */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-slate-900 font-black text-lg mb-6 flex items-center gap-2">
                                Anëtarët <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-lg">{group?.members.length}</span>
                            </h3>
                            <div className="space-y-4">
                                {group?.members.map((member) => (
                                    <div key={member.user_id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                {member.user_name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{member.user_name}</p>
                                                <p className="text-[11px] text-slate-400 font-medium">{member.user_email}</p>
                                            </div>
                                        </div>
                                        {member.user_id === group.creator_id && (
                                            <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100">ADMIN</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: ACTIVITY --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Historiku i Shpenzimeve</h2>
                            <p className="text-slate-400 max-w-sm font-medium mb-8">
                                Këtu do të shfaqen të gjitha transaksionet që bëhen brenda këtij grupi në fazën e ardhshme.
                            </p>
                            <button className="bg-slate-900 text-white font-black px-8 py-4 rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2">
                                <span className="text-xl">+</span> Shto Shpenzim
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetails;