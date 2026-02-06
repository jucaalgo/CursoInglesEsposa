import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Award } from 'lucide-react';

interface StreakCounterProps {
    currentStreak: number;
    longestStreak: number;
    hasActivityToday: boolean;
    compact?: boolean;
}

const StreakCounter: React.FC<StreakCounterProps> = ({
    currentStreak,
    longestStreak,
    hasActivityToday,
    compact = false
}) => {
    const isOnFire = currentStreak >= 7;

    if (compact) {
        return (
            <motion.div
                className="streak-counter-compact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Flame
                    className={`streak-flame ${hasActivityToday ? 'active' : 'inactive'}`}
                    size={20}
                />
                <span className="streak-number">{currentStreak}</span>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="streak-counter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="streak-main">
                <motion.div
                    className={`streak-flame-container ${isOnFire ? 'on-fire' : ''}`}
                    animate={isOnFire ? {
                        scale: [1, 1.1, 1],
                        rotate: [-5, 5, -5]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                >
                    <Flame
                        className={`streak-flame-icon ${hasActivityToday ? 'active' : 'inactive'}`}
                        size={48}
                    />
                </motion.div>

                <div className="streak-info">
                    <motion.span
                        className="streak-count"
                        key={currentStreak}
                        initial={{ scale: 1.5, color: '#FFD700' }}
                        animate={{ scale: 1, color: '#FF6B35' }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentStreak}
                    </motion.span>
                    <span className="streak-label">
                        {currentStreak === 1 ? 'día' : 'días'} seguidos
                    </span>
                </div>
            </div>

            {!hasActivityToday && (
                <motion.div
                    className="streak-warning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <span>¡Practica hoy para mantener tu racha! 🔥</span>
                </motion.div>
            )}

            <div className="streak-record">
                <Award size={16} />
                <span>Récord: {longestStreak} días</span>
            </div>
        </motion.div>
    );
};

export default StreakCounter;
