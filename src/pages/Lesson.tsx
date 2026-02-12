import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateInteractiveContent, generateSpeech, playRawAudio } from '../services/gemini';
import { updateProgress } from '../services/repository';
import { useUserProfile } from '../hooks/useUserProfile';
import { useCourse } from '../hooks/useCourse';
import { InteractiveContent } from '../types';
import Button from '../components/Button';
import confetti from 'canvas-confetti';
import { ArrowLeft, BookOpen, CheckCircle, Headphones, HelpCircle, Volume2, Mic, Award, Shuffle, PenLine, Link2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/sounds';
import { useVoiceInput } from '../hooks/useVoiceInput';
import VoiceStatusIndicator from '../components/VoiceStatusIndicator';

// Exercise Components
import StoryExercise from '../components/exercises/StoryExercise';
import VocabularyExercise from '../components/exercises/VocabularyExercise';
import MatchingExercise from '../components/exercises/MatchingExercise';
import FillBlankExercise from '../components/exercises/FillBlankExercise';
import ScrambleExercise from '../components/exercises/ScrambleExercise';
import QuizExercise from '../components/exercises/QuizExercise';
import ListeningExercise from '../components/exercises/ListeningExercise';
import PronunciationExercise from '../components/exercises/PronunciationExercise';

// Tab types
type TabType = 'story' | 'vocab' | 'matching' | 'fillblanks' | 'scramble' | 'quiz' | 'listening' | 'pronunciation';

const Lesson: React.FC = () => {
    const { topic } = useParams<{ topic: string }>();
    const navigate = useNavigate();
    const { profile } = useUserProfile();
    const { markLessonComplete } = useCourse();

    const [content, setContent] = useState<InteractiveContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('story');

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'story', label: 'Story', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'vocab', label: 'Vocab', icon: <HelpCircle className="w-4 h-4" /> },
        { id: 'matching', label: 'Match', icon: <Link2 className="w-4 h-4" /> },
        { id: 'fillblanks', label: 'Fill', icon: <PenLine className="w-4 h-4" /> },
        { id: 'scramble', label: 'Scramble', icon: <Shuffle className="w-4 h-4" /> },
        { id: 'quiz', label: 'Quiz', icon: <CheckCircle className="w-4 h-4" /> },
        { id: 'listening', label: 'Listen', icon: <Headphones className="w-4 h-4" /> },
        { id: 'pronunciation', label: 'Speak', icon: <Mic className="w-4 h-4" /> },
    ];

    // XP animation
    const [xpEarned, setXpEarned] = useState(0);
    const [showXpAnimation, setShowXpAnimation] = useState(false);

    // Hands-Free Mode
    const [isHandsFree, setIsHandsFree] = useState(false);
    const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceInput();
    const [voiceStep, setVoiceStep] = useState<'idle' | 'speaking' | 'listening' | 'processing'>('idle');

    useEffect(() => {
        if (topic && profile) loadContent();
    }, [topic, profile?.username]);

    // Voice Command State
    const [voiceStatus, setVoiceStatus] = useState<import('../components/VoiceStatusIndicator').VoiceStatus>('idle');
    const [lastCommand, setLastCommand] = useState<import('../services/ai/voice_command_manager').VoiceCommand | null>(null);
    const [voiceError, setVoiceError] = useState<string | undefined>(undefined);

    // Initial permission check (optional, but good for UX)
    useEffect(() => {
        if (isHandsFree) {
            startListening();
            setVoiceStatus('listening');
        } else {
            stopListening();
            setVoiceStatus('idle');
        }
    }, [isHandsFree, startListening, stopListening]);

    // Command Processing Effect
    useEffect(() => {
        if (!isHandsFree || !transcript) return;

        const processVoice = async () => {
            // Simple debounce/wait for pause could go here, but we'll try eager matching for now
            // or just rely on the stream.
            // For better UX, we might want to wait for a pause, but let's try immediate matching.

            const { VoiceCommandManager } = await import('../services/ai/voice_command_manager');
            const command = VoiceCommandManager.parseCommand(transcript);

            if (command.type !== 'NO_MATCH') {
                setVoiceStatus('processing');
                console.log("Voice Command:", command);
                setLastCommand(command);

                // Global / Fallback Commands (if not handled by child contextual logic)
                // We'll let the child `useEffect` pick it up.
                // However, for "REPEAT", we might want global handling if child doesn't support it.
                // Let's keep the switch for simple feedback for now.

                    case 'NEXT':
// Quiz handles 'NEXT' internally to submit/advance
if (activeTab !== 'quiz') {
    handleVoiceNext();
}
break;
                    case 'REPEAT_AUDIO':
// Global fallback?
break;
                    case 'SELECT_OPTION':
break;
                }

setVoiceStatus('success');
// Reset status to listening after a delay
setTimeout(() => {
    setVoiceStatus('listening');
    setLastCommand(null); // Clear command so it doesn't stick
}, 2000);
setTimeout(() => resetTranscript(), 1000);
            }
        };

const timer = setTimeout(processVoice, 500); // Debounce checking
return () => clearTimeout(timer);
    }, [transcript, isHandsFree]); // Depend on transcript updates

const handleVoiceNext = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
        handleTabChange(tabs[currentIndex + 1].id);
    } else {
        // Finish lesson
        handleComplete();
    }
};

const loadContent = async () => {
    if (!topic || !profile) return;
    setLoading(true);
    try {
        const data = await generateInteractiveContent(topic, profile.current_level);
        setContent(data);
    } catch (error) {
        console.error("Failed to load lesson", error);
    } finally {
        setLoading(false);
    }
};

const handleComplete = async () => {
    if (topic && profile) {
        playClickSound();
        await markLessonComplete(topic);

        // Celebration Logic
        const currentDaily = (profile.daily_xp || 0) + xpEarned;
        const goal = profile.daily_goal || 50;

        if (currentDaily >= goal && (profile.daily_xp || 0) < goal) {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#6366f1', '#a855f7', '#ec4899', '#fbbf24']
            });
        } else {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }

        navigate('/academy');
    }
};

const playTTS = async (text: string) => {
    playClickSound();
    try {
        const audio = await generateSpeech(text);
        await playRawAudio(audio);
    } catch (e) { console.error(e); }
};

const awardXP = (points: number) => {
    if (!profile) return;
    playCorrectSound();
    setXpEarned(prev => prev + points);
    setShowXpAnimation(true);

    updateProgress(profile.username, points).catch(e => console.error("Failed to sync XP", e));

    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setShowXpAnimation(false), 1500);
};

const handlePlaySound = (type: 'correct' | 'wrong' | 'click') => {
    if (type === 'correct') playCorrectSound();
    else if (type === 'wrong') playWrongSound();
    else playClickSound();
};

const handleTabChange = (tab: TabType) => {
    playClickSound();
    setActiveTab(tab);
};

if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-gray-400 animate-pulse font-medium">Preparing your personalized lesson...</p>
        </div>
    );
}

if (!content) return <div className="text-center py-20 text-gray-500">Error loading lesson.</div>;



return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24 px-1 sm:px-0">
        {/* XP Animation Overlay */}
        {showXpAnimation && (
            <div className="fixed inset-x-0 top-10 flex justify-center z-[100] pointer-events-none">
                <div className="bg-amber-500 text-black font-bold px-6 py-2 rounded-full shadow-2xl animate-in zoom-in-50 duration-300 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    +{xpEarned} XP
                </div>
            </div>
        )}

        {/* Voice Status Overlay */}
        <VoiceStatusIndicator
            status={voiceStatus}
            transcript={transcript}
            errorMessage={voiceError}
            lastCommand={lastCommand?.type}
        />

        {/* Header */}
        <header className="flex items-center gap-3 py-2 bg-gray-950/50 backdrop-blur sticky top-0 z-40 px-3 -mx-4 sm:mx-0 sm:rounded-xl">
            <Button variant="ghost" size="sm" onClick={() => navigate('/academy')} className="p-2">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">{topic}</h1>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${(tabs.findIndex(t => t.id === activeTab) + 1) / tabs.length * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{tabs.findIndex(t => t.id === activeTab) + 1}/{tabs.length}</span>
                </div>
            </div>

            {/* Hands-Free Toggle */}
            <button
                onClick={() => { playClickSound(); setIsHandsFree(!isHandsFree); }}
                className={`
                        ml-2 p-2 rounded-xl border transition-all flex items-center gap-2
                        ${isHandsFree
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'}
                    `}
            >
                {isHandsFree ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                <span className="text-xs font-bold hidden sm:inline">VOICE MODE</span>
            </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 snap-x hide-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap snap-start shrink-0
                            transition-all duration-300 border
                            ${activeTab === tab.id
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
                        }
                        `}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>

        {/* Content Container */}
        <div className="min-h-[450px] animate-in slide-in-from-right-5 duration-500">
            {activeTab === 'story' && (
                <StoryExercise
                    content={content}
                    onComplete={() => handleTabChange('vocab')}
                    onPlayTTS={playTTS}
                />
            )}
            {activeTab === 'vocab' && (
                <VocabularyExercise
                    content={content}
                    onComplete={() => handleTabChange('matching')}
                    onPlayTTS={playTTS}
                />
            )}
            {activeTab === 'matching' && (
                <MatchingExercise
                    content={content}
                    onComplete={() => handleTabChange('fillblanks')}
                    onAwardXP={awardXP}
                    onPlaySound={handlePlaySound}
                />
            )}
            {activeTab === 'fillblanks' && (
                <FillBlankExercise
                    content={content}
                    onComplete={() => handleTabChange('scramble')}
                    onAwardXP={awardXP}
                    onPlaySound={handlePlaySound}
                />
            )}
            {activeTab === 'scramble' && (
                <ScrambleExercise
                    content={content}
                    onComplete={() => handleTabChange('quiz')}
                    onAwardXP={awardXP}
                    onPlaySound={handlePlaySound}
                />
            )}
            {activeTab === 'quiz' && (
                <QuizExercise
                    content={content}
                    onComplete={() => handleTabChange('listening')}
                    onAwardXP={awardXP}
                    onPlaySound={handlePlaySound}
                    voiceCommand={lastCommand}
                />
            )}
            {activeTab === 'listening' && (
                <ListeningExercise
                    content={content}
                    onComplete={() => handleTabChange('pronunciation')}
                    onAwardXP={awardXP}
                    onPlaySound={handlePlaySound}
                    onPlayTTS={playTTS}
                />
            )}
            {activeTab === 'pronunciation' && profile && (
                <PronunciationExercise
                    content={content}
                    currentLevel={profile.current_level}
                    onComplete={handleComplete}
                    onAwardXP={awardXP}
                    onPlaySound={handlePlaySound}
                    onPlayTTS={playTTS}
                />
            )}
        </div>
    </div>
);
};

export default Lesson;
