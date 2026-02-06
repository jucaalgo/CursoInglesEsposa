import React, { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './src/components';
import { useGemini, useStreak, useProgress } from './src/hooks';
import { UserProfile, Course, Module, Lesson, CEFRLevel } from './types';
import { getUser, saveUser, saveCourse, getCourse, getCurrentUser, setCurrentUser, clearCurrentUser } from './services/repository';
import './src/styles/index.css';

// Import existing components that we're keeping
import PronunciationDrill from './components/PronunciationDrill';
import Quiz from './components/Quiz';
import LiveTutorModal from './components/LiveTutorModal';
import confetti from 'canvas-confetti';

type AppState = 'loading' | 'login' | 'onboarding' | 'dashboard' | 'module' | 'lesson';

const App: React.FC = () => {
    // Core state
    const [appState, setAppState] = useState<AppState>('loading');
    const [user, setUser] = useState<UserProfile | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('profesoria_theme') === 'dark';
    });
    const [showSettings, setShowSettings] = useState(false);
    const [isLoadingCourse, setIsLoadingCourse] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hooks
    const { generateCourse, generateModule, generateLesson, isLoading: isGeminiLoading } = useGemini();
    const { currentStreak, longestStreak, hasActivityToday, recordActivity } = useStreak();
    const { totalXP, level, getLevelProgress, awardXP } = useProgress();

    // Apply theme
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
                    if (savedCourse) {
                        setCourse(savedCourse);
                    }
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

    // Generate course when user completes onboarding
    const handleOnboardingComplete = async (profile: UserProfile) => {
        setUser(profile);
        setCurrentUser(profile.username || profile.name);
        await saveUser(profile.username || profile.name, profile);

        setAppState('dashboard');
        setIsLoadingCourse(true);

        try {
            const newCourse = await generateCourse(profile);
            if (newCourse) {
                setCourse(newCourse);
                await saveCourse(profile.username || profile.name, newCourse);

                // Celebration
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } catch (e: any) {
            setError(e.message || 'Error generating course');
        } finally {
            setIsLoadingCourse(false);
        }
    };

    // Handle login
    const handleLogin = async (username: string, password?: string) => {
        const userData = await getUser(username);
        if (userData) {
            setUser(userData);
            setCurrentUser(username);
            const savedCourse = await getCourse(username);
            if (savedCourse) {
                setCourse(savedCourse);
            }
            setAppState('dashboard');
        } else {
            // New user - go to onboarding
            setAppState('onboarding');
        }
    };

    // Handle logout
    const handleLogout = () => {
        clearCurrentUser();
        setUser(null);
        setCourse(null);
        setAppState('login');
    };

    // Open module
    const handleOpenModule = async (moduleId: string) => {
        if (!course) return;

        const module = course.modules.find(m => m.id === moduleId);
        if (!module) return;

        setActiveModuleId(moduleId);

        // Generate lessons if not yet generated
        if (!module.isGenerated && user) {
            const updatedModule = await generateModule(module, user.currentLevel);
            const updatedCourse: Course = {
                ...course,
                modules: course.modules.map(m =>
                    m.id === moduleId ? updatedModule : m
                )
            };
            setCourse(updatedCourse);
            await saveCourse(user.username || user.name, updatedCourse);
        }

        setAppState('module');
    };

    // Open lesson
    const handleOpenLesson = async (lessonId: string) => {
        if (!course || !activeModuleId || !user) return;

        const module = course.modules.find(m => m.id === activeModuleId);
        if (!module) return;

        const lesson = module.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        setActiveLessonId(lessonId);

        // Generate content if not yet generated
        if (!lesson.content) {
            const updatedLesson = await generateLesson(lesson, module.title, user.currentLevel);
            const updatedCourse: Course = {
                ...course,
                modules: course.modules.map(m =>
                    m.id === activeModuleId
                        ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? updatedLesson : l) }
                        : m
                )
            };
            setCourse(updatedCourse);
            await saveCourse(user.username || user.name, updatedCourse);
        }

        setAppState('lesson');
    };

    // Complete lesson
    const handleLessonComplete = async (score: number) => {
        if (!course || !activeModuleId || !activeLessonId || !user) return;

        // Award XP based on score
        const xpEarned = Math.floor(score * 0.5);
        const { leveledUp, newLevel } = awardXP(xpEarned);

        // Record activity for streak
        recordActivity();

        // Update lesson as completed
        const updatedCourse: Course = {
            ...course,
            modules: course.modules.map(m => {
                if (m.id !== activeModuleId) return m;
                return {
                    ...m,
                    lessons: m.lessons.map(l =>
                        l.id === activeLessonId
                            ? { ...l, isCompleted: true, score }
                            : l
                    )
                };
            })
        };

        // Check if module is complete
        const module = updatedCourse.modules.find(m => m.id === activeModuleId);
        if (module) {
            const allLessonsComplete = module.lessons.every(l => l.isCompleted);
            if (allLessonsComplete) {
                updatedCourse.modules = updatedCourse.modules.map(m =>
                    m.id === activeModuleId ? { ...m, isCompleted: true } : m
                );
            }
        }

        setCourse(updatedCourse);
        await saveCourse(user.username || user.name, updatedCourse);

        // Celebration
        if (score >= 80) {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        }

        if (leveledUp) {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.5 }
            });
        }

        // Go back to module view
        setActiveLessonId(null);
        setAppState('module');
    };

    // Get active module and lesson
    const activeModule = useMemo(() =>
        course?.modules.find(m => m.id === activeModuleId),
        [course, activeModuleId]
    );

    const activeLesson = useMemo(() =>
        activeModule?.lessons.find(l => l.id === activeLessonId),
        [activeModule, activeLessonId]
    );

    // Render based on state
    const renderContent = () => {
        switch (appState) {
            case 'loading':
                return (
                    <div className="loading-screen">
                        <div className="loading-spinner" />
                        <p>Cargando...</p>
                    </div>
                );

            case 'login':
                return (
                    <LoginScreen onLogin={handleLogin} />
                );

            case 'onboarding':
                return (
                    <OnboardingScreen onComplete={handleOnboardingComplete} />
                );

            case 'dashboard':
                return user ? (
                    <Dashboard
                        user={user}
                        course={course}
                        isLoadingCourse={isLoadingCourse}
                        currentStreak={currentStreak}
                        longestStreak={longestStreak}
                        hasActivityToday={hasActivityToday()}
                        totalXP={totalXP}
                        level={level}
                        levelProgress={getLevelProgress()}
                        isDarkMode={isDarkMode}
                        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                        onOpenSettings={() => setShowSettings(true)}
                        onLogout={handleLogout}
                        onOpenModule={handleOpenModule}
                    />
                ) : null;

            case 'module':
                return activeModule ? (
                    <ModuleView
                        module={activeModule}
                        onBack={() => {
                            setActiveModuleId(null);
                            setAppState('dashboard');
                        }}
                        onOpenLesson={handleOpenLesson}
                        isGenerating={isGeminiLoading}
                    />
                ) : null;

            case 'lesson':
                return activeLesson && activeModule ? (
                    <LessonView
                        lesson={activeLesson}
                        moduleTitle={activeModule.title}
                        userLevel={user?.currentLevel || 'A1'}
                        onBack={() => {
                            setActiveLessonId(null);
                            setAppState('module');
                        }}
                        onComplete={handleLessonComplete}
                        isGenerating={isGeminiLoading}
                    />
                ) : null;

            default:
                return null;
        }
    };

    return (
        <div className="app">
            {error && (
                <div className="error-toast">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}
            {renderContent()}
        </div>
    );
};

// Simple Login Screen Component
const LoginScreen: React.FC<{ onLogin: (username: string) => void }> = ({ onLogin }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username.trim());
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <h1>🎓 Profesoria</h1>
                <h2>English Mastery</h2>
                <p>Tu camino hacia la fluidez en inglés</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Tu nombre"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" disabled={!username.trim()}>
                        Comenzar
                    </button>
                </form>
            </div>
        </div>
    );
};

// Simple Onboarding Screen Component
const OnboardingScreen: React.FC<{ onComplete: (profile: UserProfile) => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [currentLevel, setCurrentLevel] = useState<CEFRLevel>(CEFRLevel.A1);
    const [targetLevel, setTargetLevel] = useState<CEFRLevel>(CEFRLevel.B2);
    const [interests, setInterests] = useState<string[]>([]);

    const levels = Object.values(CEFRLevel);
    const interestOptions = [
        'Viajes', 'Negocios', 'Tecnología', 'Música', 'Películas',
        'Deportes', 'Ciencia', 'Arte', 'Cocina', 'Naturaleza'
    ];

    const handleComplete = () => {
        const profile: UserProfile = {
            name,
            username: name.toLowerCase().replace(/\s+/g, '_'),
            currentLevel,
            targetLevel,
            interests: interests.length > 0 ? interests : ['General'],
            learningStyle: 'practical',
            dailyGoalMins: 15
        };
        onComplete(profile);
    };

    const toggleInterest = (interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    return (
        <div className="onboarding-screen">
            <div className="onboarding-card">
                {step === 0 && (
                    <>
                        <h2>¿Cómo te llamas?</h2>
                        <input
                            type="text"
                            placeholder="Tu nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                        <button onClick={() => setStep(1)} disabled={!name.trim()}>
                            Siguiente
                        </button>
                    </>
                )}

                {step === 1 && (
                    <>
                        <h2>¿Cuál es tu nivel actual?</h2>
                        <div className="level-grid">
                            {levels.map(level => (
                                <button
                                    key={level}
                                    className={`level-btn ${currentLevel === level ? 'active' : ''}`}
                                    onClick={() => setCurrentLevel(level)}
                                >
                                    {level}
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
                            {levels.filter(l => l >= currentLevel).map(level => (
                                <button
                                    key={level}
                                    className={`level-btn ${targetLevel === level ? 'active' : ''}`}
                                    onClick={() => setTargetLevel(level)}
                                >
                                    {level}
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
                                <button
                                    key={interest}
                                    className={`interest-btn ${interests.includes(interest) ? 'active' : ''}`}
                                    onClick={() => toggleInterest(interest)}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleComplete}>
                            ¡Empezar a aprender!
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// Module View Component
interface ModuleViewProps {
    module: Module;
    onBack: () => void;
    onOpenLesson: (lessonId: string) => void;
    isGenerating: boolean;
}

const ModuleView: React.FC<ModuleViewProps> = ({ module, onBack, onOpenLesson, isGenerating }) => {
    const completedLessons = module.lessons.filter(l => l.isCompleted).length;

    return (
        <div className="module-view">
            <header className="module-header">
                <button className="back-btn" onClick={onBack}>← Volver</button>
                <div className="module-info">
                    <h1>{module.title}</h1>
                    <p>{completedLessons}/{module.lessons.length} lecciones completadas</p>
                </div>
            </header>

            <div className="lessons-list">
                {isGenerating ? (
                    <div className="generating">
                        <div className="loading-spinner" />
                        <p>Generando lecciones...</p>
                    </div>
                ) : (
                    module.lessons.map((lesson, idx) => (
                        <div
                            key={lesson.id}
                            className={`lesson-item ${lesson.isCompleted ? 'completed' : ''} ${idx > 0 && !module.lessons[idx - 1].isCompleted ? 'locked' : ''}`}
                            onClick={() => {
                                const isLocked = idx > 0 && !module.lessons[idx - 1].isCompleted;
                                if (!isLocked) onOpenLesson(lesson.id);
                            }}
                        >
                            <span className="lesson-number">{idx + 1}</span>
                            <span className="lesson-title">{lesson.title}</span>
                            {lesson.isCompleted && <span className="lesson-score">{lesson.score}%</span>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Lesson View Component
interface LessonViewProps {
    lesson: Lesson;
    moduleTitle: string;
    userLevel: string;
    onBack: () => void;
    onComplete: (score: number) => void;
    isGenerating: boolean;
}

const LessonView: React.FC<LessonViewProps> = ({
    lesson,
    moduleTitle,
    userLevel,
    onBack,
    onComplete,
    isGenerating
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [score, setScore] = useState(100);

    if (isGenerating || !lesson.content) {
        return (
            <div className="lesson-view">
                <div className="generating">
                    <div className="loading-spinner" />
                    <p>Preparando tu lección...</p>
                </div>
            </div>
        );
    }

    const content = lesson.content;
    const steps = [
        { type: 'vocabulary', label: 'Vocabulario' },
        { type: 'quiz', label: 'Quiz' },
        { type: 'pronunciation', label: 'Pronunciación' },
        { type: 'conversation', label: 'Conversación' }
    ];

    const handleStepComplete = (stepScore?: number) => {
        if (stepScore !== undefined) {
            setScore(prev => Math.min(prev, stepScore));
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete(score);
        }
    };

    return (
        <div className="lesson-view">
            <header className="lesson-header">
                <button className="back-btn" onClick={onBack}>← Salir</button>
                <div className="lesson-progress">
                    {steps.map((step, idx) => (
                        <div
                            key={step.type}
                            className={`step-dot ${idx < currentStep ? 'done' : ''} ${idx === currentStep ? 'active' : ''}`}
                        />
                    ))}
                </div>
                <span className="lesson-step-label">{steps[currentStep].label}</span>
            </header>

            <div className="lesson-content">
                {/* Render step content based on currentStep */}
                {currentStep === 0 && content.vocabulary && (
                    <div className="vocab-step">
                        <h2>Vocabulario de hoy</h2>
                        <div className="vocab-list">
                            {content.vocabulary.map((item, idx) => (
                                <div key={item.id} className="vocab-item">
                                    <strong>{item.term}</strong>
                                    <span>{item.definition}</span>
                                </div>
                            ))}
                        </div>
                        <button className="next-btn" onClick={() => handleStepComplete()}>
                            Continuar
                        </button>
                    </div>
                )}

                {currentStep === 1 && content.quiz && (
                    <Quiz
                        questions={content.quiz}
                        onComplete={(quizScore) => handleStepComplete(quizScore)}
                    />
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
                        <button className="finish-btn" onClick={() => handleStepComplete()}>
                            ¡Terminé!
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
