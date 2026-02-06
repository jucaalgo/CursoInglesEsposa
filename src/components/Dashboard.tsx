import React from 'react';
import { motion } from 'framer-motion';
import {
    Sun, Moon, Settings, LogOut, BookOpen, Target,
    Flame, Award, BarChart3, Play, Loader2, Zap
} from 'lucide-react';
import { UserProfile, Course, Module } from '../../types';
import StreakCounter from './StreakCounter';
import ProgressRing from './ProgressRing';
import ModuleCard from './ModuleCard';
import AchievementBadge from './AchievementBadge';

interface DashboardProps {
    user: UserProfile;
    course: Course | null;
    isLoadingCourse: boolean;
    currentStreak: number;
    longestStreak: number;
    hasActivityToday: boolean;
    totalXP: number;
    level: number;
    levelProgress: number;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    onOpenSettings: () => void;
    onLogout: () => void;
    onOpenModule: (moduleId: string) => void;
    onStartQuickPractice?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    user,
    course,
    isLoadingCourse,
    currentStreak,
    longestStreak,
    hasActivityToday,
    totalXP,
    level,
    levelProgress,
    isDarkMode,
    onToggleDarkMode,
    onOpenSettings,
    onLogout,
    onOpenModule,
    onStartQuickPractice
}) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '¡Buenos días';
        if (hour < 18) return '¡Buenas tardes';
        return '¡Buenas noches';
    };

    const completedModules = course?.modules.filter(m => m.isCompleted).length || 0;
    const totalModules = course?.modules.length || 0;
    const courseProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-greeting">
                    <h1>{getGreeting()}, <span className="user-name">{user.name}</span>! 👋</h1>
                    <p className="user-level">Nivel {user.currentLevel} → {user.targetLevel}</p>
                </div>

                <div className="dashboard-actions">
                    <motion.button
                        className="action-btn"
                        onClick={onToggleDarkMode}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.button>
                    <motion.button
                        className="action-btn"
                        onClick={onOpenSettings}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Settings size={20} />
                    </motion.button>
                    <motion.button
                        className="action-btn logout"
                        onClick={onLogout}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <LogOut size={20} />
                    </motion.button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="dashboard-stats">
                {/* Streak */}
                <motion.div
                    className="stat-card streak"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <StreakCounter
                        currentStreak={currentStreak}
                        longestStreak={longestStreak}
                        hasActivityToday={hasActivityToday}
                    />
                </motion.div>

                {/* Level Progress */}
                <motion.div
                    className="stat-card level"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <ProgressRing
                        progress={levelProgress}
                        size={100}
                        color="#3B82F6"
                    >
                        <div className="level-badge">
                            <Zap size={20} />
                            <span>{level}</span>
                        </div>
                    </ProgressRing>
                    <div className="stat-info">
                        <span className="stat-label">Nivel</span>
                        <span className="stat-value">{totalXP} XP</span>
                    </div>
                </motion.div>

                {/* Course Progress */}
                <motion.div
                    className="stat-card progress"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <ProgressRing
                        progress={courseProgress}
                        size={100}
                        label="Curso"
                    />
                    <div className="stat-info">
                        <span className="stat-label">Módulos</span>
                        <span className="stat-value">{completedModules}/{totalModules}</span>
                    </div>
                </motion.div>

                {/* Quick Practice */}
                <motion.div
                    className="stat-card quick-practice"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={onStartQuickPractice}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="quick-practice-content">
                        <Play size={32} />
                        <span>Práctica Rápida</span>
                    </div>
                </motion.div>
            </div>

            {/* Recent Achievements */}
            <section className="dashboard-achievements">
                <h2><Award size={20} /> Logros Recientes</h2>
                <div className="achievements-row">
                    <AchievementBadge type="first_lesson" unlocked={completedModules > 0} size="md" />
                    <AchievementBadge type="streak_3" unlocked={longestStreak >= 3} size="md" />
                    <AchievementBadge type="streak_7" unlocked={longestStreak >= 7} size="md" />
                    <AchievementBadge type="module_complete" unlocked={completedModules >= 1} size="md" />
                </div>
            </section>

            {/* Course Modules */}
            <section className="dashboard-modules">
                <h2><BookOpen size={20} /> Tu Curso</h2>

                {isLoadingCourse ? (
                    <div className="loading-course">
                        <Loader2 className="spinning" size={40} />
                        <p>Generando tu curso personalizado...</p>
                        <p className="loading-subtitle">Esto puede tomar unos segundos</p>
                    </div>
                ) : course ? (
                    <div className="modules-grid">
                        {course.modules.slice(0, 12).map((module, index) => (
                            <ModuleCard
                                key={module.id}
                                module={module}
                                index={index}
                                isLocked={index > 0 && !course.modules[index - 1]?.isCompleted}
                                onClick={() => onOpenModule(module.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-course">
                        <Target size={48} />
                        <p>No hay curso disponible</p>
                        <p className="no-course-subtitle">Configura tu API Key en ajustes</p>
                    </div>
                )}

                {course && course.modules.length > 12 && (
                    <div className="modules-more">
                        <span>+{course.modules.length - 12} módulos más</span>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
