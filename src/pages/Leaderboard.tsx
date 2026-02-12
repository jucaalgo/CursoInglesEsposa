import React from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import Card from '../components/Card';
import { Trophy, Medal, Star, ArrowLeft, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const Leaderboard: React.FC = () => {
    const { profile: activeStudent } = useUserProfile();
    const navigate = useNavigate();
    const [students, setStudents] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                // Import dynamically to avoid circular dependencies if any, 
                // or just import at top if clean. Repository is safe.
                const { getAllProfiles } = await import('../services/repository');
                const data = await getAllProfiles();
                setStudents(data);
            } catch (e) {
                console.error("Failed to load leaderboard", e);
            } finally {
                setLoading(false);
            }
        };
        loadLeaderboard();
    }, []);

    // Sort students by XP descending
    const sortedStudents = [...students].sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));

    return (
        <div className="space-y-8 pb-24">
            {/* Header */}
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="p-2">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight">LEADERBOARD</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Global Rankings</p>
                </div>
            </header>

            {/* Podium (Top 3) */}
            {sortedStudents.length > 0 && (
                <div className="flex items-end justify-center gap-2 sm:gap-4 px-2 pt-10 pb-4">
                    {/* 2nd Place */}
                    {sortedStudents[1] && (
                        <div className="flex flex-col items-center gap-2 group">
                            <div className="relative">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-800 flex items-center justify-center border-2 border-gray-700 overflow-hidden group-hover:scale-105 transition-transform">
                                    <span className="text-2xl font-bold">{sortedStudents[1].name.charAt(0)}</span>
                                </div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center border-2 border-gray-950">
                                    <Medal className="w-4 h-4 text-gray-900" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-sm truncate max-w-[80px]">{sortedStudents[1].name}</p>
                                <p className="text-[10px] text-gray-500 font-bold">{sortedStudents[1].xp_total} XP</p>
                            </div>
                            <div className="w-16 sm:w-20 h-16 bg-gradient-to-t from-gray-800/50 to-gray-800/20 rounded-t-xl" />
                        </div>
                    )}

                    {/* 1st Place */}
                    {sortedStudents[0] && (
                        <div className="flex flex-col items-center gap-2 group -translate-y-4">
                            <div className="relative">
                                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-indigo-500/20 flex items-center justify-center border-4 border-amber-500 overflow-hidden shadow-2xl shadow-amber-500/20 group-hover:scale-105 transition-transform">
                                    <span className="text-4xl font-black text-amber-500">{sortedStudents[0].name.charAt(0)}</span>
                                </div>
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                    <Crown className="w-10 h-10 text-amber-500 drop-shadow-lg" />
                                </div>
                                <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center border-4 border-gray-950">
                                    <Trophy className="w-5 h-5 text-gray-900" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-black text-lg text-amber-500">{sortedStudents[0].name}</p>
                                <p className="text-xs text-amber-500/70 font-black">{sortedStudents[0].xp_total} XP</p>
                            </div>
                            <div className="w-20 sm:w-28 h-24 bg-gradient-to-t from-amber-500/30 to-amber-500/5 rounded-t-2xl border-x-2 border-t-2 border-amber-500/20" />
                        </div>
                    )}

                    {/* 3rd Place */}
                    {sortedStudents[2] && (
                        <div className="flex flex-col items-center gap-2 group">
                            <div className="relative">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-800 flex items-center justify-center border-2 border-gray-700 overflow-hidden group-hover:scale-105 transition-transform">
                                    <span className="text-2xl font-bold">{sortedStudents[2].name.charAt(0)}</span>
                                </div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-orange-700 flex items-center justify-center border-2 border-gray-950">
                                    <Medal className="w-4 h-4 text-gray-900" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-sm truncate max-w-[80px]">{sortedStudents[2].name}</p>
                                <p className="text-[10px] text-gray-500 font-bold">{sortedStudents[2].xp_total} XP</p>
                            </div>
                            <div className="w-16 sm:w-20 h-12 bg-gradient-to-t from-orange-900/40 to-orange-900/10 rounded-t-xl" />
                        </div>
                    )}
                </div>
            )}

            {/* List for the rest */}
            <Card className="p-0 overflow-hidden border-gray-800 bg-gray-950/50">
                <div className="divide-y divide-gray-800/50">
                    {sortedStudents.map((student, index) => {
                        const isTopThree = index < 3;
                        const isActive = student.username === activeStudent?.username;

                        return (
                            <div
                                key={student.username}
                                className={`
                                    flex items-center gap-4 p-5 transition-colors
                                    ${isActive ? 'bg-indigo-500/10' : 'hover:bg-gray-900/30'}
                                `}
                            >
                                <div className="w-8 text-center">
                                    <span className={`text-lg font-black ${isTopThree ? 'text-amber-500' : 'text-gray-600'}`}>
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                                        ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}
                                    `}>
                                        {student.name.charAt(0)}
                                    </div>
                                    {isActive && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-950" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold truncate ${isActive ? 'text-indigo-400' : 'text-gray-200'}`}>
                                        {student.name} {isActive && '(You)'}
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium">Level {student.current_level} • {student.streak_count} day streak</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 font-black text-gray-100 italic">
                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        {student.xp_total}
                                    </div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Total XP</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Invite/Share Footer Card */}
            <Card className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-center space-y-4">
                <h3 className="text-xl font-black italic tracking-tight">WANT TO CLIMB HIGHER?</h3>
                <p className="text-indigo-100 text-sm font-medium">Complete more lessons in the Academy and practice daily to earn massive XP bonuses!</p>
                <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-bold rounded-xl" onClick={() => navigate('/academy')}>
                    GO TO ACADEMY
                </Button>
            </Card>
        </div>
    );
};

export default Leaderboard;
