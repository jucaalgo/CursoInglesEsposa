import { useState, useEffect, useCallback } from 'react';

const STREAK_KEY = 'profesoria_streak';
const LAST_ACTIVITY_KEY = 'profesoria_last_activity';

interface StreakData {
    current: number;
    longest: number;
    lastActivityDate: string;
}

export const useStreak = () => {
    const [streak, setStreak] = useState<StreakData>({
        current: 0,
        longest: 0,
        lastActivityDate: ''
    });

    // Load streak on mount
    useEffect(() => {
        const saved = localStorage.getItem(STREAK_KEY);
        if (saved) {
            const data = JSON.parse(saved) as StreakData;
            const today = new Date().toDateString();
            const lastActivity = new Date(data.lastActivityDate).toDateString();

            // Calculate days difference
            const todayDate = new Date(today);
            const lastDate = new Date(lastActivity);
            const diffTime = todayDate.getTime() - lastDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Same day - keep streak
                setStreak(data);
            } else if (diffDays === 1) {
                // Yesterday - streak continues
                setStreak(data);
            } else {
                // More than 1 day - streak broken
                setStreak({ current: 0, longest: data.longest, lastActivityDate: '' });
            }
        }
    }, []);

    // Record activity and update streak
    const recordActivity = useCallback(() => {
        const today = new Date().toDateString();

        setStreak(prev => {
            const lastActivity = prev.lastActivityDate ? new Date(prev.lastActivityDate).toDateString() : '';

            if (lastActivity === today) {
                // Already recorded today
                return prev;
            }

            const lastDate = lastActivity ? new Date(lastActivity) : null;
            const todayDate = new Date(today);

            let newCurrent = 1;
            if (lastDate) {
                const diffTime = todayDate.getTime() - lastDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    newCurrent = prev.current + 1;
                }
            }

            const newStreak: StreakData = {
                current: newCurrent,
                longest: Math.max(newCurrent, prev.longest),
                lastActivityDate: today
            };

            localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
            return newStreak;
        });
    }, []);

    // Check if activity was recorded today
    const hasActivityToday = useCallback(() => {
        const today = new Date().toDateString();
        return streak.lastActivityDate === today;
    }, [streak.lastActivityDate]);

    return {
        currentStreak: streak.current,
        longestStreak: streak.longest,
        recordActivity,
        hasActivityToday
    };
};

export default useStreak;
