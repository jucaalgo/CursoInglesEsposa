import { useState, useCallback, useEffect } from 'react';
import { UserProfile, Course } from '../../types';
import { updateProgress, getProfile } from '../../services/repository';

export interface ProgressData {
    totalXP: number;
    currentLevelXP: number;
    level: number;
    lessonsCompleted: number;
    modulesCompleted: number;
}

// XP required for each level (increases progressively)
export const xpForLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.2, level - 1));
};

export const useProgress = () => {
    const [progress, setProgress] = useState<ProgressData>({
        totalXP: 0,
        currentLevelXP: 0,
        level: 1,
        lessonsCompleted: 0,
        modulesCompleted: 0
    });

    // Load progress from repository (Single Source of Truth)
    useEffect(() => {
        const loadFromRepo = async () => {
            const user = localStorage.getItem('profesoria_current_user');
            if (user) {
                const profile = await getProfile(user);
                if (profile) {
                    const levelNum = 1; // Simplify level calc for now or implement mapping A1->1, A2->2 etc
                    setProgress(prev => ({
                        ...prev,
                        totalXP: profile.xp_total,
                        // Recalculate level based on XP logic inside hook or sync with profile
                    }));
                }
            }
        };
        loadFromRepo();
    }, []);

    // Award XP and handle level ups
    const awardXP = useCallback(async (amount: number, username: string): Promise<{ leveledUp: boolean; newLevel: number }> => {
        let leveledUp = false;
        let newLevel = progress.level;

        // Optimistic update local state
        setProgress(prev => {
            const totalXP = prev.totalXP + amount;
            let currentLevelXP = prev.currentLevelXP + amount;
            let level = prev.level;

            while (currentLevelXP >= xpForLevel(level)) {
                currentLevelXP -= xpForLevel(level);
                level++;
                leveledUp = true;
                newLevel = level;
            }
            return { ...prev, totalXP, currentLevelXP, level };
        });

        // Persist via repository
        try {
            await updateProgress(username, amount);
        } catch (e) { console.error("Failed to save progress", e); }

        return { leveledUp, newLevel };
    }, [progress.level]);

    // Calculate progress percentage for current level
    const getLevelProgress = useCallback((): number => {
        const required = xpForLevel(progress.level);
        return Math.min((progress.currentLevelXP / required) * 100, 100);
    }, [progress.level, progress.currentLevelXP]);

    // Get XP needed for next level
    const getXPToNextLevel = useCallback((): number => {
        return xpForLevel(progress.level) - progress.currentLevelXP;
    }, [progress.level, progress.currentLevelXP]);

    // Calculate course completion percentage
    const getCourseProgress = useCallback((course: Course | null): number => {
        if (!course || !course.modules.length) return 0;

        const totalLessons = course.modules.reduce((acc, mod) =>
            acc + (mod.lessons?.length || 0), 0
        );

        const completedLessons = course.modules.reduce((acc, mod) =>
            acc + (mod.lessons?.filter(l => l.isCompleted).length || 0), 0
        );

        if (totalLessons === 0) return 0;
        return (completedLessons / totalLessons) * 100;
    }, []);

    return {
        ...progress,
        awardXP,
        getLevelProgress,
        getXPToNextLevel,
        getCourseProgress,
        xpForLevel
    };
};

export default useProgress;
