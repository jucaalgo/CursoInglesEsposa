import { useState, useCallback, useEffect } from 'react';
import { UserProfile, Course } from '../../types';

const XP_KEY = 'profesoria_xp';
const LEVEL_KEY = 'profesoria_level';

interface ProgressData {
    totalXP: number;
    currentLevelXP: number;
    level: number;
    lessonsCompleted: number;
    modulesCompleted: number;
}

// XP required for each level (increases progressively)
const xpForLevel = (level: number): number => {
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

    // Load progress on mount
    useEffect(() => {
        const savedXP = localStorage.getItem(XP_KEY);
        const savedLevel = localStorage.getItem(LEVEL_KEY);

        if (savedXP && savedLevel) {
            const totalXP = parseInt(savedXP, 10);
            const level = parseInt(savedLevel, 10);
            let currentLevelXP = totalXP;

            // Calculate XP for current level
            for (let i = 1; i < level; i++) {
                currentLevelXP -= xpForLevel(i);
            }

            setProgress(prev => ({
                ...prev,
                totalXP,
                level,
                currentLevelXP
            }));
        }
    }, []);

    // Award XP and handle level ups
    const awardXP = useCallback((amount: number): { leveledUp: boolean; newLevel: number } => {
        let leveledUp = false;
        let newLevel = progress.level;

        setProgress(prev => {
            let totalXP = prev.totalXP + amount;
            let currentLevelXP = prev.currentLevelXP + amount;
            let level = prev.level;

            // Check for level up
            while (currentLevelXP >= xpForLevel(level)) {
                currentLevelXP -= xpForLevel(level);
                level++;
                leveledUp = true;
                newLevel = level;
            }

            // Save to localStorage
            localStorage.setItem(XP_KEY, totalXP.toString());
            localStorage.setItem(LEVEL_KEY, level.toString());

            return {
                ...prev,
                totalXP,
                currentLevelXP,
                level,
                lessonsCompleted: prev.lessonsCompleted + 1
            };
        });

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
