import React, { useState, useEffect } from 'react';
import { X, LogOut, Trash2, AlertCircle, Volume2, Gauge } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { deleteUserData } from '../services/repository';
import { getPlaybackSpeed, setPlaybackSpeed } from '../services/ai/audio';

const VOICE_OPTIONS = [
    { id: 'Kore', name: 'Kore', description: 'Warm, professional' },
    { id: 'Puck', name: 'Puck', description: 'Clear, friendly' },
    { id: 'Charon', name: 'Charon', description: 'Deep, authoritative' },
    { id: 'Fenrir', name: 'Fenrir', description: 'Neutral, steady' },
    { id: 'Aoede', name: 'Aoede', description: 'Bright, energetic' },
    { id: 'Orus', name: 'Orus', description: 'Calm, reassuring' },
];

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { signOut, user } = useAuth();
    const { toast } = useToast();
    const [selectedVoice, setSelectedVoice] = useState(() =>
        localStorage.getItem('profesoria_tts_voice') || 'Kore'
    );
    const [playbackSpeed, setLocalSpeed] = useState(() => getPlaybackSpeed());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedVoice(localStorage.getItem('profesoria_tts_voice') || 'Kore');
            setLocalSpeed(getPlaybackSpeed());
        }
    }, [isOpen]);

    const handleVoiceChange = (voiceId: string) => {
        setSelectedVoice(voiceId);
        localStorage.setItem('profesoria_tts_voice', voiceId);
        toast.info('Voice Updated', `TTS voice changed to ${VOICE_OPTIONS.find(v => v.id === voiceId)?.name}`);
    };

    const handleSpeedChange = (speed: number) => {
        const rounded = Math.round(speed * 10) / 10;
        setLocalSpeed(rounded);
        setPlaybackSpeed(rounded);
        localStorage.setItem('profesoria_playback_speed', rounded.toString());
    };

    const handleSignOut = async () => {
        await signOut();
        onClose();
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        try {
            await deleteUserData(user.id);
            await signOut();
            toast.success('Account Deleted', 'Your data has been permanently removed.');
            onClose();
        } catch (error) {
            toast.error('Delete Failed', 'Could not delete your account. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md max-h-[90vh] animate-in zoom-in-95 duration-200">
                <Card className="bg-gray-900 border-gray-800 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
                        <h3 className="text-xl font-black italic text-gray-100">SETTINGS</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                        {/* TTS Voice Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-indigo-400">
                                <Volume2 className="w-5 h-5" />
                                <h4 className="font-bold uppercase tracking-wider text-sm">Voice & Audio</h4>
                            </div>

                            <div className="space-y-3 pl-8">
                                <div className="grid grid-cols-2 gap-2">
                                    {VOICE_OPTIONS.map((voice) => (
                                        <button
                                            key={voice.id}
                                            onClick={() => handleVoiceChange(voice.id)}
                                            className={`p-3 rounded-xl text-left transition-all duration-200 ${
                                                selectedVoice === voice.id
                                                    ? 'ring-2 ring-indigo-500 bg-indigo-500/10'
                                                    : 'bg-gray-950 border border-gray-800 hover:border-gray-700'
                                            }`}
                                        >
                                            <p className={`text-sm font-bold ${selectedVoice === voice.id ? 'text-indigo-400' : 'text-gray-300'}`}>
                                                {voice.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500">{voice.description}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Playback Speed */}
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-400 uppercase tracking-tight">
                                            <Gauge className="w-4 h-4 inline mr-1" />
                                            Speed
                                        </label>
                                        <span className="text-sm font-mono text-indigo-400">{playbackSpeed.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1.5"
                                        step="0.1"
                                        value={playbackSpeed}
                                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                        <span>0.5x Slow</span>
                                        <span>1.0x Normal</span>
                                        <span>1.5x Fast</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-6 border-t border-gray-800 space-y-4">
                            <div className="flex items-center gap-3 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                <h4 className="font-bold uppercase tracking-wider text-sm">Danger Zone</h4>
                            </div>

                            <div className="pl-8 space-y-3">
                                <Button variant="secondary" onClick={handleSignOut} className="w-full h-12 rounded-xl border-gray-700 hover:bg-gray-800 text-gray-300">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </Button>

                                {!showDeleteConfirm ? (
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full h-12 rounded-xl border-red-900/30 hover:bg-red-900/10 text-red-500 hover:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </Button>
                                ) : (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
                                        <p className="text-sm text-red-300">
                                            This will permanently delete your account and all data. This cannot be undone.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleDeleteAccount}
                                                className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-500 text-white"
                                            >
                                                Yes, Delete Everything
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 h-10 rounded-lg border-gray-700 text-gray-400"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsModal;