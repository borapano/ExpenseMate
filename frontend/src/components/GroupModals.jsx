import React, { useState, useEffect } from 'react';
import api from '../api';

// 1. Komponent i përbashkët për sfondin e Modal-it (Wrapper)
const ModalWrapper = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

// 2. MODALI PER KRIJIMIN E GRUPIT
export const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Payload-i duhet të jetë fiks 'name' dhe 'description' për FastAPI
            await api.post('/groups/', {
                name: name.trim(),
                description: description.trim()
            });
            setName('');
            setDescription('');
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error creating group:", err.response?.data);
            alert(err.response?.data?.detail || "Gabim gjatë krijimit të grupit. Kontrolloni lidhjen me serverin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Krijo një Grup</h2>
                <p className="text-slate-500 text-sm mt-1">Nisni menaxhimin e shpenzimeve bashkë.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Emri i Grupit</label>
                    <input
                        required
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                        placeholder="psh. Shtëpia Jonë 🏠"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Përshkrimi (Opsional)</label>
                    <textarea
                        rows="3"
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 resize-none"
                        placeholder="Për çfarë shërben ky grup?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-4 px-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
                        Anulo
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-4 px-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? "Duke u krijuar..." : "Krijo Grupin"}
                    </button>
                </div>
            </form>
        </ModalWrapper>
    );
};

// 3. MODALI PER BASHKIMIN NE GRUP
export const JoinGroupModal = ({ isOpen, onClose, onSuccess }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async (e) => {
        e.preventDefault();
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode.length < 6) return alert("Kodi duhet të jetë 6 karaktere");

        setLoading(true);
        try {
            // Përdorim 'invite_code' siç e pret Backend-i te GroupJoin schema
            await api.post('/groups/join', { invite_code: cleanCode });
            setCode('');
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Join error:", err.response?.data);
            alert(err.response?.data?.detail || "Kodi është i pasaktë ose jeni tashmë anëtar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
            </div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bashkohu në Grup</h2>
                <p className="text-slate-500 text-sm mt-1">Shkruaj kodin 6-shifror që keni marrë.</p>
            </div>

            <form onSubmit={handleJoin} className="space-y-6">
                <input
                    required
                    autoFocus
                    className="w-full px-4 py-5 text-center text-3xl font-black tracking-[0.5em] rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all uppercase placeholder:text-slate-200"
                    placeholder="ABCDEF"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <div className="flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Anulo</button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-4 px-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? "Duke u lidhur..." : "Bashkohu tani"}
                    </button>
                </div>
            </form>
        </ModalWrapper>
    );
};