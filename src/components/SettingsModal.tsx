import React, { useState, useEffect } from 'react';
import { X, Key, Save, User, Trash2, Edit2, ShieldCheck, LogIn, Loader2 } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { getAllProfiles, deleteUserData, saveProfile } from '../services/repository';
import { Profile } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [adminUser, setAdminUser] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [students, setStudents] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
    const [activeTab, setActiveTab] = useState<'config' | 'admin'>('config');

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('profesoria_api_key');
            if (storedKey) setApiKey(storedKey);

            const isAuth = sessionStorage.getItem('profesoria_admin_auth') === 'true';
            setIsAdmin(isAuth);

            if (isAuth) {
                fetchStudents();
            }
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const data = await getAllProfiles();
            setStudents(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = () => {
        if (adminUser === 'jucaalgo' && adminPass === '13470811') {
            setIsAdmin(true);
            sessionStorage.setItem('profesoria_admin_auth', 'true');
            fetchStudents();
        } else {
            alert('Invalid credentials');
        }
    };

    const handleDelete = async (username: string) => {
        if (window.confirm(`Are you sure you want to delete ${username}? This cannot be undone.`)) {
            await deleteUserData(username);
            fetchStudents();
            // If deleting the active student, we might want to reload
            if (localStorage.getItem('profesoria_active_student') === username) {
                localStorage.removeItem('profesoria_active_student');
                window.location.reload();
            }
        }
    };

    const handleSaveProfile = async () => {
        if (editingStudent) {
            await saveProfile(editingStudent.username, editingStudent);
            setEditingStudent(null);
            fetchStudents();
        }
    };

    const handleSaveKey = () => {
        localStorage.setItem('profesoria_api_key', apiKey);
        onClose();
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
                <Card className="bg-gray-900 border-gray-800 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveTab('config')}
                                className={`text-sm font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'config' ? 'text-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                            >
                                Configuration
                            </button>
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`text-sm font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'admin' ? 'text-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                            >
                                Admin
                            </button>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {activeTab === 'config' ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Key className="w-6 h-6 text-indigo-500" />
                                    <h3 className="text-xl font-black italic">API SETTINGS</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-tight">
                                            Gemini API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="AIzaSy..."
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-2 font-medium">
                                            Your key is required for AI tutoring and dynamic content.
                                        </p>
                                    </div>
                                    <Button onClick={handleSaveKey} className="w-full h-12 rounded-xl">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Configuration
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {!isAdmin ? (
                                    <div className="space-y-6 p-4">
                                        <div className="flex items-center gap-3">
                                            <LogIn className="w-6 h-6 text-indigo-500" />
                                            <h3 className="text-xl font-black italic">ADMIN LOGIN</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="Username"
                                                value={adminUser}
                                                onChange={e => setAdminUser(e.target.value)}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={adminPass}
                                                onChange={e => setAdminPass(e.target.value)}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <Button onClick={handleLogin} className="w-full h-12 rounded-xl">
                                                Unlock Console
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                                <h3 className="text-xl font-black italic">USER MANAGEMENT</h3>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => { sessionStorage.removeItem('profesoria_admin_auth'); setIsAdmin(false); }}>
                                                Logout
                                            </Button>
                                        </div>

                                        {editingStudent ? (
                                            <div className="p-4 bg-gray-950 border border-indigo-500/30 rounded-2xl space-y-4 animate-in zoom-in-95">
                                                <h4 className="font-bold text-indigo-400">Editing: {editingStudent.name}</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-gray-500">Name</label>
                                                        <input
                                                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm"
                                                            value={editingStudent.name}
                                                            onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-gray-500">Level</label>
                                                        <select
                                                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm"
                                                            value={editingStudent.current_level}
                                                            onChange={e => setEditingStudent({ ...editingStudent, current_level: e.target.value })}
                                                        >
                                                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l}>{l}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="flex-1" onClick={handleSaveProfile}>Update</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingStudent(null)}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {isLoading ? (
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto py-10" />
                                                ) : (
                                                    students.map(s => (
                                                        <div key={s.username} className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">{s.name}</span>
                                                                <span className="text-[10px] text-gray-500 uppercase">{s.current_level} • {s.xp_total || 0} XP</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => setEditingStudent(s)} className="p-2 text-gray-500 hover:text-indigo-400">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(s.username)} className="p-2 text-gray-500 hover:text-red-500">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsModal;
