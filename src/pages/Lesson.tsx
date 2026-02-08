import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateInteractiveContent, generateSpeech, playRawAudio, evaluatePronunciation } from '../services/gemini';
import { useUserProfile } from '../hooks/useUserProfile';
import { useCourse } from '../hooks/useCourse';
import { InteractiveContent, PronunciationAnalysis } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import AudioRecorder from '../components/AudioRecorder';
import confetti from 'canvas-confetti';
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, Headphones, HelpCircle, Play, RefreshCw, Volume2, Mic, Award, Shuffle, PenLine, Link2, Check, X, Loader2 } from 'lucide-react';

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
    const [scrambleOrder, setScrambleOrder] = useState<string[]>([]);
    const [scrambleSubmitted, setScrambleSubmitted] = useState(false);
    const [matchingSelected, setMatchingSelected] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
    const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>({});
    const [matchingSubmitted, setMatchingSubmitted] = useState(false);
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
            if (data.scramble) setScrambleOrder([...data.scramble.scrambledParts]);
        } catch (error) {
            console.error("Failed to load lesson", error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (topic) {
            await markLessonComplete(topic);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            navigate('/academy');
        }
    };

    const playTTS = async (text: string) => {
        try {
            const audio = await generateSpeech(text);
            await playRawAudio(audio);
        } catch (e) { console.error(e); }
    };

    const awardXP = (points: number) => {
        setXpEarned(prev => prev + points);
        setShowXpAnimation(true);
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
            if (result.score >= 70) awardXP(15);
        } catch (error) {
            console.error("Pronunciation evaluation failed", error);
            setPronunciationResult({ phrase: "", score: 0, feedback: "Evaluation failed. Please try again.", words: [] });
        } finally {
            setIsEvaluatingPronunciation(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-gray-400 animate-pulse">Creating your lesson...</p>
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
        <div className="max-w-4xl mx-auto space-y-4 pb-24">
            {/* XP Animation */}
            {showXpAnimation && (
                <div className="fixed top-20 right-4 z-50 animate-bounce">
                    <div className="bg-amber-500 text-black font-bold px-4 py-2 rounded-full shadow-lg">
                        +{xpEarned} XP ⚡
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center gap-3 py-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/academy')}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-xl font-bold truncate flex-1">{topic}</h1>
                <div className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">
                    {xpEarned} XP
                </div>
            </header>

            {/* Tabs - Horizontal Scroll on Mobile */}
            <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start
                            transition-all duration-200
                            ${activeTab === tab.id
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                            }
                        `}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* STORY TAB */}
                {activeTab === 'story' && (
                    <Card className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-400" />
                                Scenario
                            </h2>
                            <p className="text-gray-300">{content.scenario.description}</p>
                            <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                                {content.scenario.dialogueScript.split('\n').map((line, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <button
                                            onClick={() => playTTS(line.replace(/^[A-Z]:\s*/, ''))}
                                            className="p-2 bg-indigo-500/20 rounded-full hover:bg-indigo-500/30 transition shrink-0"
                                        >
                                            <Volume2 className="w-4 h-4 text-indigo-400" />
                                        </button>
                                        <p className="text-gray-200 pt-1.5">{line}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button onClick={() => setActiveTab('vocab')} className="w-full gap-2">
                            Continue to Vocabulary <ChevronRight className="w-4 h-4" />
                        </Button>
                    </Card>
                )}

                {/* VOCABULARY TAB */}
                {activeTab === 'vocab' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h2 className="text-lg font-semibold">📚 Vocabulary</h2>
                        <div className="grid gap-3">
                            {content.vocabulary.map((item, i) => (
                                <div
                                    key={i}
                                    className="group bg-gray-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700/50 transition cursor-pointer"
                                    onClick={() => playTTS(item.term)}
                                >
                                    <div>
                                        <p className="font-semibold text-indigo-300">{item.term}</p>
                                        <p className="text-sm text-gray-400">{item.definition}</p>
                                    </div>
                                    <Volume2 className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition" />
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setActiveTab('matching')} className="w-full gap-2">
                            Practice Matching <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* WORD MATCHING TAB */}
                {activeTab === 'matching' && content.wordMatching && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h2 className="text-lg font-semibold">🔗 Match the Words</h2>
                        <p className="text-sm text-gray-400">Tap a word, then tap its translation.</p>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Left column - English */}
                            <div className="space-y-2">
                                {content.wordMatching.pairs.map((pair) => (
                                    <button
                                        key={pair.word}
                                        disabled={!!matchingPairs[pair.word]}
                                        onClick={() => {
                                            if (matchingSelected.left === pair.word) {
                                                setMatchingSelected({ ...matchingSelected, left: null });
                                            } else {
                                                setMatchingSelected({ ...matchingSelected, left: pair.word });
                                            }
                                        }}
                                        className={`
                                            w-full p-3 rounded-xl text-left font-medium transition-all
                                            ${matchingPairs[pair.word]
                                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                : matchingSelected.left === pair.word
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                                            }
                                        `}
                                    >
                                        {pair.word}
                                    </button>
                                ))}
                            </div>

                            {/* Right column - Spanish */}
                            <div className="space-y-2">
                                {content.wordMatching.pairs.map((pair) => (
                                    <button
                                        key={pair.match}
                                        disabled={Object.values(matchingPairs).includes(pair.match)}
                                        onClick={() => {
                                            if (matchingSelected.left && !matchingPairs[matchingSelected.left]) {
                                                const correct = content.wordMatching?.pairs.find(p => p.word === matchingSelected.left)?.match === pair.match;
                                                if (correct) {
                                                    setMatchingPairs(prev => ({ ...prev, [matchingSelected.left!]: pair.match }));
                                                    awardXP(5);
                                                }
                                                setMatchingSelected({ left: null, right: null });
                                            }
                                        }}
                                        className={`
                                            w-full p-3 rounded-xl text-left font-medium transition-all
                                            ${Object.values(matchingPairs).includes(pair.match)
                                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                                            }
                                        `}
                                    >
                                        {pair.match}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {Object.keys(matchingPairs).length === content.wordMatching.pairs.length && (
                            <div className="text-center py-4 text-green-400 font-semibold animate-in fade-in">
                                ✅ All matched correctly!
                            </div>
                        )}

                        <Button onClick={() => setActiveTab('fillblanks')} className="w-full gap-2">
                            Next: Fill in Blanks <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* FILL IN BLANKS TAB */}
                {activeTab === 'fillblanks' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h2 className="text-lg font-semibold">✏️ Fill in the Blanks</h2>

                        <div className="space-y-4">
                            {content.fillInBlanks.map((item, i) => (
                                <div key={item.id || i} className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                                    <p className="text-gray-200">{item.sentence.replace('___', '______')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.options.map((opt) => (
                                            <button
                                                key={opt}
                                                disabled={fillBlankSubmitted}
                                                onClick={() => setFillBlankAnswers(prev => ({ ...prev, [item.id || i]: opt }))}
                                                className={`
                                                    px-4 py-2 rounded-lg font-medium transition-all
                                                    ${fillBlankAnswers[item.id || i] === opt
                                                        ? fillBlankSubmitted
                                                            ? opt === item.correctWord
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-red-500 text-white'
                                                            : 'bg-indigo-500 text-white'
                                                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                    }
                                                `}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    {fillBlankSubmitted && (
                                        <p className={`text-sm ${fillBlankAnswers[item.id || i] === item.correctWord ? 'text-green-400' : 'text-red-400'}`}>
                                            {fillBlankAnswers[item.id || i] === item.correctWord ? '✓ Correct!' : `✗ Answer: ${item.correctWord}`}
                                        </p>
                                    )}
                                    {item.translation && <p className="text-xs text-gray-500">{item.translation}</p>}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            {!fillBlankSubmitted ? (
                                <Button onClick={() => { setFillBlankSubmitted(true); awardXP(10); }} className="flex-1">
                                    Check Answers
                                </Button>
                            ) : (
                                <Button onClick={() => setActiveTab('scramble')} className="flex-1 gap-2">
                                    Next: Scramble <ChevronRight className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* SCRAMBLE TAB */}
                {activeTab === 'scramble' && content.scramble && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h2 className="text-lg font-semibold">🔀 Unscramble the Sentence</h2>
                        <p className="text-sm text-gray-400">Tap words in the correct order.</p>

                        {/* Current order display */}
                        <div className="min-h-[60px] bg-gray-800/50 rounded-xl p-4 flex flex-wrap gap-2">
                            {scrambleOrder.filter(w => w.startsWith('SELECTED_')).map((w, i) => (
                                <span key={i} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg font-medium">
                                    {w.replace('SELECTED_', '')}
                                </span>
                            ))}
                            {scrambleOrder.filter(w => w.startsWith('SELECTED_')).length === 0 && (
                                <span className="text-gray-500">Tap words below...</span>
                            )}
                        </div>

                        {/* Available words */}
                        <div className="flex flex-wrap gap-2">
                            {scrambleOrder.filter(w => !w.startsWith('SELECTED_')).map((word, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setScrambleOrder(prev => prev.map(w => w === word ? `SELECTED_${word}` : w));
                                    }}
                                    className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg font-medium hover:bg-gray-600 transition"
                                >
                                    {word}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setScrambleOrder([...content.scramble.scrambledParts])}
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Reset
                            </Button>
                            <Button
                                onClick={() => {
                                    const userSentence = scrambleOrder
                                        .filter(w => w.startsWith('SELECTED_'))
                                        .map(w => w.replace('SELECTED_', ''))
                                        .join(' ');
                                    if (userSentence.toLowerCase() === content.scramble.sentence.toLowerCase()) {
                                        awardXP(15);
                                        setScrambleSubmitted(true);
                                    }
                                }}
                                className="flex-1"
                            >
                                Check Answer
                            </Button>
                        </div>

                        {scrambleSubmitted && (
                            <div className="text-center py-4 text-green-400 font-semibold animate-in fade-in">
                                ✅ Perfect! The sentence is: "{content.scramble.sentence}"
                            </div>
                        )}

                        <Button onClick={() => setActiveTab('quiz')} className="w-full gap-2">
                            Next: Quiz <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* QUIZ TAB */}
                {activeTab === 'quiz' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h2 className="text-lg font-semibold">📝 Quiz</h2>

                        {content.quiz.map((q, qIndex) => (
                            <div key={q.id || qIndex} className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                                <p className="font-medium text-gray-200">{q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, optIndex) => (
                                        <button
                                            key={optIndex}
                                            disabled={quizSubmitted}
                                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qIndex]: optIndex }))}
                                            className={`
                                                w-full p-3 rounded-xl text-left transition-all
                                                ${quizAnswers[qIndex] === optIndex
                                                    ? quizSubmitted
                                                        ? optIndex === q.correctIndex
                                                            ? 'bg-green-500/20 text-green-300 border border-green-500'
                                                            : 'bg-red-500/20 text-red-300 border border-red-500'
                                                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500'
                                                    : quizSubmitted && optIndex === q.correctIndex
                                                        ? 'bg-green-500/10 border border-green-500/50'
                                                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                                                }
                                            `}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {!quizSubmitted ? (
                            <Button onClick={() => { setQuizSubmitted(true); awardXP(20); }} className="w-full">
                                Submit Quiz
                            </Button>
                        ) : (
                            <Button onClick={() => setActiveTab('listening')} className="w-full gap-2">
                                Next: Listening <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}

                {/* LISTENING TAB */}
                {activeTab === 'listening' && content.listening && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h2 className="text-lg font-semibold">🎧 Listening Practice</h2>
                        <p className="text-sm text-gray-400">Listen and type what you hear.</p>

                        {content.listening.map((item, i) => (
                            <div key={item.id || i} className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => playTTS(item.phrase)}
                                        className="p-3 bg-indigo-500 rounded-full hover:bg-indigo-400 transition"
                                    >
                                        <Volume2 className="w-5 h-5 text-white" />
                                    </button>
                                    <span className="text-gray-400 text-sm">{item.hint}</span>
                                </div>
                                <input
                                    type="text"
                                    value={listeningAnswers[item.id || i] || ''}
                                    onChange={(e) => setListeningAnswers(prev => ({ ...prev, [item.id || i]: e.target.value }))}
                                    placeholder="Type what you hear..."
                                    disabled={listeningSubmitted}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {listeningSubmitted && (
                                    <p className={`text-sm ${listeningAnswers[item.id || i]?.toLowerCase().trim() === item.answer.toLowerCase() ? 'text-green-400' : 'text-red-400'}`}>
                                        {listeningAnswers[item.id || i]?.toLowerCase().trim() === item.answer.toLowerCase()
                                            ? '✓ Correct!'
                                            : `✗ Answer: "${item.answer}"`
                                        }
                                    </p>
                                )}
                            </div>
                        ))}

                        {!listeningSubmitted ? (
                            <Button onClick={() => { setListeningSubmitted(true); awardXP(15); }} className="w-full">
                                Check Answers
                            </Button>
                        ) : (
                            <Button onClick={() => setActiveTab('pronunciation')} className="w-full gap-2">
                                Final: Pronunciation <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}

                {/* PRONUNCIATION TAB */}
                {activeTab === 'pronunciation' && (
                    <Card className="space-y-6 animate-in fade-in duration-300">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <Mic className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">Pronunciation Practice</h2>
                            <p className="text-gray-400">Record yourself saying:</p>
                        </div>

                        {/* Target Phrase */}
                        <div className="bg-gray-800/50 rounded-xl p-4 text-center space-y-3">
                            <p className="text-xl font-medium text-indigo-300">
                                "{content.conversation.turns[0]?.text || 'Hello, how are you?'}"
                            </p>
                            <button
                                onClick={() => playTTS(content.conversation.turns[0]?.text || 'Hello')}
                                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition"
                            >
                                <Volume2 className="w-4 h-4" /> Listen
                            </button>
                        </div>

                        {/* Recorder */}
                        <div className="flex justify-center">
                            <AudioRecorder onRecordingComplete={handlePronunciationTest} />
                        </div>

                        {isEvaluatingPronunciation && (
                            <div className="text-center py-4">
                                <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin" />
                                <p className="text-gray-400 mt-2">Analyzing...</p>
                            </div>
                        )}

                        {pronunciationResult && (
                            <div className="space-y-4 animate-in fade-in">
                                {/* Score */}
                                <div className="text-center">
                                    <div className={`
                                        inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold
                                        ${pronunciationResult.score >= 80 ? 'bg-green-500/20 text-green-400' :
                                            pronunciationResult.score >= 50 ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-red-500/20 text-red-400'}
                                    `}>
                                        {pronunciationResult.score}%
                                    </div>
                                    <p className="mt-2 text-gray-300">{pronunciationResult.feedback}</p>
                                </div>

                                {/* Word Analysis */}
                                {pronunciationResult.words && pronunciationResult.words.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {pronunciationResult.words.map((w: any, i: number) => (
                                            <span
                                                key={i}
                                                className={`px-3 py-1.5 rounded-lg font-medium ${w.isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                                    }`}
                                            >
                                                {w.word}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Button onClick={handleComplete} className="w-full gap-2" size="lg">
                            <Award className="w-5 h-5" /> Complete Lesson
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Lesson;
