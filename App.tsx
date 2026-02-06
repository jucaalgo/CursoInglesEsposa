import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Send, ArrowLeft, Flame, Star, MessageCircle, BookOpen, Trophy, Settings, LogOut, Sparkles, Check, X, RefreshCw } from 'lucide-react';
import { generateSpeech, playRawAudio, LiveSession } from './services/gemini';
import { GoogleGenAI, Type } from "@google/genai";

// ============================================
// TYPES
// ============================================
interface UserProfile {
    name: string;
    currentLevel: string;
    targetLevel: string;
    interests: string[];
}

interface Message {
    id: string;
    role: 'user' | 'tutor';
    text: string;
    correction?: {
        original: string;
        corrected: string;
        explanation: string;
    };
    audio?: string;
}

interface ConversationScenario {
    id: string;
    title: string;
    titleEs: string;
    description: string;
    icon: string;
    difficulty: 'easy' | 'medium' | 'hard';
    systemPrompt: string;
}

// ============================================
// CONSTANTS
// ============================================
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SCENARIOS: ConversationScenario[] = [
    {
        id: 'daily',
        title: 'Daily Chat',
        titleEs: 'Charla Diaria',
        description: 'Have a casual conversation about your day',
        icon: '☕',
        difficulty: 'easy',
        systemPrompt: `You are a friendly English tutor having a casual conversation. 
    Be warm, encouraging, and natural. Ask about their day, interests, and life.
    Gently correct grammar mistakes inline like: "Almost! It's 'I went' not 'I go' 😊"
    Keep responses short (1-2 sentences) to maintain natural dialogue flow.
    Speak naturally, not like a textbook.`
    },
    {
        id: 'restaurant',
        title: 'At a Restaurant',
        titleEs: 'En el Restaurante',
        description: 'Practice ordering food and drinks',
        icon: '🍽️',
        difficulty: 'easy',
        systemPrompt: `You are a waiter at a restaurant. Help the student practice ordering food.
    Start by greeting them and asking what they'd like.
    Gently correct any grammar mistakes inline.
    Keep it natural and conversational. Short responses.`
    },
    {
        id: 'job_interview',
        title: 'Job Interview',
        titleEs: 'Entrevista de Trabajo',
        description: 'Practice common interview questions',
        icon: '💼',
        difficulty: 'medium',
        systemPrompt: `You are a professional interviewer. Conduct a friendly but professional job interview.
    Ask common questions: tell me about yourself, your strengths, why you want this job.
    Give positive feedback and gentle corrections.
    Keep responses professional but warm.`
    },
    {
        id: 'travel',
        title: 'Travel Planning',
        titleEs: 'Planificando Viajes',
        description: 'Discuss travel plans and destinations',
        icon: '✈️',
        difficulty: 'medium',
        systemPrompt: `You are a travel agent helping someone plan a trip.
    Ask about where they want to go, when, preferences.
    Be enthusiastic about their choices.
    Correct grammar gently and naturally.`
    },
    {
        id: 'debate',
        title: 'Friendly Debate',
        titleEs: 'Debate Amistoso',
        description: 'Discuss opinions on current topics',
        icon: '💬',
        difficulty: 'hard',
        systemPrompt: `You are an intellectual discussion partner.
    Discuss current topics, technology, society politely.
    Challenge their ideas respectfully to encourage complex speech.
    Correct advanced grammar subtly.`
    },
    {
        id: 'free',
        title: 'Free Practice',
        titleEs: 'Práctica Libre',
        description: 'Talk about anything you want',
        icon: '🎯',
        difficulty: 'easy',
        systemPrompt: `You are a supportive English tutor. Let the student lead the conversation.
    Be curious, ask follow-up questions.
    Provide gentle corrections when needed.
    Be encouraging and positive.`
    }
];

// ============================================
// HOOKS
// ============================================

// Speech Recognition Hook
const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let interim = '';
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        final += result[0].transcript;
                    } else {
                        interim += result[0].transcript;
                    }
                }
                setInterimTranscript(interim);
                if (final) {
                    setTranscript(final);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            setTranscript('');
            setInterimTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        isSupported,
        startListening,
        stopListening,
        resetTranscript
    };
};

// Local Storage Hook
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
    };

    return [storedValue, setValue];
};

// Streak Hook
const useStreak = () => {
    const [streak, setStreak] = useLocalStorage('profesoria_streak', { count: 0, lastPractice: '' });
    const [xp, setXp] = useLocalStorage('profesoria_xp', 0);

    const updateStreak = useCallback(() => {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (streak.lastPractice === today) return;

        const newCount = streak.lastPractice === yesterday ? streak.count + 1 : 1;
        setStreak({ count: newCount, lastPractice: today });
    }, [streak, setStreak]);

    const addXp = useCallback((amount: number) => {
        setXp(xp + amount);
        updateStreak();
    }, [xp, setXp, updateStreak]);

    return { streak: streak.count, xp, addXp, updateStreak };
};

// ============================================
// GEMINI AI SERVICE
// ============================================
const getApiKey = () => {
    const customKey = localStorage.getItem('profesoria_api_key');
    // @ts-ignore
    const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
    return customKey || envKey;
};

const chatWithTutor = async (
    messages: { role: 'user' | 'model'; text: string }[],
    systemPrompt: string,
    userLevel: string
): Promise<{ text: string; correction?: { original: string; corrected: string; explanation: string } }> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key missing');

    const client = new GoogleGenAI({ apiKey });

    const fullSystemPrompt = `${systemPrompt}
  
  Student's English level: ${userLevel}
  
  IMPORTANT RULES:
  1. Keep responses SHORT (1-3 sentences max)
  2. Be conversational, not formal
  3. If there's a grammar error, correct it naturally inline with **bold** for the correction
  4. Always respond in English
  5. Be encouraging and warm
  
  Response format (JSON):
  {
    "text": "Your conversational response",
    "hasCorrection": true/false,
    "correction": {
      "original": "what they said wrong",
      "corrected": "how to say it right",
      "explanation": "brief explanation in Spanish"
    }
  }`;

    const contents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            systemInstruction: fullSystemPrompt,
            contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        hasCorrection: { type: Type.BOOLEAN },
                        correction: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING },
                                corrected: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });

        const result = JSON.parse(response.text || '{}');
        return {
            text: result.text || "I didn't catch that. Could you repeat?",
            correction: result.hasCorrection ? result.correction : undefined
        };
    } catch (error) {
        console.error('Chat error:', error);
        throw error;
    }
};

// ============================================
// COMPONENTS
// ============================================

// Login Screen
const LoginScreen: React.FC<{ onLogin: (name: string) => void }> = ({ onLogin }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) onLogin(name.trim());
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🎓</div>
                    <h1 className="text-3xl font-bold text-gray-800">Profesoria</h1>
                    <p className="text-gray-500 mt-2">Tu tutor de inglés con IA</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="¿Cómo te llamas?"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-lg"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        Comenzar 🚀
                    </button>
                </form>
            </div>
        </div>
    );
};

// Onboarding Screen
const OnboardingScreen: React.FC<{
    name: string;
    onComplete: (profile: UserProfile) => void;
}> = ({ name, onComplete }) => {
    const [step, setStep] = useState(0);
    const [currentLevel, setCurrentLevel] = useState('A2');
    const [targetLevel, setTargetLevel] = useState('B2');
    const [interests, setInterests] = useState<string[]>([]);

    const interestOptions = ['Viajes', 'Negocios', 'Tecnología', 'Películas', 'Deportes', 'Música'];

    const handleComplete = () => {
        onComplete({
            name,
            currentLevel,
            targetLevel,
            interests: interests.length ? interests : ['General']
        });
    };

    const steps = [
        // Level selection
        <div key="level" className="space-y-4">
            <h2 className="text-2xl font-bold text-center">¿Cuál es tu nivel actual?</h2>
            <div className="grid grid-cols-3 gap-3">
                {LEVELS.map(level => (
                    <button
                        key={level}
                        onClick={() => setCurrentLevel(level)}
                        className={`py-4 rounded-xl text-lg font-semibold transition-all ${currentLevel === level
                                ? 'bg-purple-600 text-white scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {level}
                    </button>
                ))}
            </div>
            <button
                onClick={() => setStep(1)}
                className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
                Siguiente
            </button>
        </div>,

        // Target level
        <div key="target" className="space-y-4">
            <h2 className="text-2xl font-bold text-center">¿A qué nivel quieres llegar?</h2>
            <div className="grid grid-cols-3 gap-3">
                {LEVELS.filter(l => LEVELS.indexOf(l) > LEVELS.indexOf(currentLevel)).map(level => (
                    <button
                        key={level}
                        onClick={() => setTargetLevel(level)}
                        className={`py-4 rounded-xl text-lg font-semibold transition-all ${targetLevel === level
                                ? 'bg-purple-600 text-white scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {level}
                    </button>
                ))}
            </div>
            <button
                onClick={() => setStep(2)}
                className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
                Siguiente
            </button>
        </div>,

        // Interests
        <div key="interests" className="space-y-4">
            <h2 className="text-2xl font-bold text-center">¿Qué te interesa?</h2>
            <p className="text-gray-500 text-center">Selecciona varios temas</p>
            <div className="grid grid-cols-2 gap-3">
                {interestOptions.map(interest => (
                    <button
                        key={interest}
                        onClick={() => {
                            setInterests(prev =>
                                prev.includes(interest)
                                    ? prev.filter(i => i !== interest)
                                    : [...prev, interest]
                            );
                        }}
                        className={`py-3 px-4 rounded-xl font-medium transition-all ${interests.includes(interest)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {interest}
                    </button>
                ))}
            </div>
            <button
                onClick={handleComplete}
                className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
                ¡Empezar a aprender! 🎉
            </button>
        </div>
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl">
                <div className="mb-6">
                    <div className="flex justify-center gap-2 mb-4">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-full transition-colors ${i <= step ? 'bg-purple-600' : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-center text-gray-500">Hola, {name} 👋</p>
                </div>
                {steps[step]}
            </div>
        </div>
    );
};

// Dashboard Screen
const DashboardScreen: React.FC<{
    profile: UserProfile;
    streak: number;
    xp: number;
    onSelectScenario: (scenario: ConversationScenario) => void;
    onLogout: () => void;
}> = ({ profile, streak, xp, onSelectScenario, onLogout }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm px-4 py-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Hola, {profile.name}! 👋</h1>
                        <p className="text-sm text-gray-500">Nivel: {profile.currentLevel} → {profile.targetLevel}</p>
                    </div>
                    <button onClick={onLogout} className="text-gray-400 hover:text-gray-600">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="max-w-lg mx-auto px-4 py-6">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 text-white">
                        <div className="flex items-center gap-2">
                            <Flame size={24} />
                            <span className="text-3xl font-bold">{streak}</span>
                        </div>
                        <p className="text-sm opacity-90 mt-1">Días seguidos</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 text-white">
                        <div className="flex items-center gap-2">
                            <Star size={24} />
                            <span className="text-3xl font-bold">{xp}</span>
                        </div>
                        <p className="text-sm opacity-90 mt-1">XP Total</p>
                    </div>
                </div>

                {/* Scenarios */}
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MessageCircle size={20} />
                    ¿De qué quieres hablar hoy?
                </h2>

                <div className="space-y-3">
                    {SCENARIOS.map(scenario => (
                        <button
                            key={scenario.id}
                            onClick={() => onSelectScenario(scenario)}
                            className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
                        >
                            <div className="text-3xl">{scenario.icon}</div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">{scenario.titleEs}</h3>
                                <p className="text-sm text-gray-500">{scenario.description}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${scenario.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    scenario.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {scenario.difficulty === 'easy' ? 'Fácil' :
                                    scenario.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Chat Screen (Main Conversation)
const ChatScreen: React.FC<{
    scenario: ConversationScenario;
    profile: UserProfile;
    onBack: () => void;
    onAddXp: (amount: number) => void;
}> = ({ scenario, profile, onBack, onAddXp }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        isListening,
        transcript,
        interimTranscript,
        isSupported: speechSupported,
        startListening,
        stopListening,
        resetTranscript
    } = useSpeechRecognition();

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle transcript when user stops speaking
    useEffect(() => {
        if (transcript && !isListening) {
            handleSendMessage(transcript);
            resetTranscript();
        }
    }, [transcript, isListening]);

    // Initial greeting
    useEffect(() => {
        const greet = async () => {
            setIsLoading(true);
            try {
                const greeting = await chatWithTutor(
                    [{ role: 'user', text: 'Start the conversation with a warm greeting.' }],
                    scenario.systemPrompt,
                    profile.currentLevel
                );

                const tutorMessage: Message = {
                    id: Date.now().toString(),
                    role: 'tutor',
                    text: greeting.text
                };

                setMessages([tutorMessage]);

                // Speak the greeting
                try {
                    const audio = await generateSpeech(greeting.text, 'Kore');
                    await playRawAudio(audio);
                } catch (e) {
                    console.warn('TTS failed:', e);
                }
            } catch (error) {
                console.error('Greeting error:', error);
                setMessages([{
                    id: '1',
                    role: 'tutor',
                    text: "Hi there! Let's practice English together. How are you today?"
                }]);
            } finally {
                setIsLoading(false);
            }
        };

        greet();
    }, []);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const chatHistory = [...messages, userMessage].map(m => ({
                role: m.role === 'user' ? 'user' as const : 'model' as const,
                text: m.text
            }));

            const response = await chatWithTutor(
                chatHistory,
                scenario.systemPrompt,
                profile.currentLevel
            );

            const tutorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'tutor',
                text: response.text,
                correction: response.correction
            };

            setMessages(prev => [...prev, tutorMessage]);

            // Add XP for practicing
            onAddXp(5);

            // Speak the response
            setIsSpeaking(true);
            try {
                const audio = await generateSpeech(response.text, 'Kore');
                await playRawAudio(audio);
            } catch (e) {
                console.warn('TTS failed:', e);
            } finally {
                setIsSpeaking(false);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'tutor',
                text: "Sorry, I had trouble understanding. Could you try again?"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="font-semibold text-gray-800">{scenario.titleEs}</h1>
                    <p className="text-xs text-gray-500">{scenario.icon} {scenario.title}</p>
                </div>
                {isSpeaking && (
                    <div className="flex items-center gap-1 text-purple-600">
                        <Volume2 size={16} className="animate-pulse" />
                        <span className="text-xs">Hablando...</span>
                    </div>
                )}
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-purple-600 text-white rounded-br-md'
                                : 'bg-white shadow-sm rounded-bl-md'
                            }`}>
                            <p className={message.role === 'tutor' ? 'text-gray-800' : ''}>{message.text}</p>

                            {message.correction && (
                                <div className="mt-2 pt-2 border-t border-purple-200 bg-purple-50 rounded-lg p-2 -mx-2 -mb-1">
                                    <div className="flex items-start gap-2">
                                        <Sparkles size={14} className="text-purple-600 mt-0.5" />
                                        <div className="text-xs">
                                            <p className="text-red-500 line-through">{message.correction.original}</p>
                                            <p className="text-green-600 font-medium">✓ {message.correction.corrected}</p>
                                            <p className="text-gray-500 mt-1">{message.correction.explanation}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Interim transcript */}
            {(isListening || interimTranscript) && (
                <div className="px-4 py-2 bg-purple-50 border-t">
                    <p className="text-sm text-purple-600 flex items-center gap-2">
                        <Mic size={14} className="animate-pulse" />
                        {interimTranscript || 'Escuchando...'}
                    </p>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white border-t px-4 py-3 safe-area-pb">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                        placeholder="Escribe o habla en inglés..."
                        className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:border-purple-500 focus:outline-none"
                        disabled={isListening}
                    />

                    {speechSupported && (
                        <button
                            onClick={handleMicClick}
                            disabled={isLoading}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                }`}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                    )}

                    <button
                        onClick={() => handleSendMessage(inputText)}
                        disabled={!inputText.trim() || isLoading}
                        className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// MAIN APP
// ============================================
const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useLocalStorage<string | null>('profesoria_current_user', null);
    const [profile, setProfile] = useLocalStorage<UserProfile | null>('profesoria_profile', null);
    const [selectedScenario, setSelectedScenario] = useState<ConversationScenario | null>(null);
    const { streak, xp, addXp } = useStreak();

    // App State
    const [appState, setAppState] = useState<'loading' | 'login' | 'onboarding' | 'dashboard' | 'chat'>('loading');

    useEffect(() => {
        // Determine initial state
        if (currentUser && profile) {
            setAppState('dashboard');
        } else if (currentUser && !profile) {
            setAppState('onboarding');
        } else {
            setAppState('login');
        }
    }, []);

    const handleLogin = (name: string) => {
        setCurrentUser(name);

        // Check if profile exists
        const existingProfile = localStorage.getItem(`profesoria_profile_${name}`);
        if (existingProfile) {
            setProfile(JSON.parse(existingProfile));
            setAppState('dashboard');
        } else {
            setAppState('onboarding');
        }
    };

    const handleOnboardingComplete = (newProfile: UserProfile) => {
        setProfile(newProfile);
        localStorage.setItem(`profesoria_profile_${currentUser}`, JSON.stringify(newProfile));
        setAppState('dashboard');
    };

    const handleSelectScenario = (scenario: ConversationScenario) => {
        setSelectedScenario(scenario);
        setAppState('chat');
    };

    const handleBackToDashboard = () => {
        setSelectedScenario(null);
        setAppState('dashboard');
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setProfile(null);
        setAppState('login');
    };

    // Render based on state
    switch (appState) {
        case 'loading':
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                    <div className="text-white text-center">
                        <div className="text-5xl mb-4">🎓</div>
                        <p className="text-lg">Cargando...</p>
                    </div>
                </div>
            );

        case 'login':
            return <LoginScreen onLogin={handleLogin} />;

        case 'onboarding':
            return <OnboardingScreen name={currentUser!} onComplete={handleOnboardingComplete} />;

        case 'dashboard':
            return (
                <DashboardScreen
                    profile={profile!}
                    streak={streak}
                    xp={xp}
                    onSelectScenario={handleSelectScenario}
                    onLogout={handleLogout}
                />
            );

        case 'chat':
            return (
                <ChatScreen
                    scenario={selectedScenario!}
                    profile={profile!}
                    onBack={handleBackToDashboard}
                    onAddXp={addXp}
                />
            );

        default:
            return null;
    }
};

export default App;