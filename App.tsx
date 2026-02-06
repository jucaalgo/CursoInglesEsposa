import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sun, Moon, Settings, LogOut, BookOpen, Target, Play, Loader2, Zap,
    ChevronLeft, Flame, Award, CheckCircle, Circle, Lock, Star, X,
    Volume2, Mic, MicOff, Send, RotateCcw, ChevronRight, PlayCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Services
import {
    generateSyllabus, generateModuleLessons, generateInteractiveContent,
    evaluatePronunciation, generateSpeech, playRawAudio, analyzeStudentResponse,
    blobToBase64
} from './services/gemini';
import { getUser, saveUser, saveCourse, getCourse, getCurrentUser, setCurrentUser, clearCurrentUser } from './services/repository';

// Types
import {
    UserProfile, Course, Module, Lesson, CEFRLevel,
    InteractiveContent, PronunciationResult, ChatMessage, VocabularyItem
} from './types';

// Existing components we're keeping
import PronunciationDrill from './components/PronunciationDrill';
import Quiz from './components/Quiz';
import LiveTutorModal from './components/LiveTutorModal';

// ============================================
// HOOKS
// ============================================

// Streak Hook
const useStreak = () => {
    const [streak, setStreak] = useState({ current: 0, longest: 0, lastActivityDate: '' });

    useEffect(() => {
        const saved = localStorage.getItem('profesoria_streak');
        if (saved) {
            const data = JSON.parse(saved);
            const today = new Date().toDateString();
            const lastDate = data.lastActivityDate ? new Date(data.lastActivityDate).toDateString() : '';
            const todayDate = new Date(today);
            const lastActivityDate = lastDate ? new Date(lastDate) : null;

            if (lastActivityDate) {
                const diffDays = Math.floor((todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 1) {
                    setStreak({ current: 0, longest: data.longest, lastActivityDate: '' });
                } else {
                    setStreak(data);
                }
            }
        }
    }, []);

    const recordActivity = useCallback(() => {
        const today = new Date().toDateString();
        setStreak(prev => {
            if (prev.lastActivityDate === today) return prev;

            const lastDate = prev.lastActivityDate ? new Date(prev.lastActivityDate) : null;
            const todayDate = new Date(today);
            let newCurrent = 1;

            if (lastDate) {
                const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) newCurrent = prev.current + 1;
            }

            const newStreak = {
                current: newCurrent,
                longest: Math.max(newCurrent, prev.longest),
                lastActivityDate: today
            };
            localStorage.setItem('profesoria_streak', JSON.stringify(newStreak));
            return newStreak;
        });
    }, []);

    const hasActivityToday = useCallback(() => {
        return streak.lastActivityDate === new Date().toDateString();
    }, [streak.lastActivityDate]);

    return { currentStreak: streak.current, longestStreak: streak.longest, recordActivity, hasActivityToday };
};

// Progress Hook
const useProgress = () => {
    const [progress, setProgress] = useState({ totalXP: 0, currentLevelXP: 0, level: 1 });

    useEffect(() => {
        const savedXP = localStorage.getItem('profesoria_xp');
        const savedLevel = localStorage.getItem('profesoria_level');
        if (savedXP && savedLevel) {
            const totalXP = parseInt(savedXP, 10);
            const level = parseInt(savedLevel, 10);
            let currentLevelXP = totalXP;
            for (let i = 1; i < level; i++) currentLevelXP -= Math.floor(100 * Math.pow(1.2, i - 1));
            setProgress({ totalXP, level, currentLevelXP });
        }
    }, []);

    const xpForLevel = (level: number) => Math.floor(100 * Math.pow(1.2, level - 1));

    const awardXP = useCallback((amount: number) => {
        let leveledUp = false;
        let newLevel = progress.level;

        setProgress(prev => {
            let totalXP = prev.totalXP + amount;
            let currentLevelXP = prev.currentLevelXP + amount;
            let level = prev.level;

            while (currentLevelXP >= xpForLevel(level)) {
                currentLevelXP -= xpForLevel(level);
                level++;
                leveledUp = true;
                newLevel = level;
            }

            localStorage.setItem('profesoria_xp', totalXP.toString());
            localStorage.setItem('profesoria_level', level.toString());
            return { totalXP, currentLevelXP, level };
        });

        return { leveledUp, newLevel };
    }, [progress.level]);

    const getLevelProgress = useCallback(() => {
        return Math.min((progress.currentLevelXP / xpForLevel(progress.level)) * 100, 100);
    }, [progress.level, progress.currentLevelXP]);

    return { ...progress, awardXP, getLevelProgress, xpForLevel };
};

// Audio Hook
const useAudio = () => {
    const [state, setState] = useState({
        isRecording: false, audioBlob: null as Blob | null, audioUrl: null as string | null
    });
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);
    const streamRef = React.useRef<MediaStream | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioChunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setState({ isRecording: false, audioBlob, audioUrl });
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start(100);
            setState(prev => ({ ...prev, isRecording: true }));
        } catch (error) {
            console.error('Microphone error:', error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            mediaRecorderRef.current.stop();
        }
    }, [state.isRecording]);

    const getBase64Audio = useCallback(async () => {
        if (!state.audioBlob) return null;
        return blobToBase64(state.audioBlob);
    }, [state.audioBlob]);

    const clearRecording = useCallback(() => {
        if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
        setState({ isRecording: false, audioBlob: null, audioUrl: null });
    }, [state.audioUrl]);

    return { ...state, startRecording, stopRecording, getBase64Audio, clearRecording };
};

// ============================================
// COMPONENTS
// ============================================

// Streak Counter
const StreakCounter: React.FC<{
    currentStreak: number;
    longestStreak: number;
    hasActivityToday: boolean;
}> = ({ currentStreak, longestStreak, hasActivityToday }) => (
    <div className="streak-counter">
        <div className="streak-main">
            <motion.div
                className={`streak-flame-container ${currentStreak >= 7 ? 'on-fire' : ''}`}
                animate={currentStreak >= 7 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
            >
                <Flame className={`streak-flame-icon ${hasActivityToday ? 'active' : ''}`} size={48} />
            </motion.div>
            <div className="streak-info">
                <motion.span className="streak-count" key={currentStreak}>
                    {currentStreak}
                </motion.span>
                <span className="streak-label">{currentStreak === 1 ? 'día' : 'días'} seguidos</span>
            </div>
        </div>
        {!hasActivityToday && (
            <motion.div className="streak-warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                ¡Practica hoy para mantener tu racha! 🔥
            </motion.div>
        )}
        <div className="streak-record">
            <Award size={16} />
            <span>Récord: {longestStreak} días</span>
        </div>
    </div>
);

// Progress Ring
const ProgressRing: React.FC<{
    progress: number;
    size?: number;
    color?: string;
    children?: React.ReactNode;
    label?: string;
}> = ({ progress, size = 100, color = '#22C55E', children, label }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="progress-ring-container" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle stroke="#E5E7EB" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
                <motion.circle
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ strokeDasharray: circumference, transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>
            <div className="progress-ring-content">
                {children || (
                    <div className="progress-ring-label">
                        <span className="progress-percentage">{Math.round(progress)}%</span>
                        {label && <span className="progress-text">{label}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

// Module Card
const ModuleCard: React.FC<{
    module: Module;
    index: number;
    isLocked?: boolean;
    onClick?: () => void;
    isLoading?: boolean;
}> = ({ module, index, isLocked = false, onClick, isLoading = false }) => {
    const completedLessons = module.lessons?.filter(l => l.isCompleted).length || 0;
    const totalLessons = module.lessons?.length || 10;
    const progress = module.isGenerated ? (completedLessons / totalLessons) * 100 : 0;

    const getIcon = () => {
        if (isLoading) return <Loader2 className="module-icon loading spinning" size={24} />;
        if (module.isCompleted) return <CheckCircle className="module-icon completed" size={24} />;
        if (isLocked) return <Lock className="module-icon locked" size={24} />;
        return <BookOpen className="module-icon" size={24} />;
    };

    const colors = ['#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];

    return (
        <motion.div
            className={`module-card ${isLocked ? 'locked' : ''} ${module.isCompleted ? 'completed' : ''}`}
            onClick={!isLocked && !isLoading ? onClick : undefined}
            whileHover={!isLocked ? { scale: 1.02, y: -4 } : {}}
            whileTap={!isLocked ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{ '--accent-color': colors[index % 5] } as React.CSSProperties}
        >
            <div className="module-card-header">
                <div className="module-number">{(index + 1).toString().padStart(2, '0')}</div>
                {getIcon()}
            </div>
            <div className="module-card-content">
                <h3 className="module-title">{module.title}</h3>
                {module.isGenerated && (
                    <div className="module-lessons-info">{completedLessons}/{totalLessons} lecciones</div>
                )}
            </div>
            <div className="module-card-footer">
                <div className="module-progress-bar">
                    <motion.div className="module-progress-fill" animate={{ width: `${progress}%` }} />
                </div>
                {!isLocked && <ChevronRight className="module-arrow" size={20} />}
            </div>
            {isLocked && (
                <div className="module-locked-overlay">
                    <Lock size={32} />
                    <span>Completa el módulo anterior</span>
                </div>
            )}
        </motion.div>
    );
};

// Vocabulary Cards
const VocabularyCards: React.FC<{
    vocabulary: VocabularyItem[];
    onComplete: () => void;
    voiceName?: string;
}> = ({ vocabulary, onComplete, voiceName = 'Kore' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
    const [isPlaying, setIsPlaying] = useState(false);

    const currentWord = vocabulary[currentIndex];
    const progress = ((currentIndex + 1) / vocabulary.length) * 100;

    const playPronunciation = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            const audio = await generateSpeech(currentWord.term, voiceName);
            await playRawAudio(audio);
        } catch (e) {
            console.error('TTS error:', e);
        } finally {
            setIsPlaying(false);
        }
    };

    const goToNext = () => {
        if (currentIndex < vocabulary.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        } else {
            onComplete();
        }
    };

    const handleKnow = () => {
        setKnownWords(prev => new Set(prev).add(currentWord.id));
        goToNext();
    };

    return (
        <div className="vocabulary-cards">
            <div className="vocab-progress">
                <div className="vocab-progress-bar">
                    <motion.div className="vocab-progress-fill" animate={{ width: `${progress}%` }} />
                </div>
                <span className="vocab-progress-text">{currentIndex + 1} / {vocabulary.length}</span>
            </div>

            <div className="vocab-card-container">
                <motion.div
                    className={`vocab-card ${isFlipped ? 'flipped' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                    key={currentIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="vocab-card-inner">
                        <div className="vocab-card-front">
                            <motion.button
                                className="vocab-audio-btn"
                                onClick={(e) => { e.stopPropagation(); playPronunciation(); }}
                                whileHover={{ scale: 1.1 }}
                                disabled={isPlaying}
                            >
                                <Volume2 size={24} className={isPlaying ? 'playing' : ''} />
                            </motion.button>
                            <h2 className="vocab-term">{currentWord.term}</h2>
                            <span className="vocab-hint">Toca para ver definición</span>
                        </div>
                        <div className="vocab-card-back">
                            <h3 className="vocab-definition-label">Definición:</h3>
                            <p className="vocab-definition">{currentWord.definition}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="vocab-actions">
                <motion.button className="vocab-action-btn dont-know" onClick={goToNext} whileHover={{ scale: 1.05 }}>
                    <X size={20} /> No la sé
                </motion.button>
                <motion.button className="vocab-action-btn flip" onClick={() => setIsFlipped(!isFlipped)} whileHover={{ scale: 1.05 }}>
                    <RotateCcw size={20} /> Voltear
                </motion.button>
                <motion.button className="vocab-action-btn know" onClick={handleKnow} whileHover={{ scale: 1.05 }}>
                    <CheckCircle size={20} /> ¡La sé!
                </motion.button>
            </div>

            <div className="vocab-known-counter">Palabras conocidas: {knownWords.size}/{vocabulary.length}</div>
        </div>
    );
};

// ============================================
// MAIN APP
// ============================================

type AppState = 'loading' | 'login' | 'onboarding' | 'dashboard' | 'module' | 'lesson';

const App: React.FC = () => {
    // Core state
    const [appState, setAppState] = useState<AppState>('loading');
    const [user, setUser] = useState<UserProfile | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('profesoria_theme') === 'dark');
    const [isLoadingCourse, setIsLoadingCourse] = useState(false);
    const [isLoadingModule, setIsLoadingModule] = useState(false);
    const [isLoadingLesson, setIsLoadingLesson] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTutor, setShowTutor] = useState(false);

    // Hooks
    const { currentStreak, longestStreak, recordActivity, hasActivityToday } = useStreak();
    const { totalXP, level, getLevelProgress, awardXP } = useProgress();

    // Theme effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        localStorage.setItem('profesoria_theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            const currentUsername = getCurrentUser();
            if (currentUsername) {
                const userData = await getUser(currentUsername);
                if (userData) {
                    setUser(userData);
                    const savedCourse = await getCourse(currentUsername);
                    if (savedCourse) setCourse(savedCourse);
                    setAppState('dashboard');
                } else {
                    setAppState('login');
                }
            } else {
                setAppState('login');
            }
        };
        loadUser();
    }, []);

    // Generate course
    const handleGenerateCourse = async (profile: UserProfile) => {
        setUser(profile);
        setCurrentUser(profile.username || profile.name);
        await saveUser(profile.username || profile.name, profile);

        setAppState('dashboard');
        setIsLoadingCourse(true);

        try {
            const syllabus = await generateSyllabus(profile);
            const modules: Module[] = syllabus.map((title, idx) => ({
                id: `mod-${idx}`,
                title,
                description: `Master ${title} in English`,
                isCompleted: false,
                isGenerated: false,
                lessons: []
            }));

            const newCourse: Course = {
                id: `course-${Date.now()}`,
                title: `English Journey: ${profile.currentLevel} → ${profile.targetLevel}`,
                description: `Personalized for: ${profile.interests.join(', ')}`,
                modules,
                syllabus
            };

            setCourse(newCourse);
            await saveCourse(profile.username || profile.name, newCourse);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (e: any) {
            setError(e.message || 'Error generating course');
        } finally {
            setIsLoadingCourse(false);
        }
    };

    // Login handler
    const handleLogin = async (username: string) => {
        const userData = await getUser(username);
        if (userData) {
            setUser(userData);
            setCurrentUser(username);
            const savedCourse = await getCourse(username);
            if (savedCourse) setCourse(savedCourse);
            setAppState('dashboard');
        } else {
            setAppState('onboarding');
        }
    };

    // Logout handler
    const handleLogout = () => {
        clearCurrentUser();
        setUser(null);
        setCourse(null);
        setAppState('login');
    };

    // Open module
    const handleOpenModule = async (moduleId: string) => {
        if (!course || !user) return;
        const module = course.modules.find(m => m.id === moduleId);
        if (!module) return;

        setActiveModuleId(moduleId);
        setAppState('module');

        if (!module.isGenerated) {
            setIsLoadingModule(true);
            try {
                const lessonTitles = await generateModuleLessons(module.title, user.currentLevel);
                const lessons: Lesson[] = lessonTitles.map((title, idx) => ({
                    id: `${module.id}-lesson-${idx}`,
                    title,
                    description: `Step ${idx + 1}`,
                    isCompleted: false
                }));

                const updatedCourse: Course = {
                    ...course,
                    modules: course.modules.map(m =>
                        m.id === moduleId ? { ...m, lessons, isGenerated: true } : m
                    )
                };
                setCourse(updatedCourse);
                await saveCourse(user.username || user.name, updatedCourse);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoadingModule(false);
            }
        }
    };

    // Open lesson
    const handleOpenLesson = async (lessonId: string) => {
        if (!course || !activeModuleId || !user) return;
        const module = course.modules.find(m => m.id === activeModuleId);
        if (!module) return;
        const lesson = module.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        setActiveLessonId(lessonId);
        setAppState('lesson');

        if (!lesson.content) {
            setIsLoadingLesson(true);
            try {
                const content = await generateInteractiveContent(lesson.title, user.currentLevel, module.title);
                const updatedCourse: Course = {
                    ...course,
                    modules: course.modules.map(m =>
                        m.id === activeModuleId
                            ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, content } : l) }
                            : m
                    )
                };
                setCourse(updatedCourse);
                await saveCourse(user.username || user.name, updatedCourse);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoadingLesson(false);
            }
        }
    };

    // Complete lesson
    const handleLessonComplete = async (score: number) => {
        if (!course || !activeModuleId || !activeLessonId || !user) return;

        const xpEarned = Math.floor(score * 0.5);
        const { leveledUp } = awardXP(xpEarned);
        recordActivity();

        const updatedCourse: Course = {
            ...course,
            modules: course.modules.map(m => {
                if (m.id !== activeModuleId) return m;
                const updatedLessons = m.lessons.map(l =>
                    l.id === activeLessonId ? { ...l, isCompleted: true, score } : l
                );
                const allComplete = updatedLessons.every(l => l.isCompleted);
                return { ...m, lessons: updatedLessons, isCompleted: allComplete };
            })
        };

        setCourse(updatedCourse);
        await saveCourse(user.username || user.name, updatedCourse);

        if (score >= 80) confetti({ particleCount: 50, spread: 60 });
        if (leveledUp) confetti({ particleCount: 150, spread: 100 });

        setActiveLessonId(null);
        setAppState('module');
    };

    // Active data
    const activeModule = useMemo(() => course?.modules.find(m => m.id === activeModuleId), [course, activeModuleId]);
    const activeLesson = useMemo(() => activeModule?.lessons.find(l => l.id === activeLessonId), [activeModule, activeLessonId]);

    const completedModules = course?.modules.filter(m => m.isCompleted).length || 0;
    const totalModules = course?.modules.length || 0;
    const courseProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '¡Buenos días';
        if (hour < 18) return '¡Buenas tardes';
        return '¡Buenas noches';
    };

    // ============================================
    // RENDER
    // ============================================

    if (appState === 'loading') {
        return (
            <div className="loading-screen">
                <Loader2 className="spinning" size={48} />
                <p>Cargando...</p>
            </div>
        );
    }

    if (appState === 'login') {
        return <LoginScreen onLogin={handleLogin} />;
    }

    if (appState === 'onboarding') {
        return <OnboardingScreen onComplete={handleGenerateCourse} />;
    }

    if (appState === 'module' && activeModule) {
        const completedLessons = activeModule.lessons.filter(l => l.isCompleted).length;
        return (
            <div className="module-view">
                <header className="module-header">
                    <button className="back-btn" onClick={() => { setActiveModuleId(null); setAppState('dashboard'); }}>
                        <ChevronLeft size={20} /> Volver
                    </button>
                    <div className="module-info">
                        <h1>{activeModule.title}</h1>
                        <p>{completedLessons}/{activeModule.lessons.length} lecciones completadas</p>
                    </div>
                </header>

                <div className="lessons-list">
                    {isLoadingModule ? (
                        <div className="generating">
                            <Loader2 className="spinning" size={40} />
                            <p>Generando lecciones...</p>
                        </div>
                    ) : (
                        activeModule.lessons.map((lesson, idx) => {
                            const isLocked = idx > 0 && !activeModule.lessons[idx - 1].isCompleted;
                            return (
                                <motion.div
                                    key={lesson.id}
                                    className={`lesson-item ${lesson.isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
                                    onClick={() => !isLocked && handleOpenLesson(lesson.id)}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={!isLocked ? { x: 8 } : {}}
                                >
                                    <span className="lesson-number">{idx + 1}</span>
                                    <span className="lesson-title">{lesson.title}</span>
                                    {lesson.isCompleted && <span className="lesson-score">{lesson.score}%</span>}
                                    {isLocked && <Lock size={16} className="lesson-lock" />}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    if (appState === 'lesson' && activeLesson && activeModule) {
        return (
            <LessonView
                lesson={activeLesson}
                moduleTitle={activeModule.title}
                userLevel={user?.currentLevel || 'A1'}
                isLoading={isLoadingLesson}
                onBack={() => { setActiveLessonId(null); setAppState('module'); }}
                onComplete={handleLessonComplete}
            />
        );
    }

    // Dashboard
    return (
        <div className="dashboard">
            {error && (
                <motion.div className="error-toast" initial={{ y: -50 }} animate={{ y: 0 }}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </motion.div>
            )}

            <header className="dashboard-header">
                <div className="dashboard-greeting">
                    <h1>{getGreeting()}, <span className="user-name">{user?.name}</span>! 👋</h1>
                    <p className="user-level">Nivel {user?.currentLevel} → {user?.targetLevel}</p>
                </div>
                <div className="dashboard-actions">
                    <motion.button className="action-btn" onClick={() => setIsDarkMode(!isDarkMode)} whileHover={{ scale: 1.1 }}>
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.button>
                    <motion.button className="action-btn" onClick={() => setShowTutor(true)} whileHover={{ scale: 1.1 }}>
                        <Settings size={20} />
                    </motion.button>
                    <motion.button className="action-btn logout" onClick={handleLogout} whileHover={{ scale: 1.1 }}>
                        <LogOut size={20} />
                    </motion.button>
                </div>
            </header>

            <div className="dashboard-stats">
                <motion.div className="stat-card streak" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <StreakCounter currentStreak={currentStreak} longestStreak={longestStreak} hasActivityToday={hasActivityToday()} />
                </motion.div>

                <motion.div className="stat-card level" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <ProgressRing progress={getLevelProgress()} size={100} color="#3B82F6">
                        <div className="level-badge">
                            <Zap size={20} />
                            <span>{level}</span>
                        </div>
                    </ProgressRing>
                    <div className="stat-info">
                        <span className="stat-label">Nivel</span>
                        <span className="stat-value">{totalXP} XP</span>
                    </div>
                </motion.div>

                <motion.div className="stat-card progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <ProgressRing progress={courseProgress} size={100} label="Curso" />
                    <div className="stat-info">
                        <span className="stat-label">Módulos</span>
                        <span className="stat-value">{completedModules}/{totalModules}</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card quick-practice"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setShowTutor(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="quick-practice-content">
                        <Play size={32} />
                        <span>Chat Tutor AI</span>
                    </div>
                </motion.div>
            </div>

            <section className="dashboard-modules">
                <h2><BookOpen size={20} /> Tu Curso</h2>

                {isLoadingCourse ? (
                    <div className="loading-course">
                        <Loader2 className="spinning" size={40} />
                        <p>Generando tu curso personalizado...</p>
                        <p className="loading-subtitle">Esto puede tomar unos segundos</p>
                    </div>
                ) : course ? (
                    <div className="modules-grid">
                        {course.modules.slice(0, 12).map((module, index) => (
                            <ModuleCard
                                key={module.id}
                                module={module}
                                index={index}
                                isLocked={index > 0 && !course.modules[index - 1]?.isCompleted}
                                onClick={() => handleOpenModule(module.id)}
                                isLoading={isLoadingModule && activeModuleId === module.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-course">
                        <Target size={48} />
                        <p>No hay curso disponible</p>
                        <p className="no-course-subtitle">Configura tu API Key en ajustes</p>
                    </div>
                )}

                {course && course.modules.length > 12 && (
                    <div className="modules-more">+{course.modules.length - 12} módulos más</div>
                )}
            </section>

            {showTutor && user && (
                <LiveTutorModal
                    isOpen={showTutor}
                    onClose={() => setShowTutor(false)}
                    userLevel={user.currentLevel}
                    voiceName={user.voice || 'Kore'}
                />
            )}
        </div>
    );
};

// ============================================
// SUB-SCREENS
// ============================================

const LoginScreen: React.FC<{ onLogin: (username: string) => void }> = ({ onLogin }) => {
    const [username, setUsername] = useState('');

    return (
        <div className="login-screen">
            <motion.div className="login-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <h1>🎓 Profesoria</h1>
                <h2>English Mastery</h2>
                <p>Tu camino hacia la fluidez en inglés</p>

                <form onSubmit={(e) => { e.preventDefault(); if (username.trim()) onLogin(username.trim()); }}>
                    <input
                        type="text"
                        placeholder="Tu nombre"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" disabled={!username.trim()}>Comenzar</button>
                </form>
            </motion.div>
        </div>
    );
};

const OnboardingScreen: React.FC<{ onComplete: (profile: UserProfile) => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [currentLevel, setCurrentLevel] = useState<CEFRLevel>(CEFRLevel.A1);
    const [targetLevel, setTargetLevel] = useState<CEFRLevel>(CEFRLevel.B2);
    const [interests, setInterests] = useState<string[]>([]);

    const levels = Object.values(CEFRLevel);
    const interestOptions = ['Viajes', 'Negocios', 'Tecnología', 'Música', 'Películas', 'Deportes', 'Ciencia', 'Arte', 'Cocina', 'Naturaleza'];

    const handleComplete = () => {
        onComplete({
            name,
            username: name.toLowerCase().replace(/\s+/g, '_'),
            currentLevel,
            targetLevel,
            interests: interests.length > 0 ? interests : ['General'],
            learningStyle: 'practical',
            dailyGoalMins: 15
        });
    };

    const toggleInterest = (interest: string) => {
        setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
    };

    return (
        <div className="onboarding-screen">
            <motion.div className="onboarding-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                {step === 0 && (
                    <>
                        <h2>¿Cómo te llamas?</h2>
                        <input type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                        <button onClick={() => setStep(1)} disabled={!name.trim()}>Siguiente</button>
                    </>
                )}

                {step === 1 && (
                    <>
                        <h2>¿Cuál es tu nivel actual?</h2>
                        <div className="level-grid">
                            {levels.map(lvl => (
                                <button key={lvl} className={`level-btn ${currentLevel === lvl ? 'active' : ''}`} onClick={() => setCurrentLevel(lvl)}>
                                    {lvl}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep(2)}>Siguiente</button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2>¿Qué nivel quieres alcanzar?</h2>
                        <div className="level-grid">
                            {levels.filter(l => l >= currentLevel).map(lvl => (
                                <button key={lvl} className={`level-btn ${targetLevel === lvl ? 'active' : ''}`} onClick={() => setTargetLevel(lvl)}>
                                    {lvl}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep(3)}>Siguiente</button>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h2>¿Qué te interesa?</h2>
                        <div className="interests-grid">
                            {interestOptions.map(interest => (
                                <button key={interest} className={`interest-btn ${interests.includes(interest) ? 'active' : ''}`} onClick={() => toggleInterest(interest)}>
                                    {interest}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleComplete}>¡Empezar a aprender!</button>
                    </>
                )}
            </motion.div>
        </div>
    );
};

const LessonView: React.FC<{
    lesson: Lesson;
    moduleTitle: string;
    userLevel: string;
    isLoading: boolean;
    onBack: () => void;
    onComplete: (score: number) => void;
}> = ({ lesson, moduleTitle, userLevel, isLoading, onBack, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [score, setScore] = useState(100);

    if (isLoading || !lesson.content) {
        return (
            <div className="lesson-view loading-lesson">
                <Loader2 className="spinning" size={48} />
                <p>Preparando tu lección...</p>
            </div>
        );
    }

    const content = lesson.content;
    const steps = ['Vocabulario', 'Quiz', 'Pronunciación', 'Conversación'];

    const handleStepComplete = (stepScore?: number) => {
        if (stepScore !== undefined) setScore(prev => Math.min(prev, stepScore));
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete(score);
        }
    };

    return (
        <div className="lesson-view">
            <header className="lesson-header">
                <button className="back-btn" onClick={onBack}><ChevronLeft size={20} /> Salir</button>
                <div className="lesson-progress-dots">
                    {steps.map((s, idx) => (
                        <div key={s} className={`step-dot ${idx < currentStep ? 'done' : ''} ${idx === currentStep ? 'active' : ''}`} />
                    ))}
                </div>
                <span className="lesson-step-label">{steps[currentStep]}</span>
            </header>

            <div className="lesson-content">
                {currentStep === 0 && content.vocabulary && (
                    <VocabularyCards vocabulary={content.vocabulary} onComplete={() => handleStepComplete()} />
                )}

                {currentStep === 1 && content.quiz && (
                    <Quiz questions={content.quiz} onComplete={(quizScore) => handleStepComplete(quizScore)} />
                )}

                {currentStep === 2 && (
                    <PronunciationDrill
                        targetPhrase={content.conversation?.turns?.[0]?.text || lesson.title}
                        userLevel={userLevel}
                        onComplete={(pronScore) => handleStepComplete(pronScore)}
                    />
                )}

                {currentStep === 3 && (
                    <div className="conversation-step">
                        <h2>Conversación práctica</h2>
                        {content.conversation?.turns?.map((turn, idx) => (
                            <div key={idx} className={`turn ${turn.speaker.toLowerCase()}`}>
                                <strong>{turn.speaker}:</strong>
                                <span>{turn.text}</span>
                                {turn.translation && <em>({turn.translation})</em>}
                            </div>
                        ))}
                        <button className="finish-btn" onClick={() => handleStepComplete()}>¡Terminé!</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;