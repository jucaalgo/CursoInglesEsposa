import React from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import Button from '../components/Button';
import { ArrowRight, BookOpen, Trophy, Flame, Check, Loader2, Zap, Star, Target, Sparkles } from 'lucide-react';
import Landing from './Landing';

// ── Skeleton Components ────────────────────────────────────────────────
const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse rounded-3xl ${className}`}
         style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="p-6 space-y-4">
            <div className="h-4 w-1/3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="h-8 w-2/3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="h-4 w-1/2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
        </div>
    </div>
);

const SkeletonCircle: React.FC = () => (
    <div className="w-28 h-28 rounded-full animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
);

const SkeletonRow: React.FC = () => (
    <div className="flex items-center gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
        ))}
    </div>
);

const HomeSkeleton: React.FC = () => (
    <div className="space-y-8 pb-24">
        <header className="text-center space-y-3">
            <div className="inline-block h-6 w-24 rounded-full animate-pulse mx-auto" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="h-12 w-64 rounded-lg animate-pulse mx-auto" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="h-4 w-40 rounded-lg animate-pulse mx-auto" style={{ background: 'var(--bg-tertiary)' }} />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard className="col-span-1">
                <div className="flex items-center gap-6 p-6">
                    <SkeletonCircle />
                    <div className="flex-1 space-y-3">
                        <div className="h-5 w-24 rounded-lg animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                        <div className="h-4 w-32 rounded-lg animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                    </div>
                </div>
            </SkeletonCard>
            <SkeletonCard>
                <div className="space-y-4 p-6">
                    <div className="h-5 w-32 rounded-lg animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                    <SkeletonRow />
                </div>
            </SkeletonCard>
            <SkeletonCard className="hidden lg:block" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    </div>
);

const DailyGoalTracker = ({ current, goal }: { current: number, goal: number }) => {
    const percentage = Math.min((current / (goal || 50)) * 100, 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const isComplete = percentage >= 100;

    return (
        <div
            className="flex items-center gap-6 p-6 overflow-hidden relative group rounded-3xl card-hover card-glow"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
            }}
        >
            <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle
                        cx="48" cy="48" r={radius}
                        fill="none"
                        stroke="var(--bg-tertiary)"
                        strokeWidth="8"
                    />
                    <circle
                        cx="48" cy="48" r={radius}
                        fill="none"
                        stroke={isComplete ? 'var(--success)' : 'var(--accent-primary)'}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black" style={{ color: isComplete ? 'var(--success)' : 'var(--accent-primary)' }}>
                        {Math.round(percentage)}%
                    </span>
                    {isComplete && <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />}
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Daily Goal</h3>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{current || 0}</span>
                    {' / '}{goal || 50} XP earned today
                </p>
                {isComplete ? (
                    <div className="flex items-center gap-1 text-xs font-bold mt-2 animate-float" style={{ color: 'var(--success)' }}>
                        <Trophy className="w-3.5 h-3.5" /> Goal Reached!
                    </div>
                ) : (
                    <p className="text-xs font-medium mt-2" style={{ color: 'var(--accent-primary)' }}>
                        {goal - current > 0 ? `Only ${goal - current} XP left!` : 'Goal Reached!'}
                    </p>
                )}
            </div>
        </div>
    );
};

const StreakWidget = ({ streak, history }: { streak: number, history?: Record<string, number> }) => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date();

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        return {
            dayName: days[d.getDay() === 0 ? 6 : d.getDay() - 1],
            dateStr: d.toISOString().split('T')[0],
            isToday: i === 6
        };
    });

    return (
        <div
            className="p-6 h-full flex flex-col justify-between rounded-3xl card-hover"
            style={{
                background: 'linear-gradient(135deg, var(--bg-secondary), var(--warning-muted, rgba(245, 158, 11, 0.1)))',
                border: '1px solid var(--border-default)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Flame className="w-6 h-6 animate-streak-flame" style={{ color: 'var(--warning)' }} />
                        {streak} Day Streak
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Keep the fire burning!</p>
                </div>
            </div>

            <div className="flex justify-between items-center gap-2">
                {last7Days.map((dayObj, i) => {
                    const xpEarned = history?.[dayObj.dateStr] || 0;
                    const isActive = xpEarned > 0;
                    return (
                        <div key={i} className="flex flex-col items-center gap-2 stagger-children">
                            <div
                                className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold
                                    transition-all duration-500
                                    ${isActive ? 'scale-110' : ''}
                                `}
                                style={{
                                    background: isActive ? 'var(--warning)' : 'var(--bg-tertiary)',
                                    color: isActive ? '#1a0a07' : 'var(--text-muted)',
                                    boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                                    border: dayObj.isToday ? '2px solid var(--accent-primary)' : 'none',
                                }}
                            >
                                {isActive ? <Check className="w-4 h-4" /> : dayObj.dayName}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
    <div
        className="p-4 rounded-2xl card-hover card-glow"
        style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
        }}
    >
        <div className="flex items-center gap-3">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: color + '20', color }}
            >
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
        </div>
    </div>
);

const Home: React.FC = () => {
    const { profile: activeStudent, loading } = useUserProfile();

    if (loading) {
        return <HomeSkeleton />;
    }

    if (!activeStudent) return <Landing />;

    const features = [
        { title: "Smart Practice", desc: "Speak naturally with AI corrections.", icon: Zap, route: "/practice", color: 'var(--accent-primary)' },
        { title: "Academy", desc: "Structured lessons tailored to your level.", icon: BookOpen, route: "/academy", color: 'var(--accent-secondary)' },
        { title: "Leaderboard", desc: "See how you rank against others.", icon: Trophy, route: "/leaderboard", color: 'var(--warning)' },
    ];

    return (
        <div className="space-y-8 pb-24">
            <div className="space-y-8">
                {/* Welcome Header */}
                <header className="text-center space-y-3 animate-in-down">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                         style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {activeStudent.current_level || 'A2'} Level
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter">
                        <span style={{ color: 'var(--text-primary)' }}>HELLO, </span>
                        <span style={{ color: 'var(--accent-primary)' }}>{activeStudent.name?.toUpperCase()}</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }} className="font-bold uppercase tracking-widest text-xs">
                        Ready for your daily challenge?
                    </p>
                </header>

                {/* Primary Progress & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                    <DailyGoalTracker
                        current={activeStudent.daily_xp || 0}
                        goal={activeStudent.daily_goal || 50}
                    />
                    <StreakWidget
                        streak={activeStudent.streak_count || 0}
                        history={activeStudent.history}
                    />

                    <Link to="/leaderboard" className="hidden lg:block">
                        <div
                            className="p-6 h-full flex flex-col justify-between rounded-3xl card-hover card-glow"
                            style={{
                                background: 'linear-gradient(135deg, var(--bg-secondary), var(--warning-muted, rgba(245, 158, 11, 0.08)))',
                                border: '1px solid var(--border-default)',
                            }}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Leaderboard</h3>
                                    <Trophy className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>See how you rank against others.</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
                                View Rankings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon={Zap} label="Total XP" value={activeStudent.xp_total || 0} color="var(--accent-primary)" />
                    <StatCard icon={Flame} label="Streak" value={`${activeStudent.streak_count || 0}d`} color="var(--warning)" />
                    <StatCard icon={Target} label="Daily" value={`${activeStudent.daily_xp || 0}/${activeStudent.daily_goal || 50}`} color="var(--success)" />
                    <StatCard icon={Star} label="Level" value={activeStudent.current_level || 'A2'} color="var(--accent-secondary)" />
                </div>

                {/* Quick Start Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center animate-in">
                    <Link to="/practice" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full h-16 px-10 text-xl rounded-2xl shadow-2xl group"
                                style={{ background: 'var(--accent-primary)', boxShadow: 'var(--shadow-accent)' }}>
                            Start Practice <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link to="/academy" className="w-full sm:w-auto">
                        <Button variant="secondary" size="lg" className="w-full h-16 px-10 text-xl rounded-2xl"
                                style={{ border: '2px solid var(--border-default)' }}>
                            <BookOpen className="mr-2" /> Academy
                        </Button>
                    </Link>
                </div>

                {/* Features Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
                    {features.map((f, i) => (
                        <Link key={i} to={f.route}
                              className="p-6 rounded-3xl card-hover card-glow stagger-children"
                              style={{
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-default)',
                              }}
                        >
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                                style={{ background: `${f.color}15`, color: f.color }}
                            >
                                <f.icon className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h4>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                        </Link>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default Home;