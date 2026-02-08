import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateInteractiveContent, generateSpeech, playRawAudio } from '../services/gemini';
import { useUserProfile } from '../hooks/useUserProfile';
import { useCourse } from '../hooks/useCourse';
import { InteractiveContent } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, Headphones, HelpCircle, MessageSquare, Play, RefreshCw, Volume2 } from 'lucide-react';

const Lesson: React.FC = () => {
    const { topic } = useParams<{ topic: string }>();
    const navigate = useNavigate();
    const { profile } = useUserProfile();
    const { markLessonComplete } = useCourse();

    const [content, setContent] = useState<InteractiveContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'scenario' | 'vocab' | 'quiz' | 'roleplay'>('scenario');
    // Quiz state
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    useEffect(() => {
        if (topic && profile) {
            loadContent();
        }
    }, [topic, profile?.username]);

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
        if (topic) {
            await markLessonComplete(topic);
            navigate('/academy');
        }
    };

    const playTTS = async (text: string) => {
        try {
            const audio = await generateSpeech(text);
            await playRawAudio(audio);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="animate-spin text-indigo-500">
                    <RefreshCw className="w-12 h-12" />
                </div>
                <p className="text-gray-400 animate-pulse">Designing your lesson...</p>
            </div>
        );
    }

    if (!content) return <div>Error loading lesson.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <header className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate('/academy')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h1 className="text-2xl font-bold">{topic}</h1>
            </header>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 border-b border-gray-800">
                <TabButton
                    active={activeTab === 'scenario'}
                    onClick={() => setActiveTab('scenario')}
                    icon={BookOpen}
                    label="Story"
                />
                <TabButton
                    active={activeTab === 'vocab'}
                    onClick={() => setActiveTab('vocab')}
                    icon={HelpCircle}
                    label="Vocabulary"
                />
                <TabButton
                    active={activeTab === 'quiz'}
                    onClick={() => setActiveTab('quiz')}
                    icon={CheckCircle}
                    label="Quiz"
                />
                <TabButton
                    active={activeTab === 'roleplay'}
                    onClick={() => setActiveTab('roleplay')}
                    icon={MessageSquare}
                    label="Roleplay"
                />
            </div>

            {/* Content Area */}
            <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">

                {activeTab === 'scenario' && (
                    <Card className="p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Context</h2>
                            <p className="text-gray-400 italic">{content.scenario.context}</p>
                        </div>
                        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 space-y-4">
                            {content.scenario.dialogueScript.split('\n').map((line, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                                        {line.split(':')[0].trim().charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-gray-200">{line.split(':').slice(1).join(':').trim()}</p>
                                    </div>
                                    <button
                                        onClick={() => playTTS(line.split(':').slice(1).join(':').trim())}
                                        className="text-gray-600 hover:text-indigo-400 transition-colors ml-auto"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setActiveTab('vocab')}>
                                Next: Vocabulary <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>
                )}

                {activeTab === 'vocab' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.vocabulary.map((item, i) => (
                            <Card key={i} className="p-4 hover:border-indigo-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-indigo-400">{item.term}</h3>
                                    <button
                                        onClick={() => playTTS(item.term)}
                                        className="text-gray-500 hover:text-indigo-400"
                                    >
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-gray-300 text-sm">{item.definition}</p>
                            </Card>
                        ))}
                        <div className="col-span-full flex justify-end mt-4">
                            <Button onClick={() => setActiveTab('quiz')}>
                                Next: Quiz <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'quiz' && (
                    <Card className="p-6 space-y-8">
                        {content.quiz.map((q, i) => (
                            <div key={i} className="space-y-3">
                                <h3 className="font-medium text-lg text-white">
                                    {i + 1}. {q.question}
                                </h3>
                                <div className="space-y-2">
                                    {q.options.map((option, optIndex) => {
                                        const isSelected = quizAnswers[i] === optIndex;
                                        const isCorrect = q.correctIndex === optIndex;
                                        let btnClass = "w-full justify-start text-left p-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition-all";

                                        if (quizSubmitted) {
                                            if (isCorrect) btnClass = "w-full justify-start text-left p-3 rounded-lg border border-green-500 bg-green-500/10 text-green-100";
                                            else if (isSelected) btnClass = "w-full justify-start text-left p-3 rounded-lg border border-red-500 bg-red-500/10 text-red-100";
                                            else btnClass = "w-full justify-start text-left p-3 rounded-lg border border-gray-800 opacity-50";
                                        } else if (isSelected) {
                                            btnClass = "w-full justify-start text-left p-3 rounded-lg border border-indigo-500 bg-indigo-500/10 text-indigo-100";
                                        }

                                        return (
                                            <button
                                                key={optIndex}
                                                onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [i]: optIndex }))}
                                                className={btnClass}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
                            {!quizSubmitted ? (
                                <Button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length < content.quiz.length}>
                                    Check Answers
                                </Button>
                            ) : (
                                <Button onClick={() => setActiveTab('roleplay')}>
                                    Next: Roleplay <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </Card>
                )}

                {activeTab === 'roleplay' && (
                    <Card className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                            <Headphones className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold">Ready to Practice?</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            Let's put your new knowledge to the test. Conversation Goal:
                            <span className="block text-white font-medium mt-2">"{content.conversation.goal}"</span>
                        </p>
                        <div className="flex justify-center gap-4 pt-4">
                            <Button variant="secondary" onClick={() => navigate('/practice')}>
                                Go to Chat Practice
                            </Button>
                            <Button onClick={handleComplete} className="gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Mark Lesson Complete
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors whitespace-nowrap
            ${active
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
            }
        `}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

export default Lesson;
