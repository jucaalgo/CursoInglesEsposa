import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    BookOpen, Mic, Sun, Moon, CheckCircle,
    ChevronRight, Play, Award, Loader2, User, Volume2, X, Send,
    ArrowLeft, Brain, Sparkles, Trophy, Headphones, Grid, HelpCircle, LogOut, Lock, KeyRound, AlertCircle, RefreshCw, Settings, Zap, Map, Layers, RotateCcw, Shield, Trash2, Eye, Download, Milestone, Pencil, MessageCircle, Star, ArrowRight, Home, Plus, UserPlus, ChevronLeft, Shuffle, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CEFRLevel, UserProfile, Course, Lesson, Module, ChatMessage, AppState, InteractiveContent, PronunciationResult, FillInBlankExercise, ScrambleExercise
} from './types';
import * as GeminiService from './services/gemini';
import { RepositoryService } from './services/repository';
import { supabase } from './services/supabase';
import { UserRecord } from './services/storage'; // Kept for type compatibility for now
import AudioVisualizer from './components/AudioVisualizer';
import PronunciationDrill from './components/PronunciationDrill';
import Quiz from './components/Quiz';
import LiveTutorModal from './components/LiveTutorModal';
import confetti from 'canvas-confetti';

// Voice Options Constants
const VOICE_OPTIONS = [
    { name: 'Kore', label: 'Kore (Balanced)' },
    { name: 'Puck', label: 'Puck (Deep)' },
    { name: 'Charon', label: 'Charon (Deep & Calm)' },
    { name: 'Fenrir', label: 'Fenrir (Energetic)' },
    { name: 'Zephyr', label: 'Zephyr (Soft)' },
];

// --- COMPONENTS ---

// Toast Notification for Database Saves
const SaveNotification: React.FC<{ show: boolean }> = ({ show }) => {
    if (!show) return null;
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center z-50 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-bold text-sm">Progress Saved to Database</span>
        </div>
    );
};

const FillInBlanksDrill: React.FC<{ exercises: FillInBlankExercise[], onComplete: () => void }> = ({ exercises, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // Safety check
    if (!exercises || exercises.length === 0) {
        return <div className="p-8 text-center text-gray-400">No exercises available for this lesson.</div>;
    }

    const currentEx = exercises[currentIndex];
    // Safety check for current exercise
    if (!currentEx) return null;

    const parts = currentEx.sentence.split(/_{2,}/);

    const handleCheck = (option: string) => {
        if (isCorrect === true) return;
        setSelected(option);

        if (option.toLowerCase() === currentEx.correctWord.toLowerCase()) {
            setIsCorrect(true);
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        } else {
            setIsCorrect(false);
        }
    };

    const handleReveal = () => {
        if (isCorrect === true) return;
        setSelected(currentEx.correctWord);
        setIsCorrect(true);
    };

    const next = () => {
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelected(null);
            setIsCorrect(null);
        } else {
            onComplete();
        }
    };

    return (
        <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-in fade-in">
            <h3 className="text-xl font-bold mb-6 flex items-center text-indigo-600 dark:text-indigo-400">
                <Pencil className="w-5 h-5 mr-2" /> Complete the Phrase
            </h3>

            <div className="text-2xl font-medium text-center mb-8 leading-relaxed text-gray-800 dark:text-gray-100">
                {parts[0]}
                <span className={`inline-block border-b-2 px-2 mx-1 min-w-[80px] text-center transition-colors ${isCorrect === true ? 'border-green-500 text-green-600' :
                    isCorrect === false ? 'border-red-500 text-red-600' : 'border-gray-400 text-gray-400'
                    }`}>
                    {isCorrect === true ? currentEx.correctWord : (selected && !isCorrect ? selected : "___")}
                </span>
                {parts[1]}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-6">
                {currentEx.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleCheck(opt)}
                        disabled={isCorrect === true}
                        className={`px-6 py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${selected === opt
                            ? (isCorrect ? 'bg-green-500 text-white shadow-green-500/50' : 'bg-red-500 text-white shadow-red-500/50')
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200'
                            } shadow-md`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            {isCorrect === true ? (
                <div className="flex justify-center animate-in slide-in-from-bottom-2">
                    <button onClick={next} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                        {currentIndex < exercises.length - 1 ? "Next Phrase" : "Finish Exercise"}
                    </button>
                </div>
            ) : (
                <div className="flex justify-center mt-4">
                    <button onClick={handleReveal} className="text-sm text-gray-500 hover:text-brand-600 flex items-center underline transition-colors">
                        <Eye className="w-4 h-4 mr-1" /> Show Answer
                    </button>
                </div>
            )}

            <p className="text-center text-sm text-gray-400 mt-6">{currentEx.translation}</p>
        </div>
    );
};

const SentenceScramble: React.FC<{ data: ScrambleExercise, onComplete: () => void }> = ({ data, onComplete }) => {
    const [userOrder, setUserOrder] = useState<string[]>([]);
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [isSuccess, setIsSuccess] = useState(false);

    // Safety check
    if (!data || !data.scrambledParts) {
        return <div className="p-8 text-center text-gray-400">Scramble data unavailable.</div>;
    }

    useEffect(() => {
        const shuffled = [...data.scrambledParts].sort(() => Math.random() - 0.5);
        setAvailableWords(shuffled);
        setUserOrder([]);
        setIsSuccess(false);
    }, [data]);

    const handleSelectWord = (word: string, index: number) => {
        const newAvailable = [...availableWords];
        newAvailable.splice(index, 1);
        setAvailableWords(newAvailable);

        const newUserOrder = [...userOrder, word];
        setUserOrder(newUserOrder);

        const currentSentence = newUserOrder.join(' ');
        if (currentSentence === data.sentence) {
            setIsSuccess(true);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            setTimeout(onComplete, 1500);
        }
    };

    const handleRemoveWord = (word: string, index: number) => {
        if (isSuccess) return;
        const newUserOrder = [...userOrder];
        newUserOrder.splice(index, 1);
        setUserOrder(newUserOrder);

        setAvailableWords([...availableWords, word]);
    };

    const reset = () => {
        const shuffled = [...data.scrambledParts].sort(() => Math.random() - 0.5);
        setAvailableWords(shuffled);
        setUserOrder([]);
        setIsSuccess(false);
    };

    return (
        <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-in fade-in max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-6 flex items-center text-indigo-600 dark:text-indigo-400">
                <Shuffle className="w-5 h-5 mr-2" /> Unscramble the Sentence
            </h3>

            <div className={`min-h-[80px] p-4 rounded-xl border-2 border-dashed mb-8 flex flex-wrap gap-2 items-center transition-colors ${isSuccess
                ? 'bg-green-50 border-green-400'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}>
                {userOrder.length === 0 && !isSuccess && (
                    <span className="text-gray-400 text-sm w-full text-center">Tap words below to build the sentence</span>
                )}
                {userOrder.map((word, i) => (
                    <button
                        key={`${word}-${i}`}
                        onClick={() => handleRemoveWord(word, i)}
                        className="px-4 py-2 bg-white dark:bg-darkcard border shadow-sm rounded-lg font-bold text-gray-800 dark:text-white animate-in zoom-in duration-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                    >
                        {word}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center mb-8">
                {availableWords.map((word, i) => (
                    <button
                        key={`${word}-${i}`}
                        onClick={() => handleSelectWord(word, i)}
                        className="px-5 py-3 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-bold rounded-xl shadow-sm hover:bg-brand-100 hover:scale-105 transition-all"
                    >
                        {word}
                    </button>
                ))}
            </div>

            {isSuccess ? (
                <div className="text-center text-green-600 font-bold text-lg animate-in slide-in-from-bottom-2">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    Correct!
                </div>
            ) : (
                <div className="flex justify-between items-center mt-4">
                    <button onClick={reset} className="text-sm text-gray-500 hover:text-brand-600 flex items-center transition-colors">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </button>
                    <p className="text-sm text-gray-400 italic text-right">Translation: {data.translation}</p>
                </div>
            )}
        </div>
    );
};

// MODIFIED: Added API Key Input
const SettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentVoice: string;
    onSave: (voice: string, interests: string[], apiKey: string) => void;
    userInterests: string[];
}> = ({ isOpen, onClose, currentVoice, onSave, userInterests }) => {
    const [selectedVoice, setSelectedVoice] = useState(currentVoice);
    const [interests, setInterests] = useState<string[]>([...userInterests]);
    const [newInterest, setNewInterest] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [isPlaying, setIsPlaying] = useState<string | null>(null);

    useEffect(() => {
        const storedKey = localStorage.getItem('profesoria_api_key');
        if (storedKey) setApiKey(storedKey);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleTestVoice = async (voice: string) => {
        setIsPlaying(voice);
        try {
            const base64 = await GeminiService.generateSpeech("Hello! This is how I sound.", voice);
            if (base64) await GeminiService.playRawAudio(base64);
        } catch (e) {
            console.error(e);
        } finally {
            setIsPlaying(null);
        }
    };

    const addInterest = () => {
        if (newInterest.trim()) {
            setInterests([...interests, newInterest.trim()]);
            setNewInterest("");
        }
    };

    const removeInterest = (idx: number) => {
        const next = [...interests];
        next.splice(idx, 1);
        setInterests(next);
    };

    const handleSave = () => {
        onSave(selectedVoice, interests, apiKey);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-darkcard rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Settings className="w-5 h-5 mr-2" /> Settings
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                        <KeyRound className="w-4 h-4 mr-2" /> Google API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="Paste your Gemini API Key here..."
                        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
                    />
                    <p className="text-xs text-blue-600/70 dark:text-blue-400 mt-2">Required for AI generation. Stored locally on your device.</p>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tutor Voice</label>
                    <div className="grid grid-cols-1 gap-2">
                        {VOICE_OPTIONS.map(opt => (
                            <div
                                key={opt.name}
                                onClick={() => setSelectedVoice(opt.name)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedVoice === opt.name
                                    ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500 dark:bg-brand-900/20 dark:border-brand-500'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <span className="text-sm font-medium dark:text-gray-200">{opt.label}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleTestVoice(opt.name); }}
                                    disabled={isPlaying !== null}
                                    className="p-1.5 text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-full"
                                >
                                    {isPlaying === opt.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">My Interests</label>
                    <div className="flex gap-2 mb-3">
                        <input value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyDown={e => e.key === 'Enter' && addInterest()} placeholder="Add topic..." className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm" />
                        <button onClick={addInterest} className="px-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {interests.map((int, i) => (
                            <span key={i} className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 rounded-lg text-xs font-bold flex items-center">
                                {int}
                                <button onClick={() => removeInterest(i)} className="ml-2 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="flex-1 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors shadow-md">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// ... Rest of components (EditUserModal, LoginScreen, Onboarding, AdminPanel) kept identical ...
const EditUserModal: React.FC<{
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedProfile: UserProfile) => void;
}> = ({ user, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState<UserProfile>({ ...user });
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-darkcard rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Edit Profile</h2>
                <div className="space-y-4">
                    <input className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <button onClick={() => onSave(formData)} className="w-full py-2 bg-brand-600 text-white rounded font-bold">Save</button>
                    <button onClick={onClose} className="w-full py-2 text-gray-500">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const LoginScreen: React.FC<{ onLogin: (data: UserRecord | null, username: string) => void; onOpenSettings: () => void }> = ({ onLogin, onOpenSettings }) => {
    const [username, setUsername] = useState('');
    const [existingUsers, setExistingUsers] = useState<UserRecord[]>([]);

    useEffect(() => {
        // Note: In Supabase, listing ALL users usually requires admin privileges or a public profiles table.
        // For now, we'll try to list from the profiles table.
        const loadUsers = async () => {
            const { data } = await supabase.from('profesoria_profiles').select('*');
            if (data) {
                setExistingUsers(data.map(p => ({
                    userProfile: {
                        username: p.username,
                        name: p.username,
                        currentLevel: p.english_level,
                        targetLevel: p.english_level,
                        interests: p.interests,
                        learningStyle: 'visual',
                        dailyGoalMins: 15
                    },
                    course: null,
                    lastUpdated: new Date(p.updated_at).getTime()
                })));
            }
        };
        loadUsers();
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;
        performLogin(username.trim());
    };

    const performLogin = async (userKey: string) => {
        if (userKey.toLowerCase() === 'admin') {
            onLogin({
                userProfile: { isAdmin: true, name: 'Admin', currentLevel: CEFRLevel.C2, targetLevel: CEFRLevel.C2, interests: [], learningStyle: 'visual', dailyGoalMins: 0 },
                course: null,
                lastUpdated: Date.now()
            }, 'admin');
            return;
        }

        try {
            const profile = await RepositoryService.getProfileByUsername(userKey);
            if (profile) {
                const course = await RepositoryService.getFullCourse(profile.id);
                onLogin({
                    userProfile: {
                        username: profile.username,
                        name: profile.username, // Assuming name is username for now or adding to schema
                        currentLevel: profile.english_level,
                        targetLevel: profile.english_level, // Needs mapping in schema if different
                        interests: profile.interests,
                        learningStyle: 'visual', // Default
                        dailyGoalMins: 15 // Default
                    },
                    course: course,
                    lastUpdated: Date.now()
                }, userKey);
            } else {
                onLogin(null, userKey);
            }
        } catch (err) {
            console.error("Login lookup failed", err);
            alert("Database connection error");
        }
    };

    const handleDeleteUser = async (e: React.MouseEvent, userKey: string) => {
        e.stopPropagation();
        e.preventDefault();

        if (confirm(`Remove ${userKey}? This will delete data from the cloud.`)) {
            const { error } = await supabase.from('profesoria_profiles').delete().eq('username', userKey);
            if (!error) {
                setExistingUsers(prev => prev.filter(u => u.userProfile.username !== userKey));
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkbg p-4 relative">
            <button onClick={onOpenSettings} className="absolute top-6 right-6 p-3 bg-white dark:bg-darkcard rounded-full shadow-md text-gray-400 hover:text-brand-600 transition-colors z-50 border border-gray-100 dark:border-gray-700" title="API Settings">
                <Settings className="w-6 h-6" />
            </button>

            <div className="bg-white dark:bg-darkcard p-8 rounded-3xl shadow-xl max-w-4xl w-full border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col justify-center border-r border-gray-100 dark:border-gray-700 pr-0 md:pr-8">
                    <div className="text-center md:text-left mb-8">
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30 mx-auto md:mx-0">
                            <Brain className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profesoria AI</h1>
                        <p className="text-gray-500">Your personalized, adaptive English tutor.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">New Student</label>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50 dark:bg-gray-800 dark:text-white transition-all" placeholder="Type name & Press Enter..." />
                            <button type="submit" className="absolute right-2 top-2 p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                    <p className="text-center md:text-left text-xs text-gray-400 mt-6">Instructor Access: Type 'admin'</p>
                </div>
                <div className="flex-1 flex flex-col justify-center pl-0 md:pl-4">
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Continue Learning</h2>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {existingUsers.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">No profiles found.</p>
                            </div>
                        ) : (
                            existingUsers.filter(u => !u.userProfile.isAdmin).map((u, i) => (
                                <div key={i} onClick={() => performLogin(u.userProfile.username!)} className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800 border border-transparent hover:border-brand-200 dark:hover:border-brand-900 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">{u.userProfile.name.charAt(0).toUpperCase()}</div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">{u.userProfile.name}</h3>
                                            <p className="text-xs text-gray-500 flex items-center">Level {u.userProfile.currentLevel} <span className="mx-1">•</span> {u.userProfile.lastActiveLessonId ? 'Resuming Lesson' : 'Dashboard'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500 transform group-hover:translate-x-1 transition-all" />
                                        <button
                                            onClick={(e) => handleDeleteUser(e, u.userProfile.username || u.userProfile.name)}
                                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-20"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Onboarding: React.FC<{ onFinish: (data: Partial<UserProfile>) => void }> = ({ onFinish }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<Partial<UserProfile>>({
        currentLevel: CEFRLevel.A1,
        targetLevel: CEFRLevel.B2,
        interests: [],
        dailyGoalMins: 15
    });
    const [customInterest, setCustomInterest] = useState("");
    const levels = Object.values(CEFRLevel);
    const interestOptions = ["Business", "Travel", "Technology", "Culture", "Daily Life", "Academic", "Socializing", "Music", "Movies", "Sports", "Gaming", "Health", "Cooking", "Science", "Politics", "Art", "Literature", "History", "Nature", "Finance"];
    const toggleInterest = (int: string) => {
        const current = data.interests || [];
        if (current.includes(int)) setData({ ...data, interests: current.filter(i => i !== int) });
        else setData({ ...data, interests: [...current, int] });
    };
    const addCustomInterest = () => {
        if (customInterest.trim()) {
            setData({ ...data, interests: [...(data.interests || []), customInterest] });
            setCustomInterest("");
        }
    };
    const next = () => setStep(s => s + 1);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-darkbg flex items-center justify-center p-6">
            <div className="max-w-xl w-full bg-white dark:bg-darkcard rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-8 bg-brand-600 text-white">
                    <h2 className="text-2xl font-bold mb-2">{step === 1 && "What's your current level?"}{step === 2 && "What's your target?"}{step === 3 && "What interests you?"}</h2>
                    <div className="flex gap-1 mt-4">{[1, 2, 3].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/30'}`} />)}</div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                    {step === 1 && (
                        <div className="grid grid-cols-2 gap-4">
                            {levels.map(l => (
                                <button key={l} onClick={() => setData({ ...data, currentLevel: l })} className={`p-4 rounded-xl border-2 text-left transition-all ${data.currentLevel === l ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 hover:border-brand-200'}`}><span className="text-2xl font-bold block mb-1">{l}</span><span className="text-xs text-gray-500">{l === 'A1' ? 'Beginner' : l === 'C2' ? 'Master' : 'Intermediate'}</span></button>
                            ))}
                        </div>
                    )}
                    {step === 2 && (
                        <div className="grid grid-cols-2 gap-4">
                            {levels.map(l => (
                                <button key={l} onClick={() => setData({ ...data, targetLevel: l })} className={`p-4 rounded-xl border-2 text-left transition-all ${data.targetLevel === l ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 hover:border-brand-200'}`}><span className="text-2xl font-bold block mb-1">{l}</span></button>
                            ))}
                        </div>
                    )}
                    {step === 3 && (
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-3 mb-6">
                                {interestOptions.map(int => (
                                    <button key={int} onClick={() => toggleInterest(int)} className={`px-4 py-2 rounded-full font-medium transition-all ${data.interests?.includes(int) ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{int}</button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input className="flex-1 border p-2 rounded-lg" placeholder="Add other interest..." value={customInterest} onChange={e => setCustomInterest(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomInterest()} />
                                <button onClick={addCustomInterest} className="px-4 bg-gray-200 rounded-lg">+</button>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {data.interests?.filter(i => !interestOptions.includes(i)).map(i => (<span key={i} className="px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm font-bold">{i}</span>))}
                            </div>
                        </div>
                    )}
                    <div className="mt-8 flex justify-end">
                        {step < 3 ? <button onClick={next} className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 flex items-center">Next <ArrowRight className="w-5 h-5 ml-2" /></button> : <button onClick={() => onFinish(data)} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 flex items-center">Generate Course <Sparkles className="w-5 h-5 ml-2" /></button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<{ onLogout: () => void; onLoginAs: (u: string) => void }> = ({ onLogout, onLoginAs }) => {
    const [users, setUsers] = useState<UserRecord[]>([]);

    useEffect(() => {
        const loadUsers = async () => {
            const { data } = await supabase.from('profesoria_profiles').select('*');
            if (data) {
                setUsers(data.map(p => ({
                    userProfile: {
                        username: p.username,
                        name: p.username,
                        currentLevel: p.english_level,
                        targetLevel: p.english_level,
                        interests: p.interests,
                        learningStyle: 'visual',
                        dailyGoalMins: 15
                    },
                    course: null,
                    lastUpdated: new Date(p.updated_at).getTime()
                })));
            }
        };
        loadUsers();
    }, []);

    const deleteUser = async (username: string) => {
        if (!confirm(`Delete ${username}?`)) return;
        await supabase.from('profesoria_profiles').delete().eq('username', username);
        setUsers(users.filter(u => u.userProfile.username !== username));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-darkbg p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold dark:text-white flex items-center"><Shield className="w-8 h-8 mr-3 text-brand-600" /> Instructor Dashboard</h1>
                    <button onClick={onLogout} className="flex items-center px-4 py-2 bg-white dark:bg-darkcard border rounded-lg hover:bg-gray-50"><LogOut className="w-4 h-4 mr-2" /> Logout</button>
                </div>
                <div className="bg-white dark:bg-darkcard rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-500 text-sm">Student</th>
                                <th className="p-4 font-bold text-gray-500 text-sm">Level</th>
                                <th className="p-4 font-bold text-gray-500 text-sm">Goal</th>
                                <th className="p-4 font-bold text-gray-500 text-sm">Progress</th>
                                <th className="p-4 font-bold text-gray-500 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.filter(u => !u.userProfile.isAdmin).map((u, i) => (
                                <tr key={i} className="border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-4"><div className="font-bold text-gray-900 dark:text-white">{u.userProfile.name}</div><div className="text-xs text-gray-400">{u.userProfile.learningStyle} learner</div></td>
                                    <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">{u.userProfile.currentLevel}</span></td>
                                    <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">{u.userProfile.targetLevel}</span></td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{u.course?.modules.filter((m: any) => m.isCompleted).length || 0} / {u.course?.modules.length || 0} Modules</td>
                                    <td className="p-4 text-right flex justify-end gap-2"><button onClick={() => onLoginAs(u.userProfile.username!)} className="p-2 text-brand-600 hover:bg-brand-50 rounded" title="Login as User"><Eye className="w-4 h-4" /></button><button onClick={() => deleteUser(u.userProfile.username || u.userProfile.name)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete User"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const LessonWizard: React.FC<{
    lesson: Lesson;
    userLevel: string;
    onExit: () => void;
    onComplete: (score: number) => void;
    onUpdateLessonImage: (url: string) => void;
    moduleTitle?: string;
}> = ({ lesson, userLevel, onExit, onComplete, onUpdateLessonImage, moduleTitle }) => {
    const [step, setStep] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    useEffect(() => {
        if (!lesson.imageUrl && !isGeneratingImage && lesson.content?.scenario.description) {
            setIsGeneratingImage(true);
            GeminiService.generateLessonImage(lesson.content.scenario.description)
                .then(url => {
                    if (url) onUpdateLessonImage(url);
                    setIsGeneratingImage(false);
                })
                .catch(() => setIsGeneratingImage(false));
        }
    }, [lesson.id]);

    const steps = [
        { title: 'Scenario', icon: Map },
        { title: 'Vocabulary', icon: BookOpen },
        { title: 'Fill In', icon: Pencil },
        { title: 'Scramble', icon: Shuffle },
        { title: 'Speaking', icon: Mic },
        { title: 'Quiz', icon: HelpCircle },
        { title: 'Complete', icon: Trophy }
    ];

    const handleNext = () => setStep(s => Math.min(s + 1, steps.length - 1));
    const handleGameComplete = () => { confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } }); setTimeout(handleNext, 1000); };
    const handleQuizDone = (score: number) => { setQuizScore(score); confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } }); handleNext(); };

    if (!lesson.content?.scenario) {
        return <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-darkbg text-center p-6"><AlertCircle className="w-12 h-12 text-red-500 mb-4" /><h2 className="text-xl font-bold mb-2">Lesson content unavailable</h2><button onClick={onExit} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold">Go Back</button></div>;
    }

    const renderStepContent = () => {
        switch (step) {
            case 0: return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 overflow-hidden shadow-inner flex items-center justify-center">
                        {lesson.imageUrl ? (
                            <img src={lesson.imageUrl} alt="Scenario" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                                <Map className="w-12 h-12 mb-2 opacity-50" />
                                <span className="text-sm">Visualizing Scenario...</span>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                            <h3 className="text-2xl font-bold text-white">{lesson.title}</h3>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h4 className="text-lg font-bold mb-3 text-gray-900 dark:text-white flex items-center"><Map className="w-5 h-5 mr-2 text-brand-600" /> Context</h4>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg mb-6">{lesson.content?.scenario.description}</p>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500">
                            <p className="text-blue-800 dark:text-blue-200 italic">"{lesson.content?.scenario.context}"</p>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button onClick={handleNext} className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 flex items-center">
                            Start Learning <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );
            case 1: return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
                        <BookOpen className="w-6 h-6 mr-3 text-brand-600" /> Key Vocabulary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lesson.content?.vocabulary.map((vocab, i) => (
                            <div key={i} className="bg-white dark:bg-darkcard p-5 rounded-xl border-l-4 border-brand-500 shadow-sm hover:shadow-md transition-all">
                                <h4 className="text-xl font-bold text-brand-700 dark:text-brand-400 mb-1">{vocab.term}</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">{vocab.definition}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button onClick={handleNext} className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 flex items-center">
                            Practice <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );
            case 2: return (
                <FillInBlanksDrill exercises={lesson.content?.fillInBlanks || []} onComplete={handleGameComplete} />
            );
            case 3: return (
                <SentenceScramble data={lesson.content?.scramble || { id: 'err', sentence: 'Error loading', scrambledParts: [], translation: '' }} onComplete={handleGameComplete} />
            );
            case 4: return (
                <PronunciationDrill turns={lesson.content?.conversation.turns || []} userLevel={userLevel} onComplete={handleGameComplete} />
            );
            case 5: return (
                <Quiz questions={lesson.content?.quiz || []} onComplete={handleQuizDone} />
            );
            case 6: return (
                <div className="text-center py-10 animate-in zoom-in">
                    <div className="w-32 h-32 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Trophy className="w-16 h-16 text-yellow-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Lesson Complete!</h2>
                    <p className="text-gray-500 text-lg mb-8">You mastered "{lesson.title}"</p>

                    <div className="flex justify-center gap-8 mb-10">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-brand-600">{quizScore}/{lesson.content?.quiz.length}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Quiz Score</div>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-brand-600">+50</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">XP Earned</div>
                        </div>
                    </div>

                    <button onClick={() => onComplete(quizScore)} className="px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold text-xl shadow-xl transform hover:scale-105 transition-all">
                        Back to Module
                    </button>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-darkbg flex flex-col">
            <div className="bg-white dark:bg-darkcard border-b border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-40">
                <button onClick={onExit} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
                <div className="flex-1 px-4">
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${((step) / steps.length) * 100}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center text-sm font-bold text-brand-600">
                    {steps[step]?.icon && React.createElement(steps[step].icon, { className: "w-4 h-4 mr-2" })}
                    {steps[step]?.title}
                </div>
            </div>

            <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
                {renderStepContent()}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<AppState>('auth');
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showLiveTutor, setShowLiveTutor] = useState(false);
    const [showSaveNotif, setShowSaveNotif] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadInitialUser = async () => {
            const lastUser = localStorage.getItem('profesoria_last_user');
            if (lastUser) {
                try {
                    const profile = await RepositoryService.getProfileByUsername(lastUser);
                    if (profile) {
                        const courseData = await RepositoryService.getFullCourse(profile.id);
                        setUser({
                            username: profile.username,
                            name: profile.username,
                            currentLevel: profile.english_level,
                            targetLevel: profile.english_level,
                            interests: profile.interests,
                            learningStyle: 'visual',
                            dailyGoalMins: 15
                        });
                        setCourse(courseData);
                        setView('dashboard');
                    }
                } catch (e) {
                    console.error("Auto-login failed", e);
                }
            }
        };
        loadInitialUser();
    }, []);

    const saveProgress = async (updatedUser: UserProfile, updatedCourse: Course | null) => {
        setUser(updatedUser);
        if (updatedCourse) setCourse(updatedCourse);

        try {
            await RepositoryService.upsertProfile(updatedUser);
            if (updatedCourse) {
                const profile = await RepositoryService.getProfileByUsername(updatedUser.username!);
                if (profile) {
                    await RepositoryService.saveFullCourse(profile.id, updatedCourse);
                }
            }
            localStorage.setItem('profesoria_last_user', updatedUser.username || updatedUser.name);
            setShowSaveNotif(true);
            setTimeout(() => setShowSaveNotif(false), 2000);
        } catch (e) {
            console.error("Supabase Save Error:", e);
        }
    };

    const handleLogin = (data: UserRecord | null, username: string) => {
        if (data) {
            setUser(data.userProfile);
            setCourse(data.course);
            if (data.userProfile.isAdmin) setView('admin');
            else setView('dashboard');
            localStorage.setItem('profesoria_last_user', username);
        } else {
            // New user flow
            setUser({ name: username, username, currentLevel: CEFRLevel.A1, targetLevel: CEFRLevel.B2, interests: [], learningStyle: 'visual', dailyGoalMins: 15 });
            setView('onboarding');
        }
    };

    const handleOnboardingFinish = async (prefs: Partial<UserProfile>) => {
        if (!user) return;
        const updatedUser = { ...user, ...prefs };
        setLoading(true);
        setView('loading_course');

        try {
            // Generate Syllabus
            const syllabus = await GeminiService.generateSyllabus(updatedUser);

            // Create initial course structure
            const newCourse: Course = {
                id: Date.now().toString(),
                title: "Personalized English Mastery",
                description: `A custom path from ${updatedUser.currentLevel} to ${updatedUser.targetLevel}`,
                modules: syllabus.map((topic, i) => ({
                    id: `mod-${i}`,
                    title: topic,
                    description: `Mastering ${topic}`,
                    isCompleted: false,
                    isGenerated: false,
                    lessons: []
                })),
                syllabus
            };

            await saveProgress(updatedUser, newCourse);
            setView('dashboard');
        } catch (e) {
            console.error("Course gen failed", e);
            alert("Failed to generate course. Please check API Key.");
            setView('onboarding');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModule = async (moduleId: string) => {
        if (!course || !user) return;
        setActiveModuleId(moduleId);

        const modIndex = course.modules.findIndex(m => m.id === moduleId);
        if (modIndex === -1) return;
        const module = course.modules[modIndex];

        if (!module.isGenerated) {
            setLoading(true);
            try {
                const lessonTitles = await GeminiService.generateModuleLessons(module.title, user.currentLevel);
                const lessons: Lesson[] = lessonTitles.map((t, i) => ({
                    id: `${moduleId}-les-${i}`,
                    title: t,
                    description: `Lesson on ${t}`,
                    isCompleted: false
                }));

                const updatedCourse = { ...course };
                updatedCourse.modules[modIndex] = {
                    ...module,
                    isGenerated: true,
                    lessons
                };
                await saveProgress(user, updatedCourse);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        setView('module_view');
    };

    const handleOpenLesson = async (lessonId: string) => {
        if (!course || !user || !activeModuleId) return;
        setActiveLessonId(lessonId);

        const modIndex = course.modules.findIndex(m => m.id === activeModuleId);
        const mod = course.modules[modIndex];
        const lesIndex = mod.lessons.findIndex(l => l.id === lessonId);
        const lesson = mod.lessons[lesIndex];

        // Check if content exists AND has exercises. If not, generate.
        const isEmpty = !lesson.content || !lesson.content.fillInBlanks || lesson.content.fillInBlanks.length === 0;

        if (isEmpty) {
            setLoading(true);
            try {
                const content = await GeminiService.generateInteractiveContent(lesson.title, user.currentLevel, mod.title);

                // Deep clone to avoid mutation
                const updatedCourse = JSON.parse(JSON.stringify(course));
                updatedCourse.modules[modIndex].lessons[lesIndex].content = content;

                await saveProgress(user, updatedCourse);
                setCourse(updatedCourse); // Update state properly
            } catch (e) {
                console.error(e);
                alert("Failed to generate content. Please check your internet or API Key.");
                setLoading(false);
                return; // STOP EXECUTION - Do not open empty lesson
            } finally {
                setLoading(false);
            }
        }
        setView('lesson_view');
    };

    const handleLessonComplete = async (score: number) => {
        if (!course || !user || !activeModuleId || !activeLessonId) return;

        const modIndex = course.modules.findIndex(m => m.id === activeModuleId);
        const lesIndex = course.modules[modIndex].lessons.findIndex(l => l.id === activeLessonId);

        const updatedCourse = { ...course };
        updatedCourse.modules[modIndex].lessons[lesIndex].isCompleted = true;
        updatedCourse.modules[modIndex].lessons[lesIndex].score = score;

        // Check module completion
        const allDone = updatedCourse.modules[modIndex].lessons.every(l => l.isCompleted);
        if (allDone) updatedCourse.modules[modIndex].isCompleted = true;

        await saveProgress(user, updatedCourse);
        setView('module_view');
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    };

    const handleUpdateLessonImage = async (url: string) => {
        if (!course || !activeModuleId || !activeLessonId) return;
        const modIndex = course.modules.findIndex(m => m.id === activeModuleId);
        const lesIndex = course.modules[modIndex].lessons.findIndex(l => l.id === activeLessonId);

        const updatedCourse = { ...course };
        updatedCourse.modules[modIndex].lessons[lesIndex].imageUrl = url;
        // Silent save for image update to avoid toast spam
        if (user) await saveProgress(user, updatedCourse);
        setCourse(updatedCourse);
    };

    if (view === 'auth') return <LoginScreen onLogin={handleLogin} onOpenSettings={() => setShowSettings(true)} />;

    // Check if settings modal is open (available in all views)
    const renderSettings = () => (
        <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            currentVoice={user?.voice || 'Kore'}
            userInterests={user?.interests || []}
            onSave={async (voice, interests, apiKey) => {
                if (user) await saveProgress({ ...user, voice, interests }, course);
                if (apiKey) localStorage.setItem('profesoria_api_key', apiKey);
            }}
        />
    );

    if (view === 'admin' && user?.isAdmin) return <AdminPanel onLogout={() => { setUser(null); setView('auth'); }} onLoginAs={async (u) => {
        const profile = await RepositoryService.getProfileByUsername(u);
        if (profile) {
            const course = await RepositoryService.getFullCourse(profile.id);
            handleLogin({
                userProfile: {
                    username: profile.username,
                    name: profile.username,
                    currentLevel: profile.english_level,
                    targetLevel: profile.english_level,
                    interests: profile.interests,
                    learningStyle: 'visual',
                    dailyGoalMins: 15
                },
                course: course,
                lastUpdated: Date.now()
            }, u);
        }
    }} />;

    if (view === 'onboarding') return <Onboarding onFinish={handleOnboardingFinish} />;

    if (view === 'loading_course') return (
        <div className="min-h-screen bg-brand-600 flex flex-col items-center justify-center text-white">
            <Sparkles className="w-16 h-16 animate-pulse mb-6" />
            <h2 className="text-3xl font-bold mb-2">Generating Your Course</h2>
            <p className="opacity-80">Consulting AI Curriculum Experts...</p>
        </div>
    );

    // Dashboard & Module Views
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white font-sans selection:bg-brand-100 selection:text-brand-900 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-float"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '-3s' }}></div>

            {renderSettings()}
            <SaveNotification show={showSaveNotif} />
            <LiveTutorModal isOpen={showLiveTutor} onClose={() => setShowLiveTutor(false)} userName={user?.name || 'Student'} userLevel={user?.currentLevel || 'B1'} />

            {/* Top Bar */}
            <header className="bg-white dark:bg-darkcard border-b dark:border-gray-700 p-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {view !== 'dashboard' && (
                        <button onClick={() => setView('dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <Home className="w-5 h-5" />
                        </button>
                    )}
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Brain className="w-6 h-6 text-brand-600" />
                        {view === 'dashboard' ? 'My Course' : view === 'module_view' ? course?.modules.find(m => m.id === activeModuleId)?.title : 'Learning'}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowLiveTutor(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                        <Headphones className="w-4 h-4" /> Live Tutor
                    </button>
                    <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <Settings className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                        {user?.name.charAt(0)}
                    </div>
                </div>
            </header>

            {loading && (
                <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-darkcard p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                        <Loader2 className="w-10 h-10 animate-spin text-brand-600 mb-4" />
                        <p className="font-medium">Generating content...</p>
                    </div>
                </div>
            )}

            {view === 'lesson_view' && activeLessonId && activeModuleId && course ? (
                <LessonWizard
                    lesson={course.modules.find(m => m.id === activeModuleId)!.lessons.find(l => l.id === activeLessonId)!}
                    moduleTitle={course.modules.find(m => m.id === activeModuleId)?.title}
                    userLevel={user?.currentLevel || 'B1'}
                    onExit={() => setView('module_view')}
                    onComplete={handleLessonComplete}
                    onUpdateLessonImage={handleUpdateLessonImage}
                />
            ) : view === 'module_view' && activeModuleId && course ? (
                <main className="max-w-4xl mx-auto p-6">
                    <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                        <span onClick={() => setView('dashboard')} className="cursor-pointer hover:underline">Course</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-bold text-gray-900 dark:text-white">{course.modules.find(m => m.id === activeModuleId)?.title}</span>
                    </div>

                    <div className="grid gap-4">
                        {course.modules.find(m => m.id === activeModuleId)?.lessons.map((lesson, i) => (
                            <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => handleOpenLesson(lesson.id)}
                                className={`glass-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group ${lesson.isCompleted ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-indigo-500'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${lesson.isCompleted ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {lesson.isCompleted ? <CheckCircle className="w-6 h-6" /> : i + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors">{lesson.title}</h3>
                                        <p className="text-sm text-gray-500">{lesson.description}</p>
                                    </div>
                                </div>
                                <button className="p-3 glass-card rounded-full group-hover:grad-brand group-hover:text-white transition-all">
                                    {lesson.isCompleted ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </main>
            ) : (
                // Dashboard View
                <main className="max-w-5xl mx-auto p-6">
                    <div className="mb-8 grad-brand rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 transition-transform duration-1000 group-hover:scale-110"></div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-4xl font-black mb-2 tracking-tight">Focus on your growth, {user?.name.split(' ')[0]}!</h2>
                                <p className="opacity-80 text-lg mb-6 max-w-md">Your personalized path to mastering English from {user?.currentLevel} to {user?.targetLevel}.</p>
                                <div className="flex flex-wrap gap-4">
                                    <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3 border border-white/20">
                                        <div className="p-2 bg-yellow-400 rounded-lg text-brand-900"><Trophy className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-xl font-bold leading-none">1,240</div>
                                            <div className="text-[10px] uppercase font-bold opacity-60">Total XP</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3 border border-white/20">
                                        <div className="p-2 bg-orange-500 rounded-lg text-white"><Zap className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-xl font-bold leading-none">5 Days</div>
                                            <div className="text-[10px] uppercase font-bold opacity-60">Streak</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3 border border-white/20">
                                        <div className="p-2 bg-indigo-500 rounded-lg text-white"><Map className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-xl font-bold leading-none">{course?.modules.filter(m => m.isCompleted).length}/{course?.modules.length}</div>
                                            <div className="text-[10px] uppercase font-bold opacity-60">Modules</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:block w-32 h-32 relative">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * ((course?.modules.filter(m => m.isCompleted).length || 0) / (course?.modules.length || 1)))} strokeLinecap="round" className="transition-all duration-1000" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold">{Math.round(((course?.modules.filter(m => m.isCompleted).length || 0) / (course?.modules.length || 1)) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <Layers className="w-5 h-5 mr-2 text-brand-600" /> Your Learning Path
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {course?.modules.map((module, i) => (
                            <motion.div
                                key={module.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => handleOpenModule(module.id)}
                                className={`group relative glass-card p-6 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 ${module.isCompleted ? 'border-green-200 dark:border-green-900/30' : 'border-gray-100 dark:border-gray-700'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Module {i + 1}</span>
                                    {module.isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                                </div>
                                <h4 className="text-lg font-bold mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">{module.title}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{module.description}</p>

                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full ${module.isCompleted ? 'bg-green-500' : 'grad-brand'}`} style={{ width: module.isCompleted ? '100%' : `${(module.lessons.filter(l => l.isCompleted).length / (module.lessons.length || 10)) * 100}%` }}></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </main>
            )}
        </div>
    );
};

export default App;