import React, { useEffect, useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import Card from '../components/Card';
import Button from '../components/Button';
import { Loader2, Trophy, Flame, Target } from 'lucide-react';

const Profile: React.FC = () => {
    const { profile, loading, error, updateProfile } = useUserProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [interests, setInterests] = useState('');

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setInterests((profile.interests || []).join(', '));
        }
    }, [profile]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center p-8 bg-red-900/20 rounded-xl border border-red-900">
                Error loading profile: {error}
            </div>
        );
    }

    const handleSave = async () => {
        if (profile) {
            await updateProfile({
                ...profile,
                name,
                interests: interests.split(',').map(i => i.trim()).filter(i => i.length > 0)
            });
            setIsEditing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Your Profile
                </h2>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-indigo-500/30 bg-indigo-500/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total XP</p>
                            <p className="text-2xl font-bold">{profile?.xp_total || 0}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-orange-500/30 bg-orange-500/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/20 rounded-full text-orange-400">
                            <Flame className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Day Streak</p>
                            <p className="text-2xl font-bold">{profile?.streak_count || 0}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Level</p>
                            <p className="text-2xl font-bold">{profile?.current_level || 'A1'}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Info */}
            <Card title="Personal Information">
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Display Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        ) : (
                            <p className="text-lg">{profile?.name || 'Guest User'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Interests / Topics
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Used to personalize your AI course.</p>
                        {isEditing ? (
                            <textarea
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                                placeholder="e.g., Travel, Business, Technology, Cooking..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {(profile?.interests || []).length > 0 ? (
                                    (profile?.interests || []).map((tag, i) => (
                                        <span key={i} className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-sm border border-indigo-500/20">
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No interests set. Add some to get a personalized course!</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Target Level
                        </label>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-900/50 text-indigo-300 text-sm border border-indigo-500/30">
                            {profile?.target_level || 'B2'}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Profile;
