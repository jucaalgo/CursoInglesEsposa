import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateInteractiveContent, generateSpeech, playRawAudio, evaluatePronunciation } from '../services/gemini';
import { updateProgress } from '../services/repository';
import { useUserProfile } from '../hooks/useUserProfile';
import { useCourse } from '../hooks/useCourse';
import { InteractiveContent, PronunciationAnalysis } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import AudioRecorder from '../components/AudioRecorder';
import confetti from 'canvas-confetti';
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, Headphones, HelpCircle, RefreshCw, Volume2, Mic, Award, Shuffle, PenLine, Link2, Loader2, Check, X } from 'lucide-react';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/sounds';

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

    // Exercise states
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [fillBlankAnswers, setFillBlankAnswers] = useState<Record<string, string>>({});
    const [fillBlankSubmitted, setFillBlankSubmitted] = useState(false);
    const [scrambleOrder, setScrambleOrder] = useState<{ id: string, text: string, selected: boolean }[]>([]);
    const [scrambleSubmitted, setScrambleSubmitted] = useState(false);
    const [matchingSelected, setMatchingSelected] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
    const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>({});
    const [matchingLeft, setMatchingLeft] = useState<string[]>([]);
    const [matchingRight, setMatchingRight] = useState<string[]>([]);

    const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
    const [listeningSubmitted, setListeningSubmitted] = useState(false);

    // Pronunciation
    const [pronunciationResult, setPronunciationResult] = useState<PronunciationAnalysis | null>(null);
    const [isEvaluatingPronunciation, setIsEvaluatingPronunciation] = useState(false);

    // XP animation
    const [xpEarned, setXpEarned] = useState(0);
    const [showXpAnimation, setShowXpAnimation] = useState(false);

    useEffect(() => {
        if (topic && profile) loadContent();
    }, [topic, profile?.username]);

    const loadContent = async () => {
        if (!topic || !profile) return;
        setLoading(true);
        try {
            const data = await generateInteractiveContent(topic, profile.current_level);
            setContent(data);
            if (data.scramble) {
                setScrambleOrder(data.scramble.scrambledParts.map((text, i) => ({
                    id: `w-${i}-${Math.random().toString(36).substr(2, 5)}`,
                    text,
                    selected: false
                })));
            }
            if (data.wordMatching) {
                setMatchingLeft([...data.wordMatching.pairs.map(p => p.word)].sort(() => Math.random() - 0.5));
                setMatchingRight([...data.wordMatching.pairs.map(p => p.match)].sort(() => Math.random() - 0.5));
            }
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

            // Check if goal reached for extra celebration
            const currentDaily = (profile.daily_xp || 0) + xpEarned;
            const goal = profile.daily_goal || 50;

            if (currentDaily >= goal && (profile.daily_xp || 0) < goal) {
                // First time hitting goal today!
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

    const awardXP = async (points: number) => {
        if (!profile) return;
        playCorrectSound();
        setXpEarned(prev => prev + points);
        setShowXpAnimation(true);

        // Sync with database/localStorage
        try {
            await updateProgress(profile.username, points);
        } catch (e) {
            console.error("Failed to sync XP", e);
        }

        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        setTimeout(() => setShowXpAnimation(false), 1500);
    };

    const handlePronunciationTest = async (audioBase64: string) => {
        if (!content || !profile) return;
        setIsEvaluatingPronunciation(true);
        setPronunciationResult(null);
        try {
            const targetPhrase = content.conversation.turns[0]?.text || "Hello, how are you?";
            const result = await evaluatePronunciation(targetPhrase, audioBase64, profile.current_level);
            setPronunciationResult(result);
            if (result.score >= 70) {
                awardXP(15);
            } else {
                playWrongSound();
            }
        } catch (error) {
            console.error("Pronunciation evaluation failed", error);
            setPronunciationResult({ phrase: "", score: 0, feedback: "Evaluation failed. Please try again.", words: [] });
        } finally {
            setIsEvaluatingPronunciation(false);
        }
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
                <div className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full border border-amber-500/20 font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {xpEarned} XP
                </div>
            </header>

            {/* Tabs - Mobile horizontal scroll with snap */}
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
                {/* STORY TAB */}
                {activeTab === 'story' && (
                    <Card className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                                <BookOpen className="w-6 h-6 text-indigo-400" />
                                <h2 className="text-xl font-bold">The Story</h2>
                            </div>
                            <p className="text-gray-300 leading-relaxed italic border-l-2 border-indigo-500/30 pl-4">{content.scenario.description}</p>
                            <div className="space-y-3">
                                {content.scenario.dialogueScript.split('\n').map((line, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 bg-gray-900/50 rounded-2xl hover:bg-gray-900 transition-colors group">
                                        <button
                                            onClick={() => playTTS(line.replace(/^[A-Z]:\s*/, ''))}
                                            className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0"
                                        >
                                            <Volume2 className="w-5 h-5" />
                                        </button>
                                        <p className="text-gray-200 pt-1 font-medium">{line}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button onClick={() => handleTabChange('vocab')} className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-indigo-500/10">
                            Got it! Continue <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Card>
                )}

                {/* VOCABULARY TAB */}
                {activeTab === 'vocab' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Key Vocabulary</h2>
                            <div className="text-xs text-gray-500">{content.vocabulary.length} words</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {content.vocabulary.map((item, i) => (
                                <button
                                    key={i}
                                    className="p-5 bg-gray-900 border border-gray-800 rounded-3xl text-left hover:border-indigo-500/50 transition-all active:scale-[0.98] group"
                                    onClick={() => playTTS(item.term)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-indigo-400 font-bold text-lg">{item.term}</span>
                                        <Volume2 className="w-4 h-4 text-gray-600 group-hover:text-indigo-500" />
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">{item.definition}</p>
                                </button>
                            ))}
                        </div>
                        <Button onClick={() => handleTabChange('matching')} className="w-full h-14 text-lg rounded-2xl">
                            Next: Challenge <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {/* WORD MATCHING TAB */}
                {activeTab === 'matching' && content.wordMatching && (
                    <div className="space-y-6">
                        <div className="text-center p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                            <h2 className="text-xl font-bold mb-2">Match the Pairs</h2>
                            <p className="text-sm text-gray-400">Connect the English words with their translations</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                {matchingLeft.map((word) => (
                                    <button
                                        key={word}
                                        disabled={!!matchingPairs[word]}
                                        onClick={() => {
                                            playClickSound();
                                            setMatchingSelected({ ...matchingSelected, left: matchingSelected.left === word ? null : word });
                                        }}
                                        className={`
                                            w-full p-4 rounded-2xl text-center font-bold transition-all shadow-sm border-2
                                            ${matchingPairs[word]
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30 opacity-50'
                                                : matchingSelected.left === word
                                                    ? 'bg-indigo-600 text-white scale-105 border-indigo-400 shadow-xl shadow-indigo-600/20'
                                                    : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-indigo-500/50'
                                            }
                                        `}
                                    >
                                        {word}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                {matchingRight.map((match) => (
                                    <button
                                        key={match}
                                        disabled={Object.values(matchingPairs).includes(match)}
                                        onClick={() => {
                                            playClickSound();
                                            if (matchingSelected.left) {
                                                const correct = content.wordMatching?.pairs.find(p => p.word === matchingSelected.left)?.match === match;
                                                if (correct) {
                                                    setMatchingPairs(prev => ({ ...prev, [matchingSelected.left!]: match }));
                                                    awardXP(10);
                                                } else {
                                                    playWrongSound();
                                                }
                                                setMatchingSelected({ left: null, right: null });
                                            }
                                        }}
                                        className={`
                                            w-full p-4 rounded-2xl text-center font-bold transition-all border-2
                                            ${Object.values(matchingPairs).includes(match)
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30 opacity-50'
                                                : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-indigo-500/50'
                                            }
                                        `}
                                    >
                                        {match}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {Object.keys(matchingPairs).length === content.wordMatching.pairs.length ? (
                            <div className="animate-in zoom-in duration-300">
                                <Button onClick={() => handleTabChange('fillblanks')} className="w-full h-14 bg-green-600 hover:bg-green-500 rounded-2xl">
                                    Amazing! Next Section <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        ) : (
                            <div className="h-14" />
                        )}
                    </div>
                )}

                {/* Faltan los demás tabs aquí pero para ahorrar espacio implementaré una versión condensada o el mismo bloque funcional previvamente visto */}
                {activeTab === 'fillblanks' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Fill in the Blanks</h2>
                        <div className="space-y-6">
                            {content.fillInBlanks.map((item, i) => (
                                <div key={item.id || i} className="bg-gray-900 p-6 rounded-3xl border border-gray-800 space-y-4">
                                    <p className="text-lg font-medium tracking-wide leading-relaxed">
                                        {item.sentence.split('___').map((part, index, array) => (
                                            <React.Fragment key={index}>
                                                {part}
                                                {index < array.length - 1 && (
                                                    <span className={`inline-block border-b-2 px-4 min-w-[80px] text-center mx-1 ${fillBlankSubmitted ? (fillBlankAnswers[item.id || i] === item.correctWord ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400') : 'border-indigo-500 text-indigo-400'}`}>
                                                        {fillBlankAnswers[item.id || i] || '_____'}
                                                    </span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {item.options.map((opt) => (
                                            <button
                                                key={opt}
                                                disabled={fillBlankSubmitted}
                                                onClick={() => { playClickSound(); setFillBlankAnswers(prev => ({ ...prev, [item.id || i]: opt })); }}
                                                className={`
                                                    px-6 py-2.5 rounded-2xl font-bold transition-all border-2
                                                    ${fillBlankAnswers[item.id || i] === opt
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                                        : 'bg-gray-800 border-gray-700 text-gray-400'
                                                    }
                                                `}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    {fillBlankSubmitted && (
                                        <div className={`text-sm font-bold flex items-center gap-2 ${fillBlankAnswers[item.id || i] === item.correctWord ? 'text-green-400' : 'text-red-400'}`}>
                                            {fillBlankAnswers[item.id || i] === item.correctWord ? <CheckCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                                            {fillBlankAnswers[item.id || i] === item.correctWord ? 'Correct!' : `Correct word: ${item.correctWord}`}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={() => {
                                if (!fillBlankSubmitted) {
                                    const correct = Object.entries(fillBlankAnswers).every(([k, v]) => {
                                        const index = parseInt(k);
                                        const question = content.fillInBlanks[index];
                                        return question ? v === question.correctWord : false;
                                    });
                                    if (correct) awardXP(15); else playWrongSound();
                                    setFillBlankSubmitted(true);
                                } else {
                                    handleTabChange('scramble');
                                }
                            }}
                            className={`w-full h-14 text-lg rounded-2xl ${fillBlankSubmitted ? 'bg-indigo-600' : 'bg-gray-800'}`}
                        >
                            {fillBlankSubmitted ? 'Continue to Scramble' : 'Check Answers'}
                        </Button>
                    </div>
                )}

                {/* SCRAMBLE TAB */}
                {activeTab === 'scramble' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Unscramble</h2>
                        <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl space-y-8">
                            <div className="min-h-[100px] flex flex-wrap gap-3 p-4 bg-gray-950 rounded-2xl border-2 border-dashed border-gray-800 items-center justify-center">
                                {scrambleOrder.filter(w => w.selected).map((w) => (
                                    <button
                                        key={w.id}
                                        onClick={() => {
                                            playClickSound();
                                            setScrambleOrder(prev => prev.map(item => item.id === w.id ? { ...item, selected: false } : item));
                                            setScrambleSubmitted(false);
                                        }}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg animate-in zoom-in-50"
                                    >
                                        {w.text}
                                    </button>
                                ))}
                                {scrambleOrder.filter(w => w.selected).length === 0 && <span className="text-gray-600 italic font-medium">Tap words below to build the sentence...</span>}
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center">
                                {scrambleOrder.filter(w => !w.selected).map((w) => (
                                    <button
                                        key={w.id}
                                        onClick={() => {
                                            playClickSound();
                                            setScrambleOrder(prev => prev.map(item => item.id === w.id ? { ...item, selected: true } : item));
                                        }}
                                        className="px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-2xl font-bold hover:bg-gray-700 transition-all active:scale-[0.85]"
                                    >
                                        {w.text}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => { playClickSound(); setScrambleOrder(prev => prev.map(w => ({ ...w, selected: false }))); setScrambleSubmitted(false); }} className="h-14 px-6 rounded-2xl">
                                <RefreshCw className="w-5 h-5 mr-2" /> Reset
                            </Button>
                            <Button
                                disabled={scrambleOrder.filter(w => w.selected).length === 0}
                                onClick={() => {
                                    const sentence = scrambleOrder.filter(w => w.selected).map(w => w.text).join(' ');
                                    if (sentence.toLowerCase() === content.scramble.sentence.toLowerCase()) {
                                        awardXP(20);
                                        setScrambleSubmitted(true);
                                    } else {
                                        playWrongSound();
                                    }
                                }}
                                className="flex-1 h-14 text-lg rounded-2xl"
                            >
                                Check Sentence
                            </Button>
                        </div>
                        {scrambleSubmitted && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Button onClick={() => handleTabChange('quiz')} className="w-full h-14 bg-green-600 rounded-2xl">
                                    Perfect! Continue to Quiz <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* QUIZ TAB */}
                {activeTab === 'quiz' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Testing your knowledge</h2>
                        <div className="space-y-6">
                            {content.quiz.map((q, i) => (
                                <div key={i} className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
                                    <div className="p-6 bg-gray-800/50">
                                        <h3 className="text-lg font-bold leading-tight">{q.question}</h3>
                                    </div>
                                    <div className="p-6 space-y-3">
                                        {q.options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                disabled={quizSubmitted}
                                                onClick={() => { playClickSound(); setQuizAnswers(prev => ({ ...prev, [i]: idx })); }}
                                                className={`
                                    w-full p-4 rounded-2xl text-left font-bold transition-all border-2
                                    ${quizAnswers[i] === idx
                                                        ? quizSubmitted
                                                            ? idx === q.correctIndex ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
                                                            : 'bg-indigo-600 border-indigo-500 text-white'
                                                        : quizSubmitted && idx === q.correctIndex
                                                            ? 'bg-green-600/10 border-green-500/50 text-green-400'
                                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                                    }
                                  `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{opt}</span>
                                                    {quizAnswers[i] === idx && (
                                                        quizSubmitted ? (idx === q.correctIndex ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />) : <Check className="w-5 h-5 opacity-50" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={() => {
                                if (quizSubmitted) handleTabChange('listening');
                                else {
                                    const totalCorrect = content.quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length;
                                    if (totalCorrect === content.quiz.length) awardXP(25); else playWrongSound();
                                    setQuizSubmitted(true);
                                }
                            }}
                            className="w-full h-16 text-xl rounded-2xl"
                        >
                            {quizSubmitted ? 'Continue to Listening' : 'Complete Quiz'}
                        </Button>
                    </div>
                )}

                {/* LISTENING TAB */}
                {activeTab === 'listening' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Listen & Type</h2>
                        <div className="space-y-4">
                            {(content.listening || []).map((item, i) => (
                                <div key={i} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl space-y-6">
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => playTTS(item.phrase)}
                                            className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:scale-105 transition-transform"
                                        >
                                            <Volume2 className="w-10 h-10 text-white" />
                                        </button>
                                    </div>
                                    <div className="text-center text-sm text-gray-500 italic">"{item.hint}"</div>
                                    <input
                                        type="text"
                                        className="w-full h-14 bg-gray-950 border-2 border-gray-800 rounded-2xl px-6 text-center text-xl font-bold focus:border-indigo-500 transition-all outline-none"
                                        placeholder="What did you hear?"
                                        value={listeningAnswers[i] || ''}
                                        onChange={(e) => setListeningAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                                        disabled={listeningSubmitted}
                                    />
                                    {listeningSubmitted && (
                                        <div className={`text-center font-bold animate-in zoom-in ${listeningAnswers[i]?.trim().toLowerCase() === item.answer.toLowerCase() ? 'text-green-400' : 'text-red-400'}`}>
                                            {listeningAnswers[i]?.trim().toLowerCase() === item.answer.toLowerCase() ? '✓ Spot on!' : `✗ Correct answer: "${item.answer}"`}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={() => {
                                if (listeningSubmitted) handleTabChange('pronunciation');
                                else {
                                    const correct = (content.listening || []).every((item, i) => listeningAnswers[i]?.trim().toLowerCase() === item.answer.toLowerCase());
                                    if (correct) awardXP(20); else playWrongSound();
                                    setListeningSubmitted(true);
                                }
                            }}
                            className="w-full h-14 rounded-2xl"
                        >
                            {listeningSubmitted ? 'Almost Finished! Speak' : 'Verify Audio'}
                        </Button>
                    </div>
                )}

                {/* PRONUNCIATION TAB */}
                {activeTab === 'pronunciation' && (
                    <Card className="text-center space-y-10 py-10">
                        <div className="space-y-2">
                            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                                <Mic className="w-10 h-10 text-white relative z-10" />
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tight">THE FINAL CHALLENGE</h2>
                            <p className="text-gray-500 uppercase text-xs font-bold tracking-[0.2em]">Record your pronunciation</p>
                        </div>

                        <div className="max-w-md mx-auto p-8 bg-gray-900 border-2 border-gray-800 rounded-[2.5rem] space-y-4">
                            <p className="text-2xl font-bold text-gray-100 uppercase tracking-tighter">
                                "{content.conversation.turns[0]?.text || 'Hello, world!'}"
                            </p>
                            <button
                                onClick={() => playTTS(content.conversation.turns[0]?.text || 'Hello')}
                                className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold text-sm underline underline-offset-4"
                            >
                                LISTEN FIRST
                            </button>
                        </div>

                        <div className="flex justify-center pb-6">
                            <AudioRecorder onRecordingComplete={handlePronunciationTest} />
                        </div>

                        {isEvaluatingPronunciation && (
                            <div className="animate-pulse">
                                <Loader2 className="w-10 h-10 mx-auto text-indigo-500 animate-spin" />
                                <p className="text-gray-400 mt-4 font-bold tracking-widest">ANALYZING SPEECH...</p>
                            </div>
                        )}

                        {pronunciationResult && (
                            <div className="space-y-6 animate-in zoom-in">
                                <div className={`
                                    inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 shadow-2xl
                                    ${pronunciationResult.score >= 80 ? 'bg-green-500/10 border-green-500 text-green-400 shadow-green-500/20' :
                                        pronunciationResult.score >= 50 ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-amber-500/20' :
                                            'bg-red-500/10 border-red-500 text-red-400 shadow-red-500/20'}
                                `}>
                                    <span className="text-4xl font-black">{pronunciationResult.score}%</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Accuracy</span>
                                </div>
                                <p className="max-w-sm mx-auto text-gray-300 font-medium leading-relaxed italic">"{pronunciationResult.feedback}"</p>
                            </div>
                        )}

                        <Button onClick={handleComplete} className="w-full h-16 text-xl rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] shadow-2xl shadow-indigo-600/30">
                            <Award className="w-6 h-6 mr-2" /> CLAIM REWARDS
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Lesson;
