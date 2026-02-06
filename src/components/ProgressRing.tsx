import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    showLabel?: boolean;
    label?: string;
    children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 120,
    strokeWidth = 10,
    color = '#22C55E',
    bgColor = '#E5E7EB',
    showLabel = true,
    label,
    children
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    // Gradient colors based on progress
    const getProgressColor = () => {
        if (progress < 33) return '#EF4444'; // Red
        if (progress < 66) return '#F59E0B'; // Yellow
        return '#22C55E'; // Green
    };

    const dynamicColor = color === '#22C55E' ? getProgressColor() : color;

    return (
        <div className="progress-ring-container" style={{ width: size, height: size }}>
            <svg
                className="progress-ring"
                width={size}
                height={size}
            >
                <defs>
                    <linearGradient id={`gradient-${progress}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={dynamicColor} />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>

                {/* Background circle */}
                <circle
                    className="progress-ring-bg"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />

                {/* Progress circle */}
                <motion.circle
                    className="progress-ring-progress"
                    stroke={`url(#gradient-${progress})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%'
                    }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>

            <div className="progress-ring-content">
                {children || (
                    showLabel && (
                        <div className="progress-ring-label">
                            <motion.span
                                className="progress-percentage"
                                key={progress}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                            >
                                {Math.round(progress)}%
                            </motion.span>
                            {label && <span className="progress-text">{label}</span>}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default ProgressRing;
