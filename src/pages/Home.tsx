import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudents } from '../context/StudentContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { ArrowRight, BookOpen, Plus, User, Trophy, Flame, Check, Loader2 } from 'lucide-react';

const DailyGoalTracker = ({ current, goal }: { current: number, goal: number }) => {
    const percentage = Math.min((current / (goal || 50)) * 100, 100);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <Card className="flex items-center gap-6 p-6 overflow-hidden relative group border-indigo-500/20 bg-gradient-to-br from-gray-900 to-indigo-950/20">
            <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-800" />
                    <circle
                        cx="48" cy="48" r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="text-indigo-500 transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">{Math.round(percentage)}%</span>
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-lg font-bold">Daily Goal</h3>
                <p className="text-gray-400 text-sm">
                    <span className="text-white font-medium">{current || 0}</span> / {goal || 50} XP earned today
                </p>
                {percentage >= 100 ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-2 animate-bounce">
                        <Check className="w-3 h-3" /> Goal Reached!
                    </div>
                ) : (
                    <p className="text-xs text-indigo-400 font-medium mt-2">
                        {goal - current > 0 ? `Only ${goal - current} XP left to hit your goal!` : 'Goal Reached!'}
                    </p>
                )}
            </div>
            <Trophy className={`absolute right-4 top-4 w-12 h-12 text-indigo-500/10 group-hover:scale-110 transition-transform ${percentage >= 100 ? 'text-amber-500/20' : ''}`} />
        </Card>
    );
};

const StreakWidget = ({ streak, history }: { streak: number, history?: Record<string, number> }) => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date();

    // Generate last 7 days dates
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
        <Card className="p-6 h-full flex flex-col justify-between border-orange-500/20 bg-gradient-to-br from-gray-900 to-orange-950/10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
                        {streak} Day Streak
                    </h3>
                    <p className="text-sm text-gray-400">Keep the fire burning!</p>
                </div>
            </div>

            <div className="flex justify-between items-center gap-2">
                {last7Days.map((dayObj, i) => {
                    // Check if XP was earned on this date
                    const xpEarned = history?.[dayObj.dateStr] || 0;
                    const isActive = xpEarned > 0;

                    return (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
                                ${isActive
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110'
                                    : 'bg-gray-800 text-gray-600'
                                }
                                ${dayObj.isToday ? 'border-2 border-white/20' : ''}
                            `}>
                                {isActive ? <Check className="w-4 h-4" /> : dayObj.dayName}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const Home: React.FC = () => {
    const { students, activeStudent, isLoading, selectStudent, addStudent, deleteStudent } = useStudents();
    const [showAddModal, setShowAddModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
    const [newStudentName, setNewStudentName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddStudent = async () => {
        if (!newStudentName.trim()) return;
        setIsAdding(true);
        await addStudent(newStudentName.trim());
        setNewStudentName('');
        setShowAddModal(false);
        setIsAdding(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-gray-400">Loading students...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24">
            {/* Student Selector Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-200">Students</h2>
                    <Button size="sm" variant="secondary" onClick={() => setShowAddModal(true)} className="gap-1">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Student</span>
                    </Button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 scrollbar-hide">
                    {students.length === 0 ? (
                        <div className="w-full text-center py-12 bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-800">
                            <User className="w-16 h-16 mx-auto text-gray-700 mb-4" />
                            <p className="text-gray-500">No students yet.</p>
                            <Button onClick={() => setShowAddModal(true)} className="mt-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Student
                            </Button>
                        </div>
                    ) : (
                        students.map((student) => (
                            <button
                                key={student.username}
                                onClick={() => selectStudent(student.username)}
                                className={`
                                    flex-shrink-0 w-[280px] md:w-full snap-center
                                    p-5 rounded-3xl border-2 transition-all duration-200
                                    text-left active:scale-[0.98]
                                    ${activeStudent?.username === student.username
                                        ? 'bg-indigo-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10'
                                        : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                                    }
                                `}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold
                                            ${activeStudent?.username === student.username ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}
                                        `}>
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{student.name}</h3>
                                            <span className="text-xs opacity-50 font-medium">Level {student.current_level}</span>
                                        </div>
                                    </div>
                                    {activeStudent?.username === student.username && (
                                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4 text-sm mt-4 pt-4 border-t border-gray-800/50">
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        <span>{student.xp_total || 0} XP</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-bold text-orange-500">
                                        <Flame className="w-4 h-4" />
                                        <span>{student.streak_count || 0} days</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </section>

            {/* Main Content Area */}
            {activeStudent && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <header className="text-center space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter">
                            HELLO, <span className="text-indigo-500 uppercase">{activeStudent.name}</span>!
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Ready for your daily challenge?</p>
                    </header>


                    {/* Primary Progress & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DailyGoalTracker
                            current={activeStudent.daily_xp || 0}
                            goal={activeStudent.daily_goal || 50}
                        />

                        <StreakWidget
                            streak={activeStudent.streak_count || 0}
                            history={activeStudent.history}
                        />

                        <Link to="/leaderboard" className="hidden lg:block">
                            <Card className="p-6 h-full flex flex-col justify-between hover:border-amber-500/50 transition-all group overflow-hidden relative bg-gradient-to-br from-gray-900 to-amber-950/10 border-amber-500/10">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold">Leaderboard</h3>
                                        <Trophy className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">See how you rank against others.</p>
                                </div>
                                <div className="mt-6 flex items-center justify-between text-amber-500 text-sm font-bold uppercase tracking-wider">
                                    View Rankings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <Trophy className="absolute -right-6 -bottom-6 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity rotate-12" />
                            </Card>
                        </Link>
                    </div>

                    {/* Quick Start Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <Link to="/practice" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full h-16 px-10 text-xl rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 group">
                                Start Practice <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link to="/academy" className="w-full sm:w-auto">
                            <Button variant="secondary" size="lg" className="w-full h-16 px-10 text-xl rounded-2xl border-2 border-gray-800">
                                <BookOpen className="mr-2" /> Academy
                            </Button>
                        </Link>
                    </div>

                    {/* Features Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-800/50">
                        {features.map((f, i) => (
                            <Link key={i} to={f.route} className="p-6 rounded-3xl bg-gray-950 border border-gray-900 hover:border-indigo-500/30 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    {f.icon}
                                </div>
                                <h4 className="text-lg font-bold mb-1">{f.title}</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                            </Link>
                        ))}
                    </section>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-4">
                    <Card className="w-full max-w-md p-8 space-y-6 animate-in slide-in-from-bottom-10 duration-500 rounded-[2.5rem]">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black italic tracking-tight">ADD STUDENT</h3>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">Start a new learning journey</p>
                        </div>
                        <input
                            type="text"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="Full name..."
                            autoFocus
                            className="w-full bg-gray-950 border-2 border-gray-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500 text-xl font-bold transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                        />
                        <div className="flex gap-4">
                            <Button variant="ghost" className="flex-1 h-14" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button className="flex-1 h-14 rounded-xl" onClick={handleAddStudent} disabled={isAdding || !newStudentName.trim()}>
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CREATE PROFILE'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const features = [
    { title: "Smart Practice", desc: "Speak naturally with AI corrections.", icon: "💬", route: "/practice" },
    { title: "Academy", desc: "Structured lessons tailored to your level.", icon: "📚", route: "/academy" },
    { title: "Personal AI", desc: "Immediate grammar and tips.", icon: "⚡", route: "/practice" }
];

export default Home;
