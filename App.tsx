import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, ArrowLeft, Flame, Star, MessageCircle, LogOut, Sparkles, CheckCircle, XCircle, Book, Play, RotateCcw } from 'lucide-react';
import { LiveSession, evaluatePronunciation, generateSpeech, playRawAudio, GoogleGenAI, Type } from './services/gemini';
import { getProfile, saveProfile, updateProgress, saveSession, savePronunciation, getSessions, getPronunciations, Profile, Session, PronunciationResult } from './services/repository';

// ============================================
// TYPES
// ============================================
interface WordAnalysis {
    word: string;
    isCorrect: boolean;
    errorType?: string;
    suggestion?: string;
}

interface VocabWord {
    id: string;
    word: string;
    phonetic: string;
    translation: string;
    example: string;
    level: string;
}

interface ConversationScenario {
    id: string;
    title: string;
    titleEs: string;
    description: string;
    icon: string;
    systemPrompt: string;
}

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

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-header">
                    <span className="emoji-large">🎓</span>
                    <h1>Profesoria</h1>
                    <p>Tu tutor de inglés con IA</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onLogin(name.trim()); }}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="¿Cómo te llamas?"
                        autoFocus
                    />
                    <button type="submit" disabled={!name.trim()} className="btn-primary">
                        Comenzar 🚀
                    </button>
                </form>
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
    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Hola, {profile.name}! 👋</h1>
                    <p>{profile.current_level} → {profile.target_level}</p>
                </div>
                <button onClick={onLogout} className="icon-btn"><LogOut size={20} /></button>
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
                <MessageCircle size={20} />
                ¿Qué quieres practicar?
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
}> = ({ scenario, profile, onBack, onAddXp }) => {
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
            const systemPrompt = scenario.systemPrompt.replace('{level}', profile.current_level);
            const session = new LiveSession(handleMessage);
            await session.connect(systemPrompt, 'Kore');
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

    const currentWord = VOCAB_WORDS[currentIndex];

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
        setIsFlipped(false);
        setCurrentIndex((currentIndex + 1) % VOCAB_WORDS.length);
        onAddXp(5);
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
    const [appState, setAppState] = useState<'loading' | 'login' | 'onboarding' | 'dashboard' | 'call' | 'vocab' | 'pronunciation'>('loading');

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
            if (scenario === 'vocab') {
                setAppState('vocab');
            } else if (scenario === 'pronunciation') {
                setAppState('pronunciation');
            }
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
            await updateProgress(currentUser, amount);
            const updatedProfile = await getProfile(currentUser);
            if (updatedProfile) {
                setProfile(updatedProfile);
            }
        }
    };

    switch (appState) {
        case 'loading':
            return <div className="loading-screen"><span>🎓</span><p>Cargando...</p></div>;
        case 'login':
            return <LoginScreen onLogin={handleLogin} />;
        case 'onboarding':
            return <OnboardingScreen name={currentUser!} onComplete={handleOnboardingComplete} />;
        case 'dashboard':
            return <DashboardScreen profile={profile!} onSelectScenario={handleSelectScenario} onLogout={handleLogout} />;
        case 'call':
            return <LiveCallScreen scenario={selectedScenario!} profile={profile!} onBack={() => setAppState('dashboard')} onAddXp={addXp} />;
        case 'vocab':
            return <VocabScreen profile={profile!} onBack={() => setAppState('dashboard')} onAddXp={addXp} />;
        case 'pronunciation':
            return <PronunciationScreen profile={profile!} onBack={() => setAppState('dashboard')} onAddXp={addXp} />;
        default:
            return null;
    }
};

export default App;