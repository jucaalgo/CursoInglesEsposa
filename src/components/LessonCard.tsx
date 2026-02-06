import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, PlayCircle, Lock, Star } from 'lucide-react';
import { Lesson } from '../../types';

interface LessonCardProps {
    lesson: Lesson;
    index: number;
    isLocked?: boolean;
    isActive?: boolean;
    onClick?: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
    lesson,
    index,
    isLocked = false,
    isActive = false,
    onClick
}) => {
    const getStatusIcon = () => {
        if (lesson.isCompleted) {
            return (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                >
                    <CheckCircle className="lesson-icon completed" size={28} />
                </motion.div>
            );
        }
        if (isLocked) return <Lock className="lesson-icon locked" size={28} />;
        if (isActive) return <PlayCircle className="lesson-icon active" size={28} />;
        return <Circle className="lesson-icon" size={28} />;
    };

    const getScoreStars = () => {
        if (!lesson.score) return null;
        const stars = Math.ceil(lesson.score / 20); // 0-100 -> 0-5 stars

        return (
            <div className="lesson-stars">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= stars ? 'star-filled' : 'star-empty'}
                    />
                ))}
            </div>
        );
    };

    return (
        <motion.div
            className={`lesson-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${lesson.isCompleted ? 'completed' : ''}`}
            onClick={!isLocked ? onClick : undefined}
            whileHover={!isLocked ? { x: 8, backgroundColor: 'var(--hover-bg)' } : {}}
            whileTap={!isLocked ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
        >
            <div className="lesson-card-left">
                <div className="lesson-step">
                    <span className="lesson-step-number">{index + 1}</span>
                    <div className="lesson-step-line" />
                </div>
                {getStatusIcon()}
            </div>

            <div className="lesson-card-content">
                <h4 className="lesson-title">{lesson.title}</h4>
                {lesson.description && (
                    <p className="lesson-description">{lesson.description}</p>
                )}
                {lesson.isCompleted && getScoreStars()}
            </div>

            {!isLocked && !lesson.isCompleted && (
                <motion.div
                    className="lesson-card-action"
                    whileHover={{ scale: 1.1 }}
                >
                    <PlayCircle size={24} />
                </motion.div>
            )}

            {lesson.isCompleted && lesson.score !== undefined && (
                <div className="lesson-score">
                    <span>{lesson.score}%</span>
                </div>
            )}
        </motion.div>
    );
};

export default LessonCard;
