import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, MessageSquare, AlertTriangle, Target, Clock, ArrowRight, BookOpen } from 'lucide-react';
import Button from './Button';

interface SessionSummaryProps {
    messagesCount: number;
    correctionsCount: number;
    xpEarned: number;
    timeSpentSeconds: number;
    corrections: Array<{ original: string; correction: string; explanation: string }>;
    onContinue: () => void;
    onReviewMistakes: () => void;
}

// Animated count-up hook
const useCountUp = (target: number, duration: number = 1200) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (target === 0) { setCount(0); return; }
        let start = 0;
        const startTime = performance.now();
        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out-expo curve
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration]);
    return count;
};

// Format seconds to mm:ss
const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const SessionSummary: React.FC<SessionSummaryProps> = ({
    messagesCount,
    correctionsCount,
    xpEarned,
    timeSpentSeconds,
    corrections,
    onContinue,
    onReviewMistakes,
}) => {
    const animatedXP = useCountUp(xpEarned, 1400);
    const accuracy = messagesCount > 0
        ? Math.round(((messagesCount - correctionsCount) / messagesCount) * 100)
        : 100;

    const topCorrections = corrections.slice(0, 3);

    // Backdrop variants
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    };

    // Card variants — scale up from center
    const cardVariants = {
        hidden: { opacity: 0, scale: 0.85, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 24,
                staggerChildren: 0.08,
                delayChildren: 0.2,
            },
        },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
    };

    // Stagger child variants
    const childVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 400, damping: 25 },
        },
    };

    const statItems = [
        {
            icon: MessageSquare,
            label: 'Messages',
            value: messagesCount,
            color: 'var(--accent-primary)',
            bg: 'var(--accent-primary-muted)',
        },
        {
            icon: AlertTriangle,
            label: 'Corrections',
            value: correctionsCount,
            color: 'var(--warning)',
            bg: 'var(--warning-muted)',
        },
        {
            icon: Target,
            label: 'Accuracy',
            value: `${accuracy}%`,
            color: accuracy >= 80 ? 'var(--success)' : accuracy >= 50 ? 'var(--warning)' : 'var(--error)',
            bg: accuracy >= 80 ? 'var(--success-muted)' : accuracy >= 50 ? 'var(--warning-muted)' : 'var(--error-muted)',
        },
        {
            icon: Clock,
            label: 'Time',
            value: formatTime(timeSpentSeconds),
            color: 'var(--accent-secondary)',
            bg: 'var(--accent-secondary-muted)',
        },
    ];

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Semi-transparent backdrop */}
                <motion.div
                    className="absolute inset-0"
                    style={{ background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(8px)' }}
                    onClick={onContinue}
                />

                {/* Summary Card */}
                <motion.div
                    className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border)',
                    }}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Gradient Header */}
                    <motion.div
                        className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                        }}
                        variants={childVariants}
                    >
                        {/* Decorative circles */}
                        <div
                            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
                            style={{ background: 'white' }}
                        />
                        <div
                            className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-10"
                            style={{ background: 'white' }}
                        />

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                            className="relative z-10 mx-auto mb-3 w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                        >
                            <Trophy className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
                        </motion.div>

                        <motion.h2
                            className="relative z-10 text-2xl font-black tracking-tight text-white"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            Session Complete!
                        </motion.h2>

                        {/* XP Earned — big animated number */}
                        <motion.div
                            className="relative z-10 mt-4"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.35 }}
                        >
                            <div className="text-5xl font-black text-white tabular-nums tracking-tight">
                                +{animatedXP}
                            </div>
                            <div className="text-sm font-bold uppercase tracking-widest text-white/70 mt-1">
                                XP Earned
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        className="grid grid-cols-2 gap-3 px-5 pt-6 pb-2"
                        variants={childVariants}
                    >
                        {statItems.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: stat.bg, border: `1px solid ${stat.color}20` }}
                                    whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: `${stat.color}20` }}
                                    >
                                        <Icon className="w-4 h-4" style={{ color: stat.color }} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-lg font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                                            {stat.value}
                                        </div>
                                        <div className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Mistakes to Review */}
                    {topCorrections.length > 0 && (
                        <motion.div
                            className="px-5 pt-3 pb-2"
                            variants={childVariants}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
                                    Mistakes to Review
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {topCorrections.map((correction, i) => (
                                    <motion.div
                                        key={i}
                                        className="rounded-xl p-3"
                                        style={{
                                            background: 'var(--error-muted)',
                                            border: '1px solid var(--error)25',
                                        }}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span
                                                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                                                style={{ background: 'var(--error)', color: 'white' }}
                                            >
                                                {i + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    <span className="line-through opacity-60" style={{ color: 'var(--error)' }}>
                                                        {correction.original}
                                                    </span>
                                                    {' → '}
                                                    <span className="font-semibold" style={{ color: 'var(--success)' }}>
                                                        {correction.correction}
                                                    </span>
                                                </p>
                                                <p className="text-[11px] mt-1 italic" style={{ color: 'var(--text-muted)' }}>
                                                    {correction.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        className="px-5 pt-4 pb-6 space-y-2"
                        variants={childVariants}
                    >
                        {topCorrections.length > 0 && (
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl text-sm font-semibold gap-2"
                                style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
                                onClick={onReviewMistakes}
                            >
                                <BookOpen className="w-4 h-4" />
                                Review Mistakes
                            </Button>
                        )}
                        <Button
                            className="w-full h-12 rounded-xl text-sm font-semibold gap-2"
                            onClick={onContinue}
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SessionSummary;