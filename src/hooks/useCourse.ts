import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { generateSyllabus, generateModuleLessons } from '../services/gemini';
import { getSyllabus, saveSyllabus, getCourseProgress, saveCourseProgress } from '../services/repository';

export function useCourse() {
    const { profile } = useUserProfile();
    const [syllabus, setSyllabus] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);

    useEffect(() => {
        if (profile?.username) {
            loadCourseData(profile.username);
        }
    }, [profile?.username]);

    const loadCourseData = async (username: string) => {
        setLoading(true);
        try {
            // Load Syllabus
            const savedSyllabus = await getSyllabus(username);
            if (savedSyllabus && savedSyllabus.length > 0) {
                setSyllabus(savedSyllabus);
            }

            // Load Progress
            const progress = await getCourseProgress(username);
            if (progress) {
                setCompletedLessons(progress.completed_lessons || []);
            }
        } catch (error) {
            console.error("Failed to load course data", error);
        } finally {
            setLoading(false);
        }
    };

    const generateNewSyllabus = async () => {
        if (!profile) return;
        setGenerating(true);
        try {
            const newSyllabus = await generateSyllabus(profile);
            setSyllabus(newSyllabus);
            await saveSyllabus(profile.username, newSyllabus);
        } catch (error) {
            console.error("Failed to generate syllabus", error);
        } finally {
            setGenerating(false);
        }
    };

    const markLessonComplete = async (lessonTitle: string) => {
        if (!profile) return;
        const newCompleted = [...completedLessons, lessonTitle];
        const uniqueCompleted = Array.from(new Set(newCompleted));

        setCompletedLessons(uniqueCompleted);

        await saveCourseProgress({
            username: profile.username,
            syllabus,
            completed_lessons: uniqueCompleted,
            current_module_index: 0 // logic to calc index could be added
        });
    };

    return {
        syllabus,
        loading,
        generating,
        completedLessons,
        generateNewSyllabus,
        markLessonComplete
    };
}
