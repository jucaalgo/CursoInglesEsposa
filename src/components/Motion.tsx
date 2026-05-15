import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Page transition wrapper
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AnimatePresence mode="wait">
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    </AnimatePresence>
);

// Staggered list container
export const StaggerContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={{
            visible: { transition: { staggerChildren: 0.06 } },
        }}
        className={className}
    >
        {children}
    </motion.div>
);

// Staggered list item
export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
        }}
        className={className}
    >
        {children}
    </motion.div>
);

// Scale on hover/tap for interactive cards
export const InteractiveCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
    <motion.div
        whileHover={{ y: -2, boxShadow: 'var(--shadow-accent)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={className}
        onClick={onClick}
    >
        {children}
    </motion.div>
);

// Animated score counter
export const AnimatedScore: React.FC<{ score: number; className?: string }> = ({ score, className }) => (
    <motion.div
        key={score}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={className}
    >
        {score}
    </motion.div>
);

// XP popup animation
export const XPPopup: React.FC<{ xp: number; visible: boolean }> = ({ xp, visible }) => (
    <AnimatePresence>
        {visible && (
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="fixed inset-x-0 top-10 flex justify-center z-[100] pointer-events-none"
            >
                <div className="px-6 py-2 rounded-full font-bold shadow-2xl animate-pulse"
                     style={{ background: 'var(--warning)', color: '#000' }}>
                    +{xp} XP
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

// Success checkmark animation
export const SuccessCheck: React.FC<{ visible: boolean; size?: number }> = ({ visible, size = 48 }) => (
    <AnimatePresence>
        {visible && (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
            >
                <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <motion.circle
                            cx="12" cy="12" r="10"
                            style={{ fill: 'var(--success-muted)', stroke: 'var(--success)', strokeWidth: 2 }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                        <motion.path
                            d="M8 12.5L10.5 15L16 9"
                            style={{ stroke: 'var(--success)', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        />
                    </svg>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// Shake animation for wrong answers
export const ShakeWrapper: React.FC<{ shake: boolean; children: React.ReactNode; className?: string }> = ({ shake, children, className }) => (
    <motion.div
        animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className={className}
    >
        {children}
    </motion.div>
);

// Progress bar with animated fill
export const AnimatedProgress: React.FC<{ value: number; max?: number; className?: string; color?: string }> = ({ value, max = 100, className, color }) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className={className} style={{ background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden', height: '6px' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    height: '100%',
                    borderRadius: '9999px',
                    background: color || 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: `0 0 8px ${color || 'var(--accent-primary)'}40`,
                }}
            />
        </div>
    );
};