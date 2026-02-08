import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudents } from '../context/StudentContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { ArrowRight, BookOpen, Plus, User, Trophy, Flame, Check, Loader2 } from 'lucide-react';

const Home: React.FC = () => {
    const { students, activeStudent, isLoading, selectStudent, addStudent } = useStudents();
    const [showAddModal, setShowAddModal] = useState(false);
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
        <div className="space-y-8 pb-20">
            {/* Student Selector Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-200">Select Student</h2>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowAddModal(true)}
                        className="gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Student</span>
                    </Button>
                </div>

                {/* Student Cards - Horizontal Scroll on Mobile */}
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:mx-0 md:px-0">
                    {students.length === 0 ? (
                        <div className="w-full text-center py-12">
                            <User className="w-16 h-16 mx-auto text-gray-700 mb-4" />
                            <p className="text-gray-500">No students yet.</p>
                            <Button
                                onClick={() => setShowAddModal(true)}
                                className="mt-4"
                            >
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
                                    p-5 rounded-2xl border-2 transition-all duration-200
                                    text-left active:scale-[0.98]
                                    ${activeStudent?.username === student.username
                                        ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                        : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                                    }
                                `}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                                            ${activeStudent?.username === student.username
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-gray-800 text-gray-400'
                                            }
                                        `}>
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{student.name}</h3>
                                            <span className={`
                                                text-xs px-2 py-0.5 rounded-full font-medium
                                                ${student.current_level === 'C1' || student.current_level === 'C2'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-emerald-500/20 text-emerald-400'
                                                }
                                            `}>
                                                Level {student.current_level}
                                            </span>
                                        </div>
                                    </div>
                                    {activeStudent?.username === student.username && (
                                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        <span>{student.xp_total || 0} XP</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        <span>{student.streak_count || 0} day streak</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </section>

            {/* Main Actions - Only show if student selected */}
            {activeStudent && (
                <>
                    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                        <div className="text-center py-4">
                            <h1 className="text-2xl md:text-3xl font-bold">
                                Welcome back, <span className="text-indigo-400">{activeStudent.name}</span>!
                            </h1>
                            <p className="text-gray-400 mt-1">Ready to continue learning?</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/practice" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full gap-2 group">
                                    Start Practice
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/academy" className="w-full sm:w-auto">
                                <Button variant="secondary" size="lg" className="w-full gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Academy
                                </Button>
                            </Link>
                        </div>
                    </section>

                    {/* Feature Cards */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        {features.map((feature, i) => (
                            <Link
                                key={i}
                                to={feature.route}
                                className="block p-5 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all duration-300 group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="font-semibold mb-1 group-hover:text-indigo-400 transition-colors">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                            </Link>
                        ))}
                    </section>
                </>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                        <h3 className="text-xl font-bold">Add New Student</h3>
                        <input
                            type="text"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="Student name..."
                            autoFocus
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                        />
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleAddStudent}
                                disabled={isAdding || !newStudentName.trim()}
                            >
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Student'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const features = [
    {
        title: "Real Conversations",
        desc: "Practice speaking with AI corrections.",
        icon: <span className="text-xl">💬</span>,
        route: "/practice"
    },
    {
        title: "Personalized Lessons",
        desc: "Learn at your own pace.",
        icon: <span className="text-xl">📚</span>,
        route: "/academy"
    },
    {
        title: "Instant Feedback",
        desc: "Get immediate corrections.",
        icon: <span className="text-xl">⚡</span>,
        route: "/practice"
    }
];

export default Home;
