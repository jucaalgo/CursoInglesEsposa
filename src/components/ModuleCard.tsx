import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { Module } from '../../types';

interface ModuleCardProps {
    module: Module;
    index: number;
    isLocked?: boolean;
    isActive?: boolean;
    progress?: number;
    onClick?: () => void;
    isLoading?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
    module,
    index,
    isLocked = false,
    isActive = false,
    progress = 0,
    onClick,
    isLoading = false
}) => {
    const completedLessons = module.lessons?.filter(l => l.isCompleted).length || 0;
    const totalLessons = module.lessons?.length || 10;
    const calculatedProgress = module.isGenerated
        ? (completedLessons / totalLessons) * 100
        : 0;

    const getStatusIcon = () => {
        if (isLoading) return <Loader2 className="module-icon loading" size={24} />;
        if (module.isCompleted) return <CheckCircle className="module-icon completed" size={24} />;
        if (isLocked) return <Lock className="module-icon locked" size={24} />;
        return <BookOpen className="module-icon" size={24} />;
    };

    const getLevelColor = () => {
        const colors = [
            'var(--color-level-1)',
            'var(--color-level-2)',
            'var(--color-level-3)',
            'var(--color-level-4)',
            'var(--color-level-5)',
        ];
        return colors[index % colors.length];
    };

    return (
        <motion.div
            className={`module-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${module.isCompleted ? 'completed' : ''}`}
            onClick={!isLocked && !isLoading ? onClick : undefined}
            whileHover={!isLocked ? { scale: 1.02, y: -4 } : {}}
            whileTap={!isLocked ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{ '--accent-color': getLevelColor() } as React.CSSProperties}
        >
            <div className="module-card-header">
                <div className="module-number">
                    <span>{(index + 1).toString().padStart(2, '0')}</span>
                </div>
                {getStatusIcon()}
            </div>

            <div className="module-card-content">
                <h3 className="module-title">{module.title}</h3>

                {module.isGenerated && (
                    <div className="module-lessons-info">
                        <span>{completedLessons}/{totalLessons} lecciones</span>
                    </div>
                )}
            </div>

            <div className="module-card-footer">
                <div className="module-progress-bar">
                    <motion.div
                        className="module-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${calculatedProgress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>

                {!isLocked && (
                    <ChevronRight className="module-arrow" size={20} />
                )}
            </div>

            {isLocked && (
                <div className="module-locked-overlay">
                    <Lock size={32} />
                    <span>Completa el módulo anterior</span>
                </div>
            )}
        </motion.div>
    );
};

export default ModuleCard;
