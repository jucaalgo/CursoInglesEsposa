import { Rocket, Flame, Target, Zap, Crown, BookOpen, Mic, Brain, Star } from 'lucide-react';

export interface BadgeDefinition {
    id: string;
    title: string;
    description: string;
    icon: any; // Lucide icon component
    color: string; // Tailwind color class backbone (e.g. 'amber', 'purple')
}

export const BADGES: BadgeDefinition[] = [
    {
        id: 'first_login',
        title: 'Newcomer',
        description: 'Joined the academy.',
        icon: Rocket,
        color: 'blue'
    },
    {
        id: 'first_lesson',
        title: 'First Step',
        description: 'Completed your first lesson.',
        icon: BookOpen,
        color: 'emerald'
    },
    {
        id: 'streak_3',
        title: 'On Fire',
        description: 'Maintained a 3-day streak.',
        icon: Flame,
        color: 'orange'
    },
    {
        id: 'streak_7',
        title: 'Unstoppable',
        description: 'Maintained a 7-day streak.',
        icon: Zap,
        color: 'yellow'
    },
    {
        id: 'xp_100',
        title: 'Century',
        description: 'Earned 100 XP total.',
        icon: Star,
        color: 'indigo'
    },
    {
        id: 'perfect_quiz',
        title: 'Sharpshooter',
        description: 'Scored 100% on a quiz.',
        icon: Target,
        color: 'red'
    },
    {
        id: 'grammar_master',
        title: 'Grammar Geek',
        description: 'Used the Grammar Lab 5 times.',
        icon: Brain,
        color: 'pink'
    },
    {
        id: 'voice_pro',
        title: 'Voice Actor',
        description: 'Recorded 10 pronunciation exercises.',
        icon: Mic,
        color: 'cyan'
    },
    {
        id: 'level_b1',
        title: 'Intermediate',
        description: 'Reached Level B1.',
        icon: Crown,
        color: 'purple'
    }
];
