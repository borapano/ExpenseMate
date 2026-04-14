import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api'; // Përdorim 'api' që krijuam bashkë për interceptors

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
                // Provojmë të marrim të dhënat
                const res = await api.get(`/groups/${id}`);
                setGroup(res.data);
                setError(null);
            } catch (err) {
                console.error("API Error Details:", err.response);
                setError("Grupi nuk u gjet ose nuk keni akses në të.");
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
            <div className="max-w-md w-full text-center p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Ups! Diçka shkoi gabim</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                    Kthehu në Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* --- HEADER I GRUPIT (Indigo Theme) --- */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-8 hover:text-indigo-600 transition-colors"
                    >
                        <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Kthehu mbrapa
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-8 bg-indigo-600 rounded-full"></div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{group?.name}</h1>
                            </div>
                            <p className="text-slate-500 text-lg font-medium max-w-xl">
                                {group?.description || "Menaxhimi i financave të përbashkëta në këtë grup."}
                            </p>
                        </div>

                        {/* INVITE CODE CARD */}
                        <div
                            onClick={copyToClipboard}
                            className="relative cursor-pointer bg-indigo-50 border-2 border-indigo-100 p-5 rounded-[2rem] group hover:border-indigo-400 hover:bg-white transition-all active:scale-95 shadow-sm"
                        >
                            <div className="flex items-center gap-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Kodi i Ftesës</p>
                                    <p className="text-2xl font-mono font-black text-indigo-600 tracking-[0.15em]">{group?.code}</p>
                                </div>
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5-.125c.162 0 .324.012.484.036m3.712 1.958a9.13 9.13 0 0 1 1.635-1.111c.214-.112.457-.168.701-.168h4.593a1.125 1.125 0 0 1 1.125 1.125V13.5c0 .621-.504 1.125-1.125 1.125h-3.375" />
                                    </svg>
                                </div>
                            </div>

                            {copied && (
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-black py-2.5 px-5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    U KOPJUA! ✓
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT SECTION --- */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 gap-8">
                    {/* Placeholder for Expenses */}
                    <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <h3 className="text-slate-900 font-black text-xl uppercase tracking-tight">Së shpejti: Shpenzimet</h3>
                        <p className="text-slate-400 font-medium max-w-sm mx-auto">
                            Në fazën tjetër të projektit, këtu do të mund të shtoni dhe ndani faturat me shokët tuaj.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetails;