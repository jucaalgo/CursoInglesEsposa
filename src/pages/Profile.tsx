import React, { useEffect, useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme, THEMES, type ThemeId } from '../hooks/useTheme';
import Button from '../components/Button';
import { Loader2, Trophy, Flame, Target, Star, Palette, Check, Sparkles } from 'lucide-react';
import { BADGES } from '../data/achievements';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const THEME_PREVIEWS: Record<ThemeId, { emoji: string }> = {
    midnight: { emoji: '🌙' },
    aurora: { emoji: '🌌' },
    forest: { emoji: '🌿' },
    sunset: { emoji: '🌅' },
    ocean: { emoji: '🌊' },
    light: { emoji: '☀️' },
};

const Profile: React.FC = () => {
    const { profile, loading, error, updateProfile } = useUserProfile();
    const { theme, setTheme, themeColors } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [interests, setInterests] = useState('');
    const [currentLevel, setCurrentLevel] = useState('A1');
    const [targetLevel, setTargetLevel] = useState('B2');

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setInterests((profile.interests || []).join(', '));
            setCurrentLevel(profile.current_level || 'A1');
            setTargetLevel(profile.target_level || 'B2');
        }
    }, [profile]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 rounded-xl" style={{ background: 'var(--error-muted)', color: 'var(--error)', border: '1px solid var(--error)' }}>
                Error loading profile: {error}
            </div>
        );
    }

    const handleSave = async () => {
        if (profile) {
            await updateProfile({
                ...profile,
                name,
                current_level: currentLevel,
                target_level: targetLevel,
                interests: interests.split(',').map(i => i.trim()).filter(i => i.length > 0)
            });
            setIsEditing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center animate-in-down">
                <h2 className="text-3xl font-black italic tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                    YOUR <span style={{ color: 'var(--accent-primary)' }}>PROFILE</span>
                </h2>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}
                            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}
                                style={{ color: 'var(--text-muted)' }}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}
                                style={{ background: 'var(--accent-primary)' }}>
                            Save
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
                <div className="p-5 rounded-2xl card-hover" style={{ background: 'var(--accent-primary-muted)', border: '1px solid var(--accent-primary)' }}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total XP</p>
                            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{profile?.xp_total || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl card-hover" style={{ background: 'var(--warning-muted, rgba(245,158,11,0.1))', border: '1px solid var(--warning)' }}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ background: 'var(--warning)', color: '#1a0a07' }}>
                            <Flame className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Day Streak</p>
                            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{profile?.streak_count || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl card-hover" style={{ background: 'var(--success-muted)', border: '1px solid var(--success)' }}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ background: 'var(--success)', color: '#000' }}>
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Level</p>
                            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{profile?.current_level || 'A1'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Selection */}
            <div className="p-6 rounded-2xl animate-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl" style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}>
                        <Palette className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Theme</h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Personalize your learning vibe</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {(Object.entries(THEMES) as [ThemeId, typeof THEMES[ThemeId]][]).map(([id, colors]) => {
                        const isActive = theme === id;
                        const preview = THEME_PREVIEWS[id];
                        return (
                            <button
                                key={id}
                                onClick={() => setTheme(id)}
                                className="p-3 rounded-xl text-center transition-all duration-300 hover:scale-105 active:scale-95"
                                style={{
                                    background: isActive ? 'var(--accent-primary-muted)' : 'var(--bg-tertiary)',
                                    border: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                }}
                            >
                                <span className="text-xl">{preview.emoji}</span>
                                <p className="text-[9px] font-bold mt-1 truncate" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                                    {colors.name.split(' ')[0]}
                                </p>
                                {isActive && <Check className="w-3 h-3 mx-auto mt-0.5" style={{ color: 'var(--accent-primary)' }} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Personal Information */}
            <div className="p-6 rounded-2xl animate-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Display Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                                style={{
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-primary)',
                                    '--tw-ring-color': 'var(--accent-primary)',
                                } as React.CSSProperties}
                            />
                        ) : (
                            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.name || 'Guest User'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Interests / Topics
                        </label>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Used to personalize your AI course.</p>
                        {isEditing ? (
                            <textarea
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                                placeholder="e.g., Travel, Business, Technology..."
                                className="w-full rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2"
                                style={{
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {(profile?.interests || []).length > 0 ? (
                                    (profile?.interests || []).map((tag, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-lg text-sm font-medium"
                                              style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <p className="italic" style={{ color: 'var(--text-muted)' }}>No interests set. Add some to get a personalized course!</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                Current Level
                            </label>
                            {isEditing ? (
                                <select
                                    value={currentLevel}
                                    onChange={(e) => setCurrentLevel(e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                                    style={{
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border-default)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {CEFR_LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                      style={{ background: 'var(--success-muted)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                                    {profile?.current_level || 'A1'}
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                Target Level
                            </label>
                            {isEditing ? (
                                <select
                                    value={targetLevel}
                                    onChange={(e) => setTargetLevel(e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                                    style={{
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border-default)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {CEFR_LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                      style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
                                    {profile?.target_level || 'B2'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Achievements Gallery */}
            <div className="p-6 rounded-2xl animate-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Achievements</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}>
                        {(profile?.badges || []).length}/{BADGES.length}
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger-children">
                    {BADGES.map((badge) => {
                        const isUnlocked = (profile?.badges || []).includes(badge.id);
                        const Icon = badge.icon;

                        return (
                            <div
                                key={badge.id}
                                className={`relative p-4 rounded-2xl text-center transition-all duration-300 ${isUnlocked ? 'card-hover' : 'opacity-40 grayscale'}`}
                                style={{
                                    background: isUnlocked ? badge.color + '10' : 'var(--bg-tertiary)',
                                    border: `1px solid ${isUnlocked ? badge.color + '30' : 'var(--border-default)'}`,
                                }}
                            >
                                <div className="p-3 rounded-xl mx-auto mb-2 w-fit"
                                     style={{ background: isUnlocked ? badge.color + '20' : 'var(--bg-tertiary)', color: isUnlocked ? badge.color : 'var(--text-muted)' }}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <h4 className="font-bold text-xs" style={{ color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {badge.title}
                                </h4>
                                <p className="text-[10px] mt-1 leading-tight" style={{ color: 'var(--text-muted)' }}>
                                    {badge.description}
                                </p>
                                {isUnlocked && (
                                    <div className="absolute top-1.5 right-1.5" style={{ color: 'var(--warning)' }}>
                                        <Star className="w-3 h-3 fill-current" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Profile;