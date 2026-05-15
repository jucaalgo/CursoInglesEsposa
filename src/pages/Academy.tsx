import React, { useState } from 'react';
import { useCourse } from '../hooks/useCourse';
import Button from '../components/Button';
import { Book, CheckCircle, Loader2, Sparkles, ArrowRight, Lock, Trophy, Zap, Star, Target, Search, X, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LEVEL_CONFIGS: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    'A1': { color: '#22c55e', icon: Zap, label: 'Beginner' },
    'A2': { color: '#3b82f6', icon: Book, label: 'Elementary' },
    'B1': { color: '#8b5cf6', icon: Star, label: 'Intermediate' },
    'B2': { color: '#f59e0b', icon: Target, label: 'Upper Int.' },
    'C1': { color: '#ef4444', icon: Trophy, label: 'Advanced' },
    'C2': { color: '#ec4899', icon: Sparkles, label: 'Mastery' },
};

const getLevelForIndex = (index: number, total: number): string => {
    const ratio = index / total;
    if (ratio < 0.17) return 'A1';
    if (ratio < 0.33) return 'A2';
    if (ratio < 0.50) return 'B1';
    if (ratio < 0.67) return 'B2';
    if (ratio < 0.84) return 'C1';
    return 'C2';
};

const Academy: React.FC = () => {
    const { syllabus, loading, generating, completedLessons, generateNewSyllabus } = useCourse();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'path'>('path');
    const [searchQuery, setSearchQuery] = useState('');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <p className="font-bold uppercase tracking-widest text-xs" style={{ color: 'var(--text-muted)' }}>Curating your path...</p>
            </div>
        );
    }

    if (!syllabus || syllabus.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in-scale">
                <div className="relative">
                    <div className="w-32 h-32 rounded-[2rem] flex items-center justify-center"
                         style={{ background: 'var(--accent-primary-muted)', border: '2px solid var(--accent-primary)' }}>
                        <Sparkles className="w-16 h-16" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <Trophy className="absolute -bottom-4 -right-4 w-12 h-12 p-2 rounded-2xl shadow-xl"
                            style={{ background: 'var(--bg-primary)', border: '2px solid var(--border-default)', color: 'var(--warning)' }} />
                </div>
                <div className="space-y-4 max-w-md">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase" style={{ color: 'var(--text-primary)' }}>
                        YOUR JOURNEY AWAITS
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }} className="font-medium leading-relaxed">
                        Our AI expert will design a personalized 50-topic curriculum based on your unique interests and professional goals.
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={generateNewSyllabus}
                    disabled={generating}
                    className="h-16 px-10 text-xl rounded-2xl group"
                    style={{ background: 'var(--accent-primary)', boxShadow: 'var(--shadow-accent)' }}
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

    // Group topics by level
    const levelGroups: Record<string, { topics: string[]; completed: number }> = {};
    syllabus.forEach((topic, index) => {
        const level = getLevelForIndex(index, syllabus.length);
        if (!levelGroups[level]) levelGroups[level] = { topics: [], completed: 0 };
        levelGroups[level].topics.push(topic);
        if (completedLessons.includes(topic)) levelGroups[level].completed++;
    });

    // Continue where you left off: find the next lesson after the last completed one
    const hasCompleted = completedLessons.length > 0;
    const hasIncomplete = completedLessons.length < syllabus.length;
    const continueLesson = (() => {
        if (!hasCompleted || !hasIncomplete) return null;
        const lastCompletedIndex = Math.max(
            ...completedLessons.map(t => syllabus.indexOf(t)).filter(i => i !== -1)
        );
        const nextIndex = lastCompletedIndex + 1;
        if (nextIndex < syllabus.length) {
            const topic = syllabus[nextIndex];
            const level = getLevelForIndex(nextIndex, syllabus.length);
            return { topic, level, index: nextIndex };
        }
        return null;
    })();

    // Filter syllabus by search query
    const filteredSyllabus = searchQuery.trim()
        ? syllabus
            .map((topic, index) => ({ topic, index }))
            .filter(({ topic }) => topic.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        : syllabus.map((topic, index) => ({ topic, index }));

    const noResults = searchQuery.trim() && filteredSyllabus.length === 0;

    return (
        <div className="space-y-8 pb-24">
            {/* Continue Where You Left Off */}
            {continueLesson && (
                <div
                    className="flex items-center gap-4 p-4 rounded-2xl animate-in-down cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                    style={{
                        background: 'var(--bg-card)',
                        border: '2px solid var(--accent-primary)',
                        boxShadow: 'var(--shadow-accent)',
                    }}
                    onClick={() => navigate(`/academy/lesson/${encodeURIComponent(continueLesson.topic)}`)}
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                        <Play className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                  style={{ background: (LEVEL_CONFIGS[continueLesson.level] || LEVEL_CONFIGS['A1']).color + '20', color: (LEVEL_CONFIGS[continueLesson.level] || LEVEL_CONFIGS['A1']).color }}>
                                {continueLesson.level}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                                Continue
                            </span>
                        </div>
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {continueLesson.topic}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        className="shrink-0 rounded-xl"
                        style={{ background: 'var(--accent-primary)', color: '#fff' }}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            navigate(`/academy/lesson/${encodeURIComponent(continueLesson.topic)}`);
                        }}
                    >
                        Resume
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                </div>
            )}

            {/* Header */}
            <header className="space-y-6 animate-in-down">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase">
                            <span style={{ color: 'var(--text-primary)' }}>ACADEMY </span>
                            <span style={{ color: 'var(--accent-primary)' }}>ROADMAP</span>
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                            {completedLessons.length} / {syllabus.length} Milestones Achieved
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View toggle */}
                        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                            <button
                                onClick={() => setViewMode('path')}
                                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
                                style={{
                                    background: viewMode === 'path' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                    color: viewMode === 'path' ? 'white' : 'var(--text-muted)',
                                }}
                            >
                                Path
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
                                style={{
                                    background: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                    color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
                                }}
                            >
                                Grid
                            </button>
                        </div>
                        <div className="px-6 py-3 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                            <span className="text-3xl font-black italic" style={{ color: 'var(--accent-primary)' }}>{progressPercent}%</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                            width: `${progressPercent}%`,
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                            boxShadow: '0 0 12px var(--accent-primary-muted)',
                        }}
                    />
                </div>
            </header>

            {/* Topic Search */}
            <div className="relative animate-in-down">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl text-sm font-medium outline-none transition-all duration-200"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                    }}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* No results message */}
            {noResults && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <Search className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        No topics match your search
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Try a different keyword or clear the search.
                    </p>
                </div>
            )}

            {/* Level Progress Cards */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 stagger-children">
                {Object.entries(levelGroups).map(([level, data]) => {
                    const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS['A1'];
                    const levelProgress = Math.round((data.completed / data.topics.length) * 100);
                    const LevelIcon = config.icon;
                    return (
                        <div
                            key={level}
                            className="p-3 rounded-2xl text-center transition-all duration-300 hover:scale-[1.02]"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-default)',
                            }}
                        >
                            <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center"
                                 style={{ background: config.color + '20', color: config.color }}>
                                <LevelIcon className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{level}</p>
                            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{config.label}</p>
                            <div className="w-full h-1 rounded-full mt-2" style={{ background: 'var(--bg-tertiary)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${levelProgress}%`, background: config.color }} />
                            </div>
                            <p className="text-[9px] mt-1 font-bold" style={{ color: 'var(--text-muted)' }}>
                                {data.completed}/{data.topics.length}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Topics */}
            {!noResults && viewMode === 'path' ? (
                <div className="relative space-y-3">
                    {/* Path line */}
                    <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5"
                         style={{ background: 'var(--border-default)' }} />
                    {filteredSyllabus.map(({ topic, index }) => {
                        const isCompleted = completedLessons.includes(topic);
                        const isNext = !isCompleted && (index === 0 || completedLessons.includes(syllabus[index - 1]));
                        const isLocked = !isCompleted && !isNext;
                        const level = getLevelForIndex(index, syllabus.length);
                        const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS['A1'];

                        if (isLocked && index > 2 && !isCompleted) return null; // Show only near-unlock topics

                        return (
                            <div key={index} className="flex items-center gap-4 animate-in">
                                {/* Path dot */}
                                <div className="relative z-10 shrink-0">
                                    <div
                                        className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 ${isCompleted ? 'scale-100' : isNext ? 'scale-110 animate-pulse-glow' : 'scale-90'}`}
                                        style={{
                                            background: isCompleted ? config.color : isNext ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                            color: isCompleted ? '#000' : isNext ? '#fff' : 'var(--text-muted)',
                                            boxShadow: isNext ? '0 0 20px var(--accent-primary-muted)' : 'none',
                                            border: isNext ? '2px solid var(--accent-primary)' : 'none',
                                        }}
                                    >
                                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : (index + 1).toString().padStart(2, '0')}
                                    </div>
                                </div>

                                {/* Topic card */}
                                <div
                                    className={`flex-1 p-4 rounded-2xl transition-all duration-300 cursor-pointer ${isNext ? 'card-hover' : ''}`}
                                    style={{
                                        background: isCompleted ? config.color + '08' : isNext ? 'var(--bg-card)' : 'var(--bg-tertiary)',
                                        border: `1px solid ${isCompleted ? config.color + '30' : isNext ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                                        opacity: isLocked ? 0.4 : 1,
                                    }}
                                    onClick={() => !isLocked && navigate(`/academy/lesson/${encodeURIComponent(topic)}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                                      style={{ background: config.color + '20', color: config.color }}>
                                                    {level}
                                                </span>
                                                <h3 className="text-sm md:text-base font-bold leading-tight" style={{ color: isNext ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                    {topic}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isCompleted && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: config.color }}>
                                                    Completed
                                                </span>
                                            )}
                                            {isNext && (
                                                <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                                            )}
                                            {isLocked && (
                                                <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Show locked placeholder */}
                    {!searchQuery.trim() && syllabus.length > 3 && (
                        <div className="flex items-center gap-4 opacity-40">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                                <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <div className="flex-1 p-4 rounded-2xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    + {syllabus.length - completedLessons.length - 1} more topics to unlock
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : !noResults ? (
                /* Grid view */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                    {filteredSyllabus.map(({ topic, index }) => {
                        const isCompleted = completedLessons.includes(topic);
                        const isNext = !isCompleted && (index === 0 || completedLessons.includes(syllabus[index - 1]));
                        const isLocked = !isCompleted && !isNext;
                        const level = getLevelForIndex(index, syllabus.length);
                        const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS['A1'];

                        return (
                            <div
                                key={index}
                                className={`p-5 rounded-2xl transition-all duration-300 ${isNext ? 'card-hover card-glow cursor-pointer' : ''}`}
                                style={{
                                    background: isCompleted ? config.color + '08' : isNext ? 'var(--bg-card)' : 'var(--bg-tertiary)',
                                    border: `2px solid ${isCompleted ? config.color + '30' : isNext ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                                    opacity: isLocked ? 0.35 : 1,
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    boxShadow: isNext ? 'var(--shadow-accent)' : 'none',
                                }}
                                onClick={() => !isLocked && navigate(`/academy/lesson/${encodeURIComponent(topic)}`)}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                                  style={{ background: config.color + '20', color: config.color }}>
                                                {level}
                                            </span>
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${isNext ? 'animate-pulse-glow' : ''}`}
                                                 style={{
                                                     background: isCompleted ? config.color : isNext ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                                     color: isCompleted ? '#000' : isNext ? '#fff' : 'var(--text-muted)',
                                                 }}>
                                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : (index + 1).toString().padStart(2, '0')}
                                            </div>
                                        </div>
                                        {isNext && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)' }} />}
                                    </div>
                                    <h3 className="text-sm font-bold leading-tight" style={{ color: isNext ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                        {topic}
                                    </h3>
                                </div>
                                <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-default)' }}>
                                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                        {isCompleted ? 'Completed' : isNext ? 'Next Milestone' : 'Locked'}
                                    </span>
                                    {isNext && <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

export default Academy;