import React, { useState, useEffect } from 'react';
import api from '../api';
import { X, Users, Key, UserPlus } from 'lucide-react';

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[1.5rem] w-full max-w-lg shadow-2xl border border-secondary/10 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-end p-4 absolute right-0 top-0 z-10">
                    <button onClick={onClose} className="p-2 hover:bg-surface rounded-full text-secondary transition-colors">
                        <X size={20} />
                    </button>
                </div>
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
            alert(err.response?.data?.detail || "Error creating group.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-bold text-primary tracking-tight">Create a New Group</h2>
                    <div className="text-accent">
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                            <Users size={18} className="text-accent" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Group Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-secondary mb-1.5 ml-1">Group Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-secondary/20 focus:border-accent outline-none transition-all placeholder:text-secondary/40 text-sm"
                                    placeholder="e.g., Miami Vacation 2024"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-secondary mb-1.5 ml-1">Add a Description (Optional)</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-secondary/20 focus:border-accent outline-none transition-all resize-none text-sm placeholder:text-secondary/40"
                                    placeholder="A quick summary..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4 border-t border-secondary/5">
                        <button type="button" onClick={onClose} className="text-sm font-bold text-secondary hover:text-primary transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-accent hover:bg-accent/90 text-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Group"}
                        </button>
                    </div>
                </form>
            </div>
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
        if (cleanCode.length < 6) return alert("Code must be 6 characters");

        setLoading(true);
        try {
            await api.post('/groups/join', { invite_code: cleanCode });
            setCode('');
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.detail || "Invalid code or already a member.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="p-8">
                <div className="text-center mb-8 pt-4">
                    {/* Kutia me Border dhe Hije te qarte si kuadrat solid */}
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 
                                    border border-secondary/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                        <Key size={30} className="text-accent" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary tracking-tight">Join a Group</h2>
                    <p className="text-secondary text-sm mt-1">Enter the 6-character code you received.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    {/* Sfondi i inputit ne ngjyre te celet #FAF9F6 */}
                    <input
                        required
                        autoFocus
                        className="w-full px-4 py-6 text-center text-4xl font-black tracking-[0.4em] rounded-2xl bg-[#FAF9F6] border-2 border-secondary/5 focus:border-accent focus:bg-white outline-none transition-all uppercase placeholder:text-secondary/10"
                        placeholder="000000"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-bold text-primary bg-accent hover:bg-accent/90 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} />
                            {loading ? "Joining..." : "Join Group"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 text-sm font-bold text-secondary hover:text-primary transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </form>
            </div>
        </ModalWrapper>
    );
};