import { supabase } from './supabase';
import { UserProfile, Course, Module, Lesson } from '../types';

export const RepositoryService = {
    // 1. Profile Management
    getProfileByUsername: async (username: string) => {
        const { data, error } = await supabase
            .from('profesoria_profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }
        return data;
    },

    upsertProfile: async (profile: UserProfile) => {
        // Deterministic ID for anonymous users based on username
        // In a real app with Auth, we would use the real User ID.
        // For this demo, we'll try to find an existing profile by username first to get the ID
        const existing = await RepositoryService.getProfileByUsername(profile.username!);
        const id = existing?.id || crypto.randomUUID();

        const { error } = await supabase
            .from('profesoria_profiles')
            .upsert({
                id: id,
                username: profile.username,
                english_level: profile.currentLevel,
                interests: profile.interests,
                xp_total: 0,
                updated_at: new Date().toISOString()
            }, { onConflict: 'username' });

        if (error) throw error;
    },

    // 2. Course/Module/Lesson Management
    // This is a more complex refactor because of the nested structure.
    // We'll implement a 'saveCourse' that breaks it down.
    saveFullCourse: async (userId: string, course: Course) => {
        // Save Modules
        for (const [modIndex, module] of course.modules.entries()) {
            const { data: modData, error: modError } = await supabase
                .from('profesoria_modules')
                .upsert({
                    id: module.id,
                    user_id: userId,
                    title: module.title,
                    description: module.description,
                    status: module.isCompleted ? 'completed' : 'unlocked',
                    order_index: modIndex
                })
                .select()
                .single();

            if (modError) throw modError;

            // Save Lessons for this module
            for (const [lessIndex, lesson] of module.lessons.entries()) {
                const { error: lessError } = await supabase
                    .from('profesoria_lessons')
                    .upsert({
                        id: lesson.id,
                        module_id: module.id,
                        title: lesson.title,
                        content: lesson.content,
                        score: lesson.score || 0,
                        is_completed: lesson.isCompleted,
                        order_index: lessIndex
                    });

                if (lessError) throw lessError;
            }
        }
    },

    getFullCourse: async (userId: string): Promise<Course | null> => {
        const { data: modules, error: modError } = await supabase
            .from('profesoria_modules')
            .select('*, profesoria_lessons(*)')
            .eq('user_id', userId)
            .order('order_index', { ascending: true });

        if (modError) {
            console.error("Supabase getFullCourse error:", modError);
            throw modError;
        }
        if (!modules || modules.length === 0) return null;

        return {
            id: 'default_course',
            title: 'English Mastery',
            description: 'Your custom path',
            modules: modules.map((m: any) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                isCompleted: m.status === 'completed',
                isGenerated: true,
                lessons: (m.profesoria_lessons || [])
                    .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                    .map((l: any) => ({
                        id: l.id,
                        title: l.title,
                        description: '',
                        isCompleted: l.is_completed,
                        score: l.score,
                        content: l.content
                    }))
            }))
        };
    }
};
