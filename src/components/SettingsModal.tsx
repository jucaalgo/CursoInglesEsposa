import React, { useState, useEffect } from 'react';
import { X, Key, Save, LogOut } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { signOut } = useAuth();
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('profesoria_api_key');
            if (storedKey) setApiKey(storedKey);
        }
    }, [isOpen]);

    const handleSaveKey = () => {
        localStorage.setItem('profesoria_api_key', apiKey);
        onClose();
        window.location.reload();
    };

    const handleSignOut = async () => {
        await signOut();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
                <Card className="bg-gray-900 border-gray-800 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
                        <h3 className="text-xl font-black italic text-gray-100">SETTINGS</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                        {/* API Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-indigo-400">
                                <Key className="w-5 h-5" />
                                <h4 className="font-bold uppercase tracking-wider text-sm">API Configuration</h4>
                            </div>

                            <div className="space-y-4 pl-8">
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
                                        Required for personalized AI features.
                                    </p>
                                </div>
                                <Button onClick={handleSaveKey} className="w-full h-12 rounded-xl">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Configuration
                                </Button>
                            </div>
                        </div>

                        {/* Account Actions */}
                        <div className="pt-6 border-t border-gray-800 space-y-4">
                            <div className="flex items-center gap-3 text-red-400">
                                <LogOut className="w-5 h-5" />
                                <h4 className="font-bold uppercase tracking-wider text-sm">Account</h4>
                            </div>

                            <div className="pl-8">
                                <Button variant="secondary" onClick={handleSignOut} className="w-full h-12 rounded-xl border-red-900/30 hover:bg-red-900/10 text-red-500 hover:text-red-400">
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsModal;
