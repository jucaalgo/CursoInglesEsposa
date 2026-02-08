import React from 'react';
import { useCourse } from '../hooks/useCourse';
import Button from '../components/Button';
import Card from '../components/Card';
import { Book, CheckCircle, Circle, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Academy: React.FC = () => {
    const { syllabus, loading, generating, completedLessons, generateNewSyllabus } = useCourse();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!syllabus || syllabus.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="p-4 bg-indigo-500/10 rounded-full">
                    <Sparkles className="w-12 h-12 text-indigo-500" />
                </div>
                <h2 className="text-3xl font-bold">Your Personalized Journey Awaits</h2>
                <p className="text-gray-400 max-w-md">
                    Our AI will design a 50-topic curriculum tailored specifically to your level and interests.
                </p>
                <Button
                    size="lg"
                    onClick={generateNewSyllabus}
                    disabled={generating}
                    className="group"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Designing Curriculum...
                        </>
                    ) : (
                        <>
                            Generate My Course
                            <Sparkles className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Academy Roadmap
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {completedLessons.length} / {syllabus.length} Topics Completed
                    </p>
                </div>
                {/* Progress Bar */}
                <div className="w-full md:w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                        style={{ width: `${(completedLessons.length / syllabus.length) * 100}%` }}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {syllabus.map((topic, index) => {
                    const isCompleted = completedLessons.includes(topic);
                    const isNext = !isCompleted && (index === 0 || completedLessons.includes(syllabus[index - 1]));
                    const isLocked = !isCompleted && !isNext;

                    return (
                        <div
                            key={index}
                            onClick={() => !isLocked && navigate(`/academy/lesson/${encodeURIComponent(topic)}`)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group
                                ${isCompleted
                                    ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                                    : isNext
                                        ? 'bg-indigo-600/10 border-indigo-500/50 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10'
                                        : 'bg-gray-900/30 border-gray-800 opacity-50 cursor-not-allowed'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                        ${isCompleted ? 'bg-green-500/20 text-green-400' : isNext ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-500'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <h3 className={`font-medium line-clamp-2 ${isNext ? 'text-white' : 'text-gray-300'}`}>
                                        {topic}
                                    </h3>
                                </div>
                                {isCompleted && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                                {isLocked && <Book className="w-4 h-4 text-gray-600 shrink-0" />}
                            </div>

                            {isNext && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Academy;
