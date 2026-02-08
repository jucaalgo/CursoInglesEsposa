import React from 'react';
import { useCourse } from '../hooks/useCourse';
import Button from '../components/Button';
import Card from '../components/Card';
import { Book, CheckCircle, Loader2, Sparkles, ArrowRight, Lock, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Academy: React.FC = () => {
    const { syllabus, loading, generating, completedLessons, generateNewSyllabus } = useCourse();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Curating your path...</p>
            </div>
        );
    }

    if (!syllabus || syllabus.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in zoom-in duration-500">
                <div className="relative">
                    <div className="w-32 h-32 bg-indigo-500/10 rounded-[3rem] flex items-center justify-center border-2 border-indigo-500/20">
                        <Sparkles className="w-16 h-16 text-indigo-500" />
                    </div>
                    <Trophy className="absolute -bottom-4 -right-4 w-12 h-12 text-amber-500 bg-gray-950 p-2 rounded-2xl border-2 border-gray-900 shadow-xl" />
                </div>
                <div className="space-y-4 max-w-md">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">YOUR JOURNEY AWAITS</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Our AI expert will design a personalized 50-topic curriculum based on your unique interests and professional goals.
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={generateNewSyllabus}
                    disabled={generating}
                    className="h-16 px-10 text-xl rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 group"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin mr-3" />
                            DESIGNING ROADMAP...
                        </>
                    ) : (
                        <>
                            GENERATE MY COURSE
                            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        );
    }

    const progressPercent = Math.round((completedLessons.length / syllabus.length) * 100);

    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase">
                            ACADEMY <span className="text-indigo-500">ROADMAP</span>
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                            {completedLessons.length} / {syllabus.length} Milestones Achieved
                        </p>
                    </div>
                    <div className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-2xl px-6 py-3 flex items-center gap-4">
                        <span className="text-3xl font-black italic text-indigo-500">{progressPercent}%</span>
                        <div className="h-10 w-[2px] bg-gray-800" />
                        <div className="text-[10px] font-black uppercase text-gray-500 leading-tight">
                            Current<br />Progress
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-4 bg-gray-900 rounded-full overflow-hidden border-2 border-gray-800 p-1">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/20"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {syllabus.map((topic, index) => {
                    const isCompleted = completedLessons.includes(topic);
                    const isNext = !isCompleted && (index === 0 || completedLessons.includes(syllabus[index - 1]));
                    const isLocked = !isCompleted && !isNext;

                    return (
                        <Card
                            key={index}
                            onClick={() => !isLocked && navigate(`/academy/lesson/${encodeURIComponent(topic)}`)}
                            className={`p-6 border-2 transition-all cursor-pointer relative overflow-hidden group rounded-3xl h-full flex flex-col justify-between
                                ${isCompleted
                                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                    : isNext
                                        ? 'bg-indigo-600/5 border-indigo-500/60 shadow-xl shadow-indigo-500/10 hover:scale-[1.02]'
                                        : 'bg-gray-950/50 border-gray-900 opacity-40 grayscale cursor-not-allowed'
                                }
                            `}
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className={`
                                        w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm
                                        ${isCompleted ? 'bg-emerald-500 text-black' : isNext ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500'}
                                    `}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>
                                    {isCompleted ? (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        </div>
                                    ) : isLocked ? (
                                        <Lock className="w-4 h-4 text-gray-700" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                                    )}
                                </div>
                                <h3 className={`text-xl font-bold leading-tight ${isNext ? 'text-white' : 'text-gray-400'}`}>
                                    {topic}
                                </h3>
                            </div>

                            <div className="mt-8 pt-4 border-t border-gray-800/50 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    {isCompleted ? 'Completed' : isNext ? 'Next Milestone' : 'Locked'}
                                </span>
                                {isNext && <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />}
                            </div>

                            {isNext && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Academy;
