import React, { useState, useEffect } from 'react';
import { X, Key, Save } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('profesoria_api_key');
            if (storedKey) setApiKey(storedKey);
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('profesoria_api_key', apiKey);
        onClose();
        // Optional: Trigger a reload or context update if needed, but for now simple storage is enough
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
                <Card className="bg-gray-900 border-gray-800 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Key className="w-5 h-5 text-indigo-500" />
                            Settings
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Gemini API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Your key is stored locally in your browser.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="gap-2">
                                <Save className="w-4 h-4" />
                                Save Key
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsModal;
