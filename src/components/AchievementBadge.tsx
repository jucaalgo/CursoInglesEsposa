import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, BookOpen, Flame, Award } from 'lucide-react';

export type AchievementType =
    | 'first_lesson'
    | 'streak_3'
    | 'streak_7'
    | 'streak_30'
    | 'module_complete'
    | 'perfect_score'
    | 'level_up'
    | 'course_complete';

interface AchievementBadgeProps {
    type: AchievementType;
    unlocked?: boolean;
    showAnimation?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const achievementData: Record<AchievementType, {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    xp: number;
}> = {
    first_lesson: {
        icon: <BookOpen size={24} />,
        title: '¡Primera Lección!',
        description: 'Completaste tu primera lección',
        color: '#22C55E',
        xp: 10
    },
    streak_3: {
        icon: <Flame size={24} />,
        title: 'En Racha',
        description: '3 días seguidos practicando',
        color: '#F97316',
        xp: 25
    },
    streak_7: {
        icon: <Flame size={24} />,
        title: '¡Semana Completa!',
        description: '7 días seguidos de práctica',
        color: '#EF4444',
        xp: 50
    },
    streak_30: {
        icon: <Trophy size={24} />,
        title: 'Maestro de la Constancia',
        description: '30 días sin parar',
        color: '#FFD700',
        xp: 200
    },
    module_complete: {
        icon: <Target size={24} />,
        title: 'Módulo Completado',
        description: 'Terminaste un módulo completo',
        color: '#8B5CF6',
        xp: 100
    },
    perfect_score: {
        icon: <Star size={24} />,
        title: '¡Perfecto!',
        description: '100% en una lección',
        color: '#FFD700',
        xp: 30
    },
    level_up: {
        icon: <Zap size={24} />,
        title: '¡Subiste de Nivel!',
        description: 'Alcanzaste un nuevo nivel',
        color: '#3B82F6',
        xp: 50
    },
    course_complete: {
        icon: <Award size={24} />,
        title: '¡Curso Completado!',
        description: 'Terminaste todo el curso',
        color: '#FFD700',
        xp: 500
    }
};

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
    type,
    unlocked = false,
    showAnimation = false,
    size = 'md',
    onClick
}) => {
    const data = achievementData[type];
    const sizeClasses = {
        sm: 'achievement-badge-sm',
        md: 'achievement-badge-md',
        lg: 'achievement-badge-lg'
    };

    return (
        <motion.div
            className={`achievement-badge ${sizeClasses[size]} ${unlocked ? 'unlocked' : 'locked'}`}
            onClick={onClick}
            whileHover={unlocked ? { scale: 1.05, rotate: [0, -5, 5, 0] } : {}}
            whileTap={unlocked ? { scale: 0.95 } : {}}
            style={{ '--badge-color': unlocked ? data.color : '#9CA3AF' } as React.CSSProperties}
        >
            <AnimatePresence>
                {showAnimation && unlocked && (
                    <motion.div
                        className="achievement-glow"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.5, 2]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    />
                )}
            </AnimatePresence>

            <div className="achievement-icon-container">
                <motion.div
                    className="achievement-icon"
                    initial={showAnimation ? { scale: 0, rotate: -180 } : {}}
                    animate={showAnimation ? { scale: 1, rotate: 0 } : {}}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    {data.icon}
                </motion.div>
            </div>

            {size !== 'sm' && (
                <div className="achievement-info">
                    <h4 className="achievement-title">{data.title}</h4>
                    {size === 'lg' && (
                        <>
                            <p className="achievement-description">{data.description}</p>
                            <span className="achievement-xp">+{data.xp} XP</span>
                        </>
                    )}
                </div>
            )}

            {!unlocked && (
                <div className="achievement-locked-overlay">
                    <span>?</span>
                </div>
            )}
        </motion.div>
    );
};

export default AchievementBadge;
