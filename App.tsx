import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, ArrowLeft, Flame, Star, MessageCircle, LogOut, Sparkles, CheckCircle, XCircle, Book, Play, RotateCcw, Settings } from 'lucide-react';
import { LiveSession, evaluatePronunciation, generateSpeech, playRawAudio, GoogleGenAI, generateSyllabus, generateModuleLessons, generateInteractiveContent, generateLessonImage } from './services/gemini';
import { getProfile, saveProfile, updateProgress, saveSession, savePronunciation, getSyllabus, saveSyllabus, saveCourseProgress, getCourseProgress, deleteUserData } from './services/repository';
import { Profile, Session, PronunciationResult, PronunciationAnalysis, CourseProgress, WordAnalysis, VocabWord, ConversationScenario, AcademyExerciseContent, InteractiveContent } from './types';

// ============================================
// DATA & CONSTANTS
// ============================================

const SCENARIOS: ConversationScenario[] = [
    {
        id: 'tutor',
        title: 'AI Tutor',
        titleEs: '🎙️ Tutor de Voz',
        description: 'Conversación en tiempo real',
        icon: '🎙️',
        systemPrompt: `You are an English tutor. Your student's level is {level}.

CRITICAL RULES:
1. ALWAYS speak in English
2. Keep responses SHORT (1-2 sentences max)
3. Be warm, encouraging, patient  
4. If they make a mistake, correct gently: "Almost! It's 'I went' not 'I go'. Good try!"
5. Speak naturally, like a friend
6. Ask follow-up questions

Start by greeting them warmly.`
    },
    {
        id: 'restaurant',
        title: 'Restaurant',
        titleEs: '🍽️ Restaurante',
        description: 'Practica ordenar comida',
        icon: '🍽️',
        systemPrompt: 'You are a waiter at a nice restaurant. Help the customer order. Speak naturally and correct mistakes gently.'
    }
];

const PRACTICE_PHRASES = [
    { phrase: "The weather is beautiful today", translation: "El clima está hermoso hoy", level: "A1" },
    { phrase: "I would like to order a coffee, please", translation: "Me gustaría ordenar un café, por favor", level: "A2" },
    { phrase: "Could you tell me how to get to the train station?", translation: "¿Podrías decirme cómo llegar a la estación de tren?", level: "B1" },
    { phrase: "I've been working on this project for three months", translation: "He estado trabajando en este proyecto por tres meses", level: "B1" },
];

const VOCAB_WORDS: VocabWord[] = [
    { id: '1', word: 'gorgeous', phonetic: '/ˈɡɔːrdʒəs/', translation: 'muy hermoso/a', example: 'The sunset is gorgeous', level: 'B1' },
    { id: '2', word: 'schedule', phonetic: '/ˈskedʒuːl/', translation: 'horario, agenda', example: 'I need to check my schedule', level: 'A2' },
    { id: '3', word: 'achieve', phonetic: '/əˈtʃiːv/', translation: 'lograr, alcanzar', example: 'You can achieve your goals', level: 'B1' },
    { id: '4', word: 'comfortable', phonetic: '/ˈkʌmftəbl/', translation: 'cómodo/a', example: 'This chair is very comfortable', level: 'A2' },
];

// ============================================
// HOOKS
// ============================================

const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const resetRecording = useCallback(() => {
        setAudioBlob(null);
    }, []);

    return { isRecording, audioBlob, startRecording, stopRecording, resetRecording };
};

// ============================================
// COMPONENTS
// ============================================

const LoginScreen: React.FC<{ onLogin: (username: string) => void }> = ({ onLogin }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('profesoria_current_user');
        if (saved) setName(saved);
    }, []);

    return (
        <div className="login-screen">
            <div className="login-card animate-bounce-in">
                <div className="login-header">
                    <div className="logo-badge">🎓</div>
                    <h1>Profesoria</h1>
                    <p>Tu camino al dominio del inglés</p>
                </div>
                <div className="login-form">
                    <label>¿Cómo deberíamos llamarte?</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Escribe tu nombre aquí..."
                        autoFocus
                    />
                    <button
                        onClick={() => { if (name.trim()) onLogin(name.trim()); }}
                        disabled={!name.trim()}
                        className="btn-primary login-btn"
                    >
                        Entrar a mi Academia 🚀
                    </button>
                </div>
                <div className="login-footer">
                    <p>IA impulsada por Gemini 2.5 Flash</p>
                </div>
            </div>
        </div>
    );
};

const OnboardingScreen: React.FC<{
    name: string;
    onComplete: (profile: Partial<Profile>) => void;
}> = ({ name, onComplete }) => {
    const [step, setStep] = useState(0);
    const [currentLevel, setCurrentLevel] = useState('A2');
    const [targetLevel, setTargetLevel] = useState('B2');
    const [interests, setInterests] = useState<string[]>([]);

    const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const interestOptions = ['Viajes', 'Trabajo', 'Tecnología', 'Películas', 'Música', 'Deportes'];

    if (step === 0) {
        return (
            <div className="onboarding-screen">
                <div className="onboarding-card">
                    <p className="greeting">Hola, {name}! 👋</p>
                    <h2>¿Cuál es tu nivel actual?</h2>
                    <div className="level-grid">
                        {LEVELS.map(level => (
                            <button
                                key={level}
                                onClick={() => setCurrentLevel(level)}
                                className={`level-btn ${currentLevel === level ? 'active' : ''}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setStep(1)} className="btn-primary">Siguiente</button>
                </div>
            </div>
        );
    }

    if (step === 1) {
        return (
            <div className="onboarding-screen">
                <div className="onboarding-card">
                    <h2>¿A qué nivel quieres llegar?</h2>
                    <div className="level-grid">
                        {LEVELS.filter(l => LEVELS.indexOf(l) > LEVELS.indexOf(currentLevel)).map(level => (
                            <button
                                key={level}
                                onClick={() => setTargetLevel(level)}
                                className={`level-btn ${targetLevel === level ? 'active' : ''}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setStep(2)} className="btn-primary">Siguiente</button>
                </div>
            </div>
        );
    }

    return (
        <div className="onboarding-screen">
            <div className="onboarding-card">
                <h2>¿Qué te interesa?</h2>
                <div className="interest-grid">
                    {interestOptions.map(interest => (
                        <button
                            key={interest}
                            onClick={() => setInterests(prev =>
                                prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
                            )}
                            className={`interest-btn ${interests.includes(interest) ? 'active' : ''}`}
                        >
                            {interest}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onComplete({
                        name,
                        current_level: currentLevel,
                        target_level: targetLevel,
                        interests: interests.length ? interests : ['General']
                    })}
                    className="btn-primary"
                >
                    ¡Empezar! 🎉
                </button>
            </div>
        </div>
    );
};

const DashboardScreen: React.FC<{
    profile: Profile;
    onSelectScenario: (scenario: ConversationScenario | string) => void;
    onLogout: () => void;
}> = ({ profile, onSelectScenario, onLogout }) => {
    const [doneCount, setDoneCount] = useState(0);

    useEffect(() => {
        const loadProgress = async () => {
            const progress = await getCourseProgress(profile.username);
            if (progress) setDoneCount(progress.completed_lessons.length);
        };
        loadProgress();
    }, [profile.username]);

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Hola, {profile.name}! 👋</h1>
                    <p>{profile.current_level} → {profile.target_level}</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => onSelectScenario('settings')} className="icon-btn"><Settings size={20} /></button>
                    <button onClick={onLogout} className="icon-btn"><LogOut size={20} /></button>
                </div>
            </header>

            <div className="stats-row">
                <div className="stat-card flame">
                    <Flame size={24} />
                    <span className="stat-value">{profile.streak_count}</span>
                    <span className="stat-label">Días</span>
                </div>
                <div className="stat-card star">
                    <Star size={24} />
                    <span className="stat-value">{profile.xp_total}</span>
                    <span className="stat-label">XP</span>
                </div>
            </div>

            <h2 className="section-title">
                <Book size={20} />
                Mi Academia
            </h2>
            <div className="academy-preview">
                <div className="academy-card" onClick={() => onSelectScenario('academy')}>
                    <div className="academy-info">
                        <h3>Curso Estructural</h3>
                        <p>Lecciones completadas: {doneCount} / 50</p>
                    </div>
                    <span className="btn-start">Continuar →</span>
                </div>
            </div>

            <h2 className="section-title">
                <MessageCircle size={20} />
                Práctica Libre
            </h2>

            <div className="scenario-list">
                {SCENARIOS.map(scenario => (
                    <button
                        key={scenario.id}
                        onClick={() => onSelectScenario(scenario)}
                        className="scenario-card"
                    >
                        <span className="scenario-icon">{scenario.icon}</span>
                        <div className="scenario-info">
                            <h3>{scenario.titleEs}</h3>
                            <p>{scenario.description}</p>
                        </div>
                        <span className="arrow">→</span>
                    </button>
                ))}

                <button onClick={() => onSelectScenario('vocab')} className="scenario-card">
                    <span className="scenario-icon">📚</span>
                    <div className="scenario-info">
                        <h3>Vocabulario Diario</h3>
                        <p>Aprende palabras nuevas</p>
                    </div>
                    <span className="arrow">→</span>
                </button>

                <button onClick={() => onSelectScenario('pronunciation')} className="scenario-card">
                    <span className="scenario-icon">🔊</span>
                    <div className="scenario-info">
                        <h3>Pronunciación Lab</h3>
                        <p>Practica sonidos difíciles</p>
                    </div>
                    <span className="arrow">→</span>
                </button>
            </div>
        </div>
    );
};

const LiveCallScreen: React.FC<{
    scenario: ConversationScenario;
    profile: Profile;
    onBack: () => void;
    onAddXp: (amount: number) => void;
    context?: string; // NEW: Context injection
}> = ({ scenario, profile, onBack, onAddXp, context }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTutorText, setCurrentTutorText] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const liveSessionRef = useRef<LiveSession | null>(null);
    const timerRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);

    const handleMessage = useCallback((text: string | null, isInterrupted: boolean) => {
        if (isInterrupted) {
            setCurrentTutorText('');
            return;
        }
        if (text) {
            setCurrentTutorText(prev => prev + text);
        }
    }, []);

    const startCall = async () => {
        setIsConnecting(true);
        try {
            let basePrompt = scenario.systemPrompt.replace('{level}', profile.current_level);

            // INJECT CONTEXT
            if (context) {
                basePrompt += `\n\nCURRENT LESSON CONTEXT: You are teaching the student about "${context}". 
                Focus the conversation 100% on this topic. Ask questions related to ${context}.`;
            }

            const session = new LiveSession(handleMessage);
            await session.connect(basePrompt, 'Kore');
            liveSessionRef.current = session;
            setIsConnected(true);
            startTimeRef.current = Date.now();

            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);

            onAddXp(10);
        } catch (error) {
            console.error('Failed to connect:', error);
            alert('Error conectando. Verifica tu API Key.');
        } finally {
            setIsConnecting(false);
        }
    };

    const endCall = async () => {
        if (liveSessionRef.current) {
            await liveSessionRef.current.disconnect();
            liveSessionRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const xpEarned = Math.max(5, Math.floor(duration / 10));

        await saveSession({
            username: profile.username,
            session_type: 'call',
            scenario: scenario.id,
            duration_seconds: duration,
            xp_earned: xpEarned,
            details: { duration }
        });

        await updateProgress(profile.username, xpEarned);
        setIsConnected(false);
    };

    useEffect(() => {
        return () => {
            if (liveSessionRef.current) {
                liveSessionRef.current.disconnect();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="call-screen">
            <header className="call-header">
                <button onClick={() => { endCall(); onBack(); }} className="icon-btn">
                    <ArrowLeft size={24} />
                </button>
                <h1>{scenario.titleEs}</h1>
                {isConnected && <span className="call-timer">{formatTime(callDuration)}</span>}
            </header>

            <div className="call-body">
                {!isConnected ? (
                    <div className="call-start">
                        <div className="avatar-large">🎓</div>
                        <h2>Emma</h2>
                        <p>Tu tutora de inglés</p>
                        <p className="hint">Presiona para iniciar una conversación en tiempo real</p>
                        <button
                            onClick={startCall}
                            disabled={isConnecting}
                            className="call-btn start"
                        >
                            {isConnecting ? (
                                <span className="loading-dots">Conectando...</span>
                            ) : (
                                <>
                                    <Phone size={32} />
                                    <span>Llamar</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="call-active">
                        <div className="tutor-speaking">
                            <div className="avatar-speaking">
                                <span>🎓</span>
                                <div className="sound-waves">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                            <h2>Emma está escuchando...</h2>
                            {currentTutorText && (
                                <p className="live-transcript">{currentTutorText}</p>
                            )}
                        </div>

                        <div className="call-controls">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`control-btn ${isMuted ? 'muted' : ''}`}
                            >
                                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>
                            <button onClick={endCall} className="call-btn end">
                                <PhoneOff size={32} />
                            </button>
                            <button className="control-btn">
                                <Volume2 size={24} />
                            </button>
                        </div>

                        <p className="call-hint">🎤 Habla en inglés - Emma te escucha y responde</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const VocabScreen: React.FC<{
    profile: Profile;
    onBack: () => void;
    onAddXp: (amount: number) => void;
}> = ({ profile, onBack, onAddXp }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentWord = VOCAB_WORDS[currentIndex] || VOCAB_WORDS[0];

    if (!currentWord) return <div>No hay palabras disponibles</div>;

    const playWord = async () => {
        setIsPlaying(true);
        try {
            const audio = await generateSpeech(currentWord.word, 'Kore');
            await playRawAudio(audio);
        } catch (error) {
            console.error('TTS error:', error);
        } finally {
            setIsPlaying(false);
        }
    };

    const nextWord = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setIsFlipped(false);

        setTimeout(() => {
            if (currentIndex === VOCAB_WORDS.length - 1) {
                setCurrentIndex(0);
            } else {
                setCurrentIndex(currentIndex + 1);
            }
            onAddXp(5);
            setIsTransitioning(false);
        }, 100);
    };

    return (
        <div className="vocab-screen">
            <header className="screen-header">
                <button onClick={onBack} className="icon-btn"><ArrowLeft size={24} /></button>
                <h1>📚 Vocabulario</h1>
            </header>

            <div className="vocab-body">
                <div className={`vocab-card ${isFlipped ? 'flipped' : ''}`}>
                    {!isFlipped ? (
                        <div className="card-front">
                            <p className="level-badge">{currentWord.level}</p>
                            <h2 className="word">{currentWord.word}</h2>
                            <p className="phonetic">{currentWord.phonetic}</p>
                            <button onClick={playWord} disabled={isPlaying} className="listen-btn">
                                {isPlaying ? '🔊 Reproduciendo...' : '🔊 Escuchar'}
                            </button>
                        </div>
                    ) : (
                        <div className="card-back">
                            <h3 className="translation">{currentWord.translation}</h3>
                            <p className="example">"{currentWord.example}"</p>
                            <button onClick={playWord} disabled={isPlaying} className="listen-btn">
                                {isPlaying ? '🔊 Reproduciendo...' : '🔊 Escuchar ejemplo'}
                            </button>
                        </div>
                    )}
                </div>

                <button onClick={() => setIsFlipped(!isFlipped)} className="flip-btn">
                    {isFlipped ? 'Ver palabra →' : '← Ver traducción'}
                </button>

                <div className="vocab-actions">
                    <button onClick={nextWord} className="btn-primary">
                        Ya la sé ✓
                    </button>
                </div>

                <p className="vocab-progress">
                    Progreso: {currentIndex + 1} / {VOCAB_WORDS.length}
                </p>
            </div>
        </div>
    );
};

const PronunciationScreen: React.FC<{
    profile: Profile;
    onBack: () => void;
    onAddXp: (amount: number) => void;
}> = ({ profile, onBack, onAddXp }) => {
    const [currentPhrase, setCurrentPhrase] = useState(PRACTICE_PHRASES[0]);
    const [result, setResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();

    const playExample = async () => {
        setIsPlaying(true);
        try {
            const audio = await generateSpeech(currentPhrase.phrase, 'Kore');
            await playRawAudio(audio);
        } catch (error) {
            console.error('TTS error:', error);
        } finally {
            setIsPlaying(false);
        }
    };

    const analyzeRecording = async () => {
        if (!audioBlob) return;

        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];

                const analysis = await evaluatePronunciation(
                    currentPhrase.phrase,
                    base64,
                    profile.current_level
                );

                setResult(analysis);
                onAddXp(Math.floor(analysis.score / 10));

                await savePronunciation({
                    username: profile.username,
                    phrase: currentPhrase.phrase,
                    score: analysis.score,
                    word_analysis: analysis.words,
                    feedback: analysis.feedback
                });

                await updateProgress(profile.username, Math.floor(analysis.score / 10));
            };
        } catch (error) {
            console.error('Analysis error:', error);
            setResult({ score: 0, feedback: 'Error al analizar. Intenta de nuevo.', words: [] });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const nextPhrase = () => {
        const currentIndex = PRACTICE_PHRASES.indexOf(currentPhrase);
        const nextIndex = (currentIndex + 1) % PRACTICE_PHRASES.length;
        setCurrentPhrase(PRACTICE_PHRASES[nextIndex]);
        setResult(null);
        resetRecording();
    };

    useEffect(() => {
        if (audioBlob && !isRecording) {
            analyzeRecording();
        }
    }, [audioBlob, isRecording]);

    return (
        <div className="pronunciation-screen">
            <header className="screen-header">
                <button onClick={onBack} className="icon-btn"><ArrowLeft size={24} /></button>
                <h1>🔊 Pronunciación</h1>
            </header>

            <div className="pronunciation-body">
                <div className="phrase-card">
                    <p className="level-badge">{currentPhrase.level}</p>
                    <h2 className="target-phrase">{currentPhrase.phrase}</h2>
                    <p className="translation">{currentPhrase.translation}</p>

                    <button
                        onClick={playExample}
                        disabled={isPlaying}
                        className="listen-btn"
                    >
                        {isPlaying ? '🔊 Reproduciendo...' : '🔊 Escuchar ejemplo'}
                    </button>
                </div>

                {!result ? (
                    <div className="record-section">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isAnalyzing}
                            className={`record-btn ${isRecording ? 'recording' : ''}`}
                        >
                            {isAnalyzing ? (
                                <span>Analizando...</span>
                            ) : isRecording ? (
                                <>
                                    <MicOff size={32} />
                                    <span>Detener</span>
                                </>
                            ) : (
                                <>
                                    <Mic size={32} />
                                    <span>Grabar</span>
                                </>
                            )}
                        </button>
                        {isRecording && <p className="recording-hint">🎤 Habla ahora...</p>}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className={`score-circle ${result.score >= 80 ? 'great' : result.score >= 60 ? 'good' : 'needs-work'}`}>
                            <span className="score-value">{result.score}</span>
                            <span className="score-label">/ 100</span>
                        </div>

                        <p className="feedback">{result.feedback}</p>

                        {result.words && result.words.length > 0 && (
                            <div className="word-analysis">
                                <h3>Análisis por palabra:</h3>
                                <div className="word-list">
                                    {result.words.map((word: WordAnalysis, i: number) => (
                                        <span
                                            key={i}
                                            className={`word ${word.isCorrect ? 'correct' : 'incorrect'}`}
                                        >
                                            {word.isCorrect ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {word.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="result-actions">
                            <button onClick={() => { setResult(null); resetRecording(); }} className="btn-secondary">
                                Intentar de nuevo
                            </button>
                            <button onClick={nextPhrase} className="btn-primary">
                                Siguiente frase →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// MAIN APP
// ============================================
const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [selectedScenario, setSelectedScenario] = useState<ConversationScenario | null>(null);
    const [appState, setAppState] = useState<'loading' | 'login' | 'onboarding' | 'dashboard' | 'call' | 'vocab' | 'pronunciation' | 'settings' | 'academy'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    // Auto-clear error after 5s
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        const loadUser = async () => {
            const storedUsername = localStorage.getItem('profesoria_current_user');
            if (storedUsername) {
                const userProfile = await getProfile(storedUsername);
                if (userProfile) {
                    setCurrentUser(storedUsername);
                    setProfile(userProfile);
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

    const handleLogin = async (username: string) => {
        setCurrentUser(username);
        localStorage.setItem('profesoria_current_user', username);

        const existingProfile = await getProfile(username);
        if (existingProfile) {
            setProfile(existingProfile);
            setAppState('dashboard');
        } else {
            setAppState('onboarding');
        }
    };

    const handleOnboardingComplete = async (newProfileData: Partial<Profile>) => {
        const fullProfile: Profile = {
            username: currentUser!,
            name: newProfileData.name || currentUser!,
            current_level: newProfileData.current_level || 'A2',
            target_level: newProfileData.target_level || 'B2',
            interests: newProfileData.interests || [],
            xp_total: 0,
            streak_count: 0
        };

        await saveProfile(currentUser!, fullProfile);
        setProfile(fullProfile);
        setAppState('dashboard');
    };

    const handleSelectScenario = (scenario: ConversationScenario | string) => {
        if (typeof scenario === 'string') {
            setAppState(scenario as any);
        } else {
            setSelectedScenario(scenario);
            setAppState('call');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setProfile(null);
        localStorage.removeItem('profesoria_current_user');
        setAppState('login');
    };

    const addXp = async (amount: number) => {
        if (currentUser && profile) {
            // Update local state first for instant feedback (Optimistic Update)
            const updatedProfile = { ...profile, xp_total: profile.xp_total + amount };
            setProfile(updatedProfile);

            // Then persist
            await updateProgress(currentUser, amount).catch(console.error);
        }
    };

    const SettingsScreen = () => {
        const [apiKey, setApiKey] = useState(localStorage.getItem('profesoria_api_key') || '');
        const [saved, setSaved] = useState(false);

        const handleSave = () => {
            localStorage.setItem('profesoria_api_key', apiKey);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        };

        const handleResetProgress = async () => {
            if (confirm("🚨 ¿BORRAR TODO DEFINITIVAMENTE? \n\nEsta acción es irreversible. Se eliminará tu usuario, progreso y lecciones de la base de datos y de este dispositivo.")) {
                if (currentUser) {
                    await deleteUserData(currentUser);
                    // Force reload
                    window.location.reload();
                }
            }
        };

        return (
            <div className="settings-screen">
                <header className="screen-header">
                    <button onClick={() => setAppState('dashboard')} className="icon-btn"><ArrowLeft size={24} /></button>
                    <h1>Configuración</h1>
                </header>
                <div className="settings-body">
                    <div className="settings-card">
                        <h3>Google Gemini API Key</h3>
                        <p className="hint">Para que el tutor de voz y la pronunciación funcionen, necesitas una API Key.</p>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Introduce tu API Key aquí..."
                            className="api-input"
                        />
                        <button onClick={handleSave} className="btn-primary">
                            {saved ? '¡Guardado! ✓' : 'Guardar Configuración'}
                        </button>
                    </div>

                    <div className="settings-card danger-zone">
                        <h3>Zona de Peligro</h3>
                        <p className="hint">Acciones destructivas.</p>
                        <button onClick={handleResetProgress} className="btn-secondary btn-danger">
                            🗑️ BORRAR MI CUENTA Y PROGRESO
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="app-container">
            {error && (
                <div className="error-toast animate-bounce-in">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {appState === 'loading' && <div className="loading-screen"><span>🎓</span><p>Cargando...</p></div>}
            {appState === 'login' && <LoginScreen onLogin={handleLogin} />}
            {appState === 'onboarding' && <OnboardingScreen name={currentUser!} onComplete={handleOnboardingComplete} />}
            {appState === 'dashboard' && <DashboardScreen profile={profile!} onSelectScenario={handleSelectScenario} onLogout={handleLogout} />}
            {/* CONTEXT INJECTION FIX */}
            {appState === 'call' && <LiveCallScreen scenario={selectedScenario!} profile={profile!} onBack={() => setAppState('dashboard')} onAddXp={addXp} context={typeof selectedScenario === 'string' ? selectedScenario : undefined} />}
            {appState === 'vocab' && <VocabScreen profile={profile!} onBack={() => setAppState('dashboard')} onAddXp={addXp} />}
            {appState === 'pronunciation' && <PronunciationScreen profile={profile!} onBack={() => setAppState('dashboard')} onAddXp={addXp} />}
            {appState === 'settings' && <SettingsScreen />}
            {appState === 'academy' && <AcademyScreen profile={profile!} onBack={() => setAppState('dashboard')} onAddXp={addXp} onError={setError} />}

            {/* GLOBAL HELP MODAL */}
            {showHelp && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowHelp(false)}>
                    <div className="modal-content help-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎓 Guía Rápida</h2>
                            <button onClick={() => setShowHelp(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="help-item">
                                <span className="help-icon">🗣️</span>
                                <div>
                                    <h4>Tutor de Voz</h4>
                                    <p>Habla naturalmente. El tutor te corregirá la pronunciación y gramática en tiempo real.</p>
                                </div>
                            </div>
                            <div className="help-item">
                                <span className="help-icon">📚</span>
                                <div>
                                    <h4>Academia</h4>
                                    <p>Sigue el camino de lecciones paso a paso. No puedes saltar niveles sin completar los anteriores.</p>
                                </div>
                            </div>
                            <div className="help-item">
                                <span className="help-icon">💾</span>
                                <div>
                                    <h4>Progreso</h4>
                                    <p>Tu avance se guarda automáticamente al finalizar cada lección o sesión de práctica.</p>
                                </div>
                            </div>
                            <div className="help-item">
                                <span className="help-icon">🤖</span>
                                <div>
                                    <h4>Inteligencia Artificial</h4>
                                    <p>Las lecciones son generadas al momento por AI para adaptarse a tu nivel exacto.</p>
                                </div>
                            </div>
                        </div>
                        <button className="btn-primary w-full" onClick={() => setShowHelp(false)}>¡Entendido!</button>
                    </div>
                </div>
            )}

            {/* FLOATING HELP BUTTON */}
            {appState !== 'login' && appState !== 'onboarding' && (
                <button className="floating-help-btn" onClick={() => setShowHelp(true)}>?</button>
            )}
        </div>
    );
};

const AcademyScreen: React.FC<{
    profile: Profile;
    onBack: () => void;
    onAddXp: (amount: number) => void;
    onError: (msg: string) => void;
}> = ({ profile, onBack, onAddXp, onError }) => {
    const [syllabus, setSyllabus] = useState<string[]>([]);
    const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
    const [lessonContent, setLessonContent] = useState<AcademyExerciseContent | null>(null);
    const [lessonStep, setLessonStep] = useState<'loading' | 'intro' | 'vocab' | 'quiz' | 'fill' | 'scramble' | 'speaking' | 'done'>('loading');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [speakingTurnIndex, setSpeakingTurnIndex] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [voiceResult, setVoiceResult] = useState<PronunciationAnalysis | null>(null);

    const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();

    const [completedLessons, setCompletedLessons] = useState<string[]>([]);

    // Scramble Game State
    const [scramblePool, setScramblePool] = useState<string[]>([]);
    const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);

    useEffect(() => {
        if (lessonStep === 'scramble' && lessonContent?.scramble?.scrambledParts) {
            setScramblePool(lessonContent.scramble.scrambledParts);
            setScrambleAnswer([]);
        }
    }, [lessonStep, lessonContent]);

    useEffect(() => {
        const loadSyllabus = async () => {
            const stored = await getSyllabus(profile.username);
            if (stored && stored.length > 0) {
                setSyllabus(stored);
            } else {
                // Auto-generate if empty and not already loading
                handleGenerateSyllabus();
            }

            const progress = await getCourseProgress(profile.username);
            if (progress) setCompletedLessons(progress.completed_lessons);
        };
        loadSyllabus();
    }, [profile.username]);

    const handleGenerateSyllabus = async () => {
        setIsLoadingSyllabus(true);
        try {
            const newSyllabus = await generateSyllabus({
                currentLevel: profile.current_level,
                targetLevel: profile.target_level,
                interests: profile.interests
            } as any);
            setSyllabus(newSyllabus);
            await saveSyllabus(profile.username, newSyllabus);
        } catch (e) {
            console.error("Gemini Syllabus Gen Failed, using fallback:", e);
            // FALLBACK SYLLABUS: Critical for user experience when AI fails
            const fallbackSyllabus = [
                "Unit 1: Introductions & Personal Info",
                "Unit 2: Daily Routines & Habits",
                "Unit 3: Ordering Food & Restaurants",
                "Unit 4: Travel & Directions",
                "Unit 5: Family & Relationships",
                "Unit 6: Shopping & Money",
                "Unit 7: Health & Body",
                "Unit 8: Work & Professions",
                "Unit 9: Hobbies & Free Time",
                "Unit 10: Future Plans & Goals"
            ];
            setSyllabus(fallbackSyllabus);
            await saveSyllabus(profile.username, fallbackSyllabus);
            onError("La IA tardó demasiado, pero hemos cargado un plan de estudio básico por ahora.");
        } finally {
            setIsLoadingSyllabus(false);
        }
    };

    const startLesson = async (title: string, index: number) => {
        // LOCKING LOGIC (Redundant check for güvenlik)
        if (index > completedLessons.length) {
            alert("🔒 ¡Completa las lecciones anteriores primero!");
            return;
        }

        setSelectedLesson(title);
        setLessonStep('loading');
        setCurrentStepIndex(0);
        setSpeakingTurnIndex(0);
        try {
            const content = await generateInteractiveContent(title, profile.current_level, "English Course");
            setLessonContent(content);
            setLessonStep('intro');
        } catch (e) {
            console.error(e);
            onError("Error cargando lección. Reintenta.");
            setSelectedLesson(null);
        }
    };

    const handleAnalyzeVoice = async () => {
        if (!audioBlob || isAnalyzing) return;
        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const targetText = lessonContent!.conversation.turns[speakingTurnIndex].text;
                const analysis = await evaluatePronunciation(targetText, base64Audio, profile.current_level);
                setVoiceResult(analysis);
                setIsAnalyzing(false);
            };
        } catch (e) {
            console.error(e);
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (audioBlob && !isRecording && lessonStep === 'speaking') {
            handleAnalyzeVoice();
        }
    }, [audioBlob, isRecording]);

    if (selectedLesson) {
        if (!lessonContent) {
            return (
                <div className="academy-lesson-view">
                    <header className="screen-header">
                        <button onClick={() => setSelectedLesson(null)} className="icon-btn"><ArrowLeft size={24} /></button>
                        <h1>Cargando Lección...</h1>
                    </header>
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Generando material estructural para {selectedLesson}...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="academy-lesson-view animate-fade-in">
                <header className="screen-header">
                    <button onClick={() => setSelectedLesson(null)} className="icon-btn"><ArrowLeft size={24} /></button>
                    <h1>{selectedLesson}</h1>
                </header>

                <div className="lesson-container">
                    {lessonStep === 'loading' && <div className="loading-state">✨ Generando ejercicios mágicos...</div>}

                    {lessonStep === 'intro' && (
                        <div className="lesson-intro animate-fade-in">
                            <div className="scenario-card-premium">
                                <h3><Book size={20} /> Contexto de Hoy</h3>
                                <p>{lessonContent.scenario.description}</p>
                                <div className="dialogue-box">
                                    <div className="dialogue-text">{lessonContent.scenario.dialogueScript}</div>
                                </div>
                            </div>
                            <button className="btn-primary" onClick={() => setLessonStep('vocab')}>Continuar al Vocabulario →</button>
                        </div>
                    )}

                    {lessonStep === 'vocab' && (
                        <div className="lesson-step animate-fade-in">
                            <div className="step-header">
                                <h2>Vocabulario Clave</h2>
                                <p>Aprende estos términos del contexto</p>
                            </div>
                            <div className="vocab-grid-academy">
                                {lessonContent.vocabulary && lessonContent.vocabulary.length > 0 ? (
                                    lessonContent.vocabulary.map((v, i) => (
                                        <div key={i} className="vocab-item-mini">
                                            <h4>{v.term}</h4>
                                            <p>{v.definition}</p>
                                        </div>
                                    ))
                                ) : <p>No hay vocabulario disponible para esta lección.</p>}
                            </div>
                            <button className="btn-primary" onClick={() => setLessonStep('quiz')}>
                                {lessonContent.vocabulary?.length ? '¡Lo tengo! Siguiente →' : 'Omitir Sección →'}
                            </button>
                        </div>
                    )}

                    {lessonStep === 'quiz' && (
                        <div className="lesson-step animate-fade-in">
                            {lessonContent.quiz && lessonContent.quiz.length > 0 && lessonContent.quiz[currentStepIndex] ? (
                                <>
                                    <div className="step-header">
                                        <h2>Pon a prueba tu lectura</h2>
                                        <p>Pregunta {currentStepIndex + 1} de {lessonContent.quiz.length}</p>
                                    </div>
                                    <div className="quiz-card-academy">
                                        <h3>{lessonContent.quiz[currentStepIndex].question}</h3>
                                        <div className="options-grid">
                                            {lessonContent.quiz[currentStepIndex].options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    className="option-btn"
                                                    onClick={() => {
                                                        if (i === lessonContent.quiz[currentStepIndex].correctIndex) {
                                                            if (currentStepIndex < lessonContent.quiz.length - 1) {
                                                                setCurrentStepIndex(currentStepIndex + 1);
                                                            } else {
                                                                setCurrentStepIndex(0);
                                                                setLessonStep('fill');
                                                            }
                                                        } else {
                                                            alert("¡Casi! Intenta de nuevo.");
                                                        }
                                                    }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="error-state">
                                    <p>No hay preguntas disponibles.</p>
                                    <button className="btn-primary" onClick={() => setLessonStep('fill')}>Saltar Quiz →</button>
                                </div>
                            )}
                        </div>
                    )}

                    {lessonStep === 'fill' && (
                        <div className="lesson-step animate-fade-in">
                            {lessonContent.fillInBlanks && lessonContent.fillInBlanks.length > 0 && lessonContent.fillInBlanks[currentStepIndex] ? (
                                <>
                                    <div className="step-header">
                                        <h2>Completa la oración</h2>
                                    </div>
                                    <div className="fill-card-academy">
                                        <p className="sentence-display">
                                            {lessonContent.fillInBlanks[currentStepIndex].sentence.replace(lessonContent.fillInBlanks[currentStepIndex].correctWord, '_______')}
                                        </p>
                                        <div className="options-grid">
                                            {lessonContent.fillInBlanks[currentStepIndex].options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    className="option-btn"
                                                    onClick={() => {
                                                        if (opt === lessonContent.fillInBlanks[currentStepIndex].correctWord) {
                                                            if (currentStepIndex < lessonContent.fillInBlanks.length - 1) {
                                                                setCurrentStepIndex(currentStepIndex + 1);
                                                            } else {
                                                                setCurrentStepIndex(0);
                                                                setLessonStep('scramble');
                                                            }
                                                        } else {
                                                            alert("Incorrecto.");
                                                        }
                                                    }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="error-state">
                                    <p>No hay preguntas de completar disponibles.</p>
                                    <button className="btn-primary" onClick={() => setLessonStep('scramble')}>Saltar Sección →</button>
                                </div>
                            )}
                        </div>
                    )}

                    {lessonStep === 'scramble' && (
                        <div className="lesson-step animate-fade-in">
                            {lessonContent.scramble && lessonContent.scramble.scrambledParts ? (
                                <>
                                    <div className="step-header">
                                        <h2>Ordena la oración</h2>
                                    </div>
                                    <div className="scramble-card-academy">
                                        <p className="translation-hint">{lessonContent.scramble.translation}</p>

                                        {/* Area de respuesta donde van cayendo las palabras */}
                                        <div className="scramble-answer-area">
                                            {scrambleAnswer.length > 0 ? (
                                                scrambleAnswer.map((word, i) => (
                                                    <button key={`ans-${i}`} className="word-chip" onClick={() => {
                                                        // Devolver palabra al pool
                                                        setScrambleAnswer(prev => prev.filter((_, idx) => idx !== i));
                                                        setScramblePool(prev => [...prev, word]);
                                                    }}>
                                                        {word}
                                                    </button>
                                                ))
                                            ) : (
                                                <span className="placeholder-text">Toca las palabras abajo...</span>
                                            )}
                                        </div>

                                        {/* Pool de palabras desordenadas */}
                                        <div className="scramble-pool">
                                            {scramblePool.map((word, i) => (
                                                <button key={`pool-${i}`} className="word-chip pool" onClick={() => {
                                                    // Mover a respuesta
                                                    setScramblePool(prev => prev.filter((_, idx) => idx !== i));
                                                    setScrambleAnswer(prev => [...prev, word]);
                                                }}>
                                                    {word}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="scramble-actions">
                                            <button className="btn-secondary" onClick={() => {
                                                // Reset
                                                setScramblePool(lessonContent.scramble?.scrambledParts || []);
                                                setScrambleAnswer([]);
                                            }}>Reset ↺</button>

                                            <button className="btn-primary" onClick={() => {
                                                // Validar
                                                const userAnswer = scrambleAnswer.join(' ').trim();
                                                // Normalizar para comparación (ignorar mayúsculas/puntuación simple si es estricto, pero aquí simple)
                                                const correct = lessonContent.scramble?.correctSentence || "";

                                                if (userAnswer.toLowerCase() === correct.toLowerCase()) {
                                                    alert("¡Correcto! 🎉");
                                                    setLessonStep('speaking');
                                                } else {
                                                    alert(`Casi... Intenta de nuevo.\nTu respuesta: ${userAnswer}`);
                                                }
                                            }}>Comprobar ✅</button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="error-state">
                                    <p>No hay ejercicio de ordenar disponible.</p>
                                    <button className="btn-primary" onClick={() => setLessonStep('speaking')}>Saltar Sección →</button>
                                </div>
                            )}
                        </div>
                    )}

                    {lessonStep === 'speaking' && lessonContent.conversation && (
                        <div className="lesson-step animate-fade-in">
                            <div className="step-header">
                                <h2>Práctica de Conversación</h2>
                                <p>{lessonContent.conversation.goal}</p>
                            </div>
                            <div className="conversation-practice">
                                <div className="chat-preview">
                                    {lessonContent.conversation.turns.map((turn, i) => (
                                        <div key={i} className={`chat-bubble ${turn.speaker === 'Tutor' ? 'tutor' : 'student'} ${i === speakingTurnIndex ? 'active' : i > speakingTurnIndex ? 'hidden' : ''}`}>
                                            <p>{turn.text}</p>
                                            {i <= speakingTurnIndex && <p className="bubble-translation">{turn.translation}</p>}
                                        </div>
                                    ))}
                                </div>

                                {speakingTurnIndex < lessonContent.conversation.turns.length ? (
                                    <div className="speaking-controls text-center">
                                        {lessonContent.conversation.turns[speakingTurnIndex].speaker === 'Tutor' ? (
                                            <button className="btn-primary" onClick={() => {
                                                setSpeakingTurnIndex(speakingTurnIndex + 1);
                                                setVoiceResult(null);
                                                resetRecording();
                                            }}>
                                                Escuchar Siguiente →
                                            </button>
                                        ) : (
                                            <div className="voice-input-area">
                                                {!voiceResult ? (
                                                    <>
                                                        <p className="instruction">Di en voz alta: <strong>{lessonContent.conversation.turns[speakingTurnIndex].text}</strong></p>
                                                        <button
                                                            className={`btn-record ${isRecording ? 'pulse' : ''}`}
                                                            onClick={isRecording ? stopRecording : startRecording}
                                                            disabled={isAnalyzing}
                                                        >
                                                            {isAnalyzing ? '⏳ Analizando...' : isRecording ? '🛑 Detener' : '🎤 Pulsar para hablar'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="voice-feedback animate-bounce-in">
                                                        <div className={`analysis-score ${voiceResult.score >= 85 ? 'great' : voiceResult.score >= 65 ? 'good' : 'needs-work'}`}>
                                                            {voiceResult.score} <span className="small">/100</span>
                                                        </div>
                                                        <p className="feedback-text">"{voiceResult.feedback}"</p>

                                                        {voiceResult.improvementTips && voiceResult.improvementTips.length > 0 && (
                                                            <div className="improvement-tips">
                                                                <p className="tips-title">💡 Consejos de mejora:</p>
                                                                <ul>
                                                                    {voiceResult.improvementTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        <div className="feedback-actions">
                                                            <button className="btn-secondary" onClick={() => { setVoiceResult(null); resetRecording(); }}>Reintentar 🔄</button>
                                                            <button className="btn-primary" onClick={() => {
                                                                setSpeakingTurnIndex(speakingTurnIndex + 1);
                                                                setVoiceResult(null);
                                                                resetRecording();
                                                                onAddXp(15);

                                                                // AUTO-SAVE PROGRESS ON STEP COMPLETION
                                                                if (selectedLesson && !completedLessons.includes(selectedLesson)) {
                                                                    // Mark as partial/complete in background if needed
                                                                    // For now, we rely on the final 'Done' step, but let's ensure we save here too if it's the last turn
                                                                }
                                                            }}>Buen trabajo, ¡siguiente! →</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button className="btn-primary w-full" onClick={async () => {
                                        // FINAL SAVE ON SPEAKING DONE
                                        const updatedCompleted = [...completedLessons];
                                        if (selectedLesson && !updatedCompleted.includes(selectedLesson)) {
                                            updatedCompleted.push(selectedLesson);
                                            setCompletedLessons(updatedCompleted);

                                            await saveCourseProgress({
                                                username: profile.username,
                                                syllabus,
                                                completed_lessons: updatedCompleted,
                                                current_module_index: updatedCompleted.length
                                            });
                                        }
                                        setLessonStep('done');
                                    }}>
                                        Finalizar Lección 🏁
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {lessonStep === 'done' && (
                        <div className="lesson-complete text-center animate-bounce-in">
                            <Sparkles size={64} className="icon-gold mx-auto" />
                            <h2>¡Increíble progreso!</h2>
                            <p>Has dominado: {selectedLesson}</p>
                            <div className="xp-badge-large">+50 XP</div>
                            <button className="btn-primary" onClick={async () => {
                                const updatedCompleted = [...completedLessons, selectedLesson!];
                                setCompletedLessons(updatedCompleted);
                                await saveCourseProgress({
                                    username: profile.username,
                                    syllabus,
                                    completed_lessons: updatedCompleted,
                                    current_module_index: updatedCompleted.length
                                });
                                onAddXp(50);
                                setSelectedLesson(null);
                            }}>Continuar Ruta →</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="academy-screen">
            <header className="screen-header">
                <button onClick={onBack} className="icon-btn"><ArrowLeft size={24} /></button>
                <h1>Profesoria Academy</h1>
            </header>

            <div className="academy-body">
                {!syllabus.length ? (
                    <div className="syllabus-empty">
                        <Sparkles size={64} className="icon-gold animate-pulse" />
                        <h2>Construyendo tu Academia...</h2>
                        <div className="loading-tips">
                            <p className="tip-label">Sabías que...</p>
                            <p className="tip-text">Practicar 15 minutos al día es suficiente para notar avances en solo 2 semanas.</p>
                        </div>
                        <div className="spinner"></div>
                        <p className="loading-msg">Analizando tu nivel e intereses para crear 50 lecciones únicas.</p>
                        {isLoadingSyllabus && <div className="progress-bar-thin"><div className="progress-fill"></div></div>}
                    </div>
                ) : (
                    <div className="learning-path">
                        {syllabus.map((topic, i) => {
                            const isDone = completedLessons.includes(topic);
                            return (
                                <div key={i} className={`path-node ${isDone ? 'is-done' : ''}`} onClick={() => startLesson(topic)}>
                                    <div className="node-number">{isDone ? <CheckCircle size={16} /> : i + 1}</div>
                                    <div className="node-info">
                                        <h4>{topic}</h4>
                                        <p>{isDone ? '¡Completada!' : 'Pulsa para empezar'}</p>
                                    </div>
                                    <div className="node-status">
                                        {isDone ? <CheckCircle className="text-success" /> : <Play size={16} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
                }
            </div >
        </div >
    );
};

export default App;