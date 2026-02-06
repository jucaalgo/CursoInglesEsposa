import { useState, useCallback } from 'react';
import {
    generateSyllabus,
    generateModuleLessons,
    generateInteractiveContent,
    evaluatePronunciation,
    generateSpeech,
    analyzeStudentResponse
} from '../../services/gemini';
import { UserProfile, Course, Module, Lesson, InteractiveContent, PronunciationResult } from '../../types';

// Hook for course generation
export const useGemini = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateCourse = useCallback(async (profile: UserProfile): Promise<Course | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const syllabus = await generateSyllabus(profile);

            const modules: Module[] = syllabus.map((title, idx) => ({
                id: `mod-${idx}`,
                title,
                description: `Master ${title} in English`,
                isCompleted: false,
                isGenerated: false,
                lessons: []
            }));

            const course: Course = {
                id: `course-${Date.now()}`,
                title: `English Journey: ${profile.currentLevel} → ${profile.targetLevel}`,
                description: `Personalized course based on your interests: ${profile.interests.join(', ')}`,
                modules,
                syllabus
            };

            return course;
        } catch (e: any) {
            setError(e.message || 'Failed to generate course');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generateModule = useCallback(async (
        module: Module,
        userLevel: string
    ): Promise<Module> => {
        setIsLoading(true);
        setError(null);
        try {
            const lessonTitles = await generateModuleLessons(module.title, userLevel);

            const lessons: Lesson[] = lessonTitles.map((title, idx) => ({
                id: `${module.id}-lesson-${idx}`,
                title,
                description: `Step ${idx + 1} of ${module.title}`,
                isCompleted: false
            }));

            return { ...module, lessons, isGenerated: true };
        } catch (e: any) {
            setError(e.message || 'Failed to generate module');
            return module;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generateLesson = useCallback(async (
        lesson: Lesson,
        moduleTitle: string,
        userLevel: string
    ): Promise<Lesson> => {
        setIsLoading(true);
        setError(null);
        try {
            const content = await generateInteractiveContent(lesson.title, userLevel, moduleTitle);
            return { ...lesson, content };
        } catch (e: any) {
            setError(e.message || 'Failed to generate lesson content');
            return lesson;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        generateCourse,
        generateModule,
        generateLesson,
        evaluatePronunciation,
        generateSpeech,
        analyzeStudentResponse
    };
};

export default useGemini;
