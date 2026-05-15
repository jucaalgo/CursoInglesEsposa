import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import {
    GraduationCap,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Check,
    BookOpen,
    Plane,
    Cpu,
    HeartPulse,
    Palette,
    Trophy,
    Music,
    Utensils,
    FlaskConical,
    Film,
    Shirt,
    Scale,
    Loader2,
} from 'lucide-react';

// ── Interest config ──────────────────────────────────────────────────
const INTERESTS = [
    { id: 'Business', icon: BookOpen, color: '#6366f1' },
    { id: 'Travel', icon: Plane, color: '#3b82f6' },
    { id: 'Technology', icon: Cpu, color: '#8b5cf6' },
    { id: 'Medicine', icon: HeartPulse, color: '#ef4444' },
    { id: 'Art', icon: Palette, color: '#f59e0b' },
    { id: 'Sports', icon: Trophy, color: '#22c55e' },
    { id: 'Music', icon: Music, color: '#ec4899' },
    { id: 'Food', icon: Utensils, color: '#f97316' },
    { id: 'Science', icon: FlaskConical, color: '#06b6d4' },
    { id: 'Movies', icon: Film, color: '#a855f7' },
    { id: 'Fashion', icon: Shirt, color: '#e879f9' },
    { id: 'Law', icon: Scale, color: '#64748b' },
] as const;

// ── Placement quiz questions ───────────────────────────────────────────
interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    level: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
    // A1 (questions 1-3)
    {
        question: 'I ___ a student.',
        options: ['am', 'is', 'are', 'be'],
        correctIndex: 0,
        level: 'A1',
    },
    {
        question: 'She ___ to school every day.',
        options: ['go', 'goes', 'going', 'gone'],
        correctIndex: 1,
        level: 'A1',
    },
    {
        question: 'There ___ many books on the shelf.',
        options: ['is', 'am', 'are', 'be'],
        correctIndex: 2,
        level: 'A1',
    },
    // A2 (questions 4-5)
    {
        question: 'If it ___ tomorrow, we\'ll stay home.',
        options: ['rains', 'will rain', 'raining', 'rain'],
        correctIndex: 0,
        level: 'A2',
    },
    {
        question: 'Can you ___ me the way to the station?',
        options: ['say', 'tell', 'speak', 'talk'],
        correctIndex: 1,
        level: 'A2',
    },
    // B1 (questions 6-7)
    {
        question: 'I wish I ___ speak French.',
        options: ['can', 'could', 'would', 'should'],
        correctIndex: 1,
        level: 'B1',
    },
    {
        question: 'She\'s the woman ___ son won the prize.',
        options: ['which', 'who', 'whose', 'whom'],
        correctIndex: 2,
        level: 'B1',
    },
    // B2 (questions 8-9)
    {
        question: 'Not until I ___ finished will I rest.',
        options: ['have', 'has', 'had', 'will have'],
        correctIndex: 0,
        level: 'B2',
    },
    {
        question: 'Had I known, I ___ differently.',
        options: ['would act', 'would have acted', 'will act', 'acted'],
        correctIndex: 1,
        level: 'B2',
    },
    // C1 (question 10)
    {
        question: 'At no time ___ aware of the danger.',
        options: ['was he', 'he was', 'did he be', 'he had been'],
        correctIndex: 0,
        level: 'C1',
    },
];

// ── Level result config ───────────────────────────────────────────────
const LEVEL_RESULTS: Record<string, { label: string; description: string; color: string }> = {
    A1: {
        label: 'Beginner',
        description: 'You\'re just starting your English journey. We\'ll build a strong foundation with essential vocabulary and basic grammar.',
        color: '#22c55e',
    },
    A2: {
        label: 'Elementary',
        description: 'You have the basics down! Time to expand your vocabulary and tackle more everyday conversations with confidence.',
        color: '#3b82f6',
    },
    B1: {
        label: 'Intermediate',
        description: 'You can handle most everyday situations. Let\'s sharpen your fluency and push into more complex topics and expressions.',
        color: '#8b5cf6',
    },
    B2: {
        label: 'Upper Intermediate',
        description: 'Impressive! You can communicate effectively. Now we\'ll refine your accuracy and help you master nuanced language.',
        color: '#f59e0b',
    },
    C1: {
        label: 'Advanced',
        description: 'Outstanding! You have near-native command. We\'ll polish the finer points and help you achieve complete mastery.',
        color: '#ef4444',
    },
};

// ── Animation helpers ─────────────────────────────────────────────────
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

// ── Main component ────────────────────────────────────────────────────
const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const { profile, updateProfile } = useUserProfile();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);

    // Step 2 state
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    // Step 3 state
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswering, setIsAnswering] = useState(false);

    // Step 4 state
    const [calculatedLevel, setCalculatedLevel] = useState('A1');
    const [isSaving, setIsSaving] = useState(false);

    // Sync interests from profile
    useEffect(() => {
        if (profile?.interests?.length) {
            setSelectedInterests(profile.interests.slice(0, 5));
        }
    }, [profile]);

    const goForward = () => {
        setDirection(1);
        setStep((s) => Math.min(s + 1, 4));
    };

    const goBack = () => {
        setDirection(-1);
        setStep((s) => Math.max(s - 1, 1));
    };

    // ── Interest toggle ─────────────────────────────────────────────
    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) => {
            if (prev.includes(id)) return prev.filter((i) => i !== id);
            if (prev.length >= 5) return prev;
            return [...prev, id];
        });
    };

    // ── Quiz answer handler ─────────────────────────────────────────
    const handleAnswer = (optionIndex: number) => {
        if (isAnswering) return;
        setIsAnswering(true);
        setSelectedOption(optionIndex);

        const newAnswers = [...answers, optionIndex];
        setAnswers(newAnswers);

        const isCorrect = optionIndex === QUIZ_QUESTIONS[currentQuestion].correctIndex;

        setTimeout(() => {
            if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
                setCurrentQuestion((q) => q + 1);
                setSelectedOption(null);
                setIsAnswering(false);
            } else {
                // Calculate level
                const score = newAnswers.reduce(
                    (acc, ans, idx) => (ans === QUIZ_QUESTIONS[idx].correctIndex ? acc + 1 : acc),
                    0,
                );
                let level: string;
                if (score <= 3) level = 'A1';
                else if (score <= 5) level = 'A2';
                else if (score <= 7) level = 'B1';
                else if (score <= 9) level = 'B2';
                else level = 'C1';

                setCalculatedLevel(level);
                setIsAnswering(false);
                goForward();
            }
        }, 800);
    };

    // ── Finish onboarding ───────────────────────────────────────────
    const handleFinish = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            await updateProfile({
                ...profile,
                current_level: calculatedLevel,
                target_level: calculatedLevel === 'C1' ? 'C2' : calculatedLevel === 'C2' ? 'C2' : 'B2',
                interests: selectedInterests,
            });
            navigate('/academy');
        } catch {
            setIsSaving(false);
        }
    };

    // ── Score for progress bar ─────────────────────────────────────
    const quizProgress = ((currentQuestion + (answers.length > currentQuestion ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100;
    const score = answers.reduce(
        (acc, ans, idx) => (ans === QUIZ_QUESTIONS[idx].correctIndex ? acc + 1 : acc),
        0,
    );

    // ── Step counter ────────────────────────────────────────────────
    const StepCounter = () => (
        <p
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-center"
            style={{ color: 'var(--text-muted)' }}
        >
            Step {step} of 4
        </p>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="w-full max-w-lg">
                <StepCounter />

                <AnimatePresence mode="wait" custom={direction}>
                    {/* ── STEP 1: Welcome ──────────────────────────────────── */}
                    {step === 1 && (
                        <motion.div
                            key="welcome"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="mt-8 flex flex-col items-center text-center space-y-8"
                        >
                            {/* Gradient icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                                className="relative"
                            >
                                <div
                                    className="w-28 h-28 rounded-[2rem] flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                        boxShadow: '0 0 40px var(--accent-primary-muted), 0 0 80px var(--accent-primary-muted)',
                                    }}
                                >
                                    <GraduationCap className="w-14 h-14 text-white" />
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'var(--bg-secondary)', border: '2px solid var(--accent-primary)' }}
                                >
                                    <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                </motion.div>
                            </motion.div>

                            <motion.div className="space-y-4" variants={fadeUp} initial="hidden" animate="visible">
                                <h1
                                    className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    WELCOME TO{' '}
                                    <span style={{ color: 'var(--accent-primary)' }}>PROFESORIA</span>
                                </h1>
                                <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Let&apos;s find your English level
                                </p>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    A quick quiz and a few questions will help us personalize your learning journey.
                                </p>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                onClick={goForward}
                                className="flex items-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold uppercase tracking-wider text-white transition-all duration-300 group"
                                style={{
                                    background: 'var(--accent-primary)',
                                    boxShadow: 'var(--shadow-accent)',
                                }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                LET&apos;S BEGIN
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Interests ─────────────────────────────────── */}
                    {step === 2 && (
                        <motion.div
                            key="interests"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="mt-8 space-y-8"
                        >
                            <div className="text-center space-y-3">
                                <h2
                                    className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    WHAT ARE YOU{' '}
                                    <span style={{ color: 'var(--accent-primary)' }}>INTERESTED IN?</span>
                                </h2>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                    Choose 1-5 topics to personalize your learning path
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--accent-primary)' }}>
                                    {selectedInterests.length} of 5 selected
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {INTERESTS.map((interest, i) => {
                                    const isSelected = selectedInterests.includes(interest.id);
                                    const isDisabled = !isSelected && selectedInterests.length >= 5;
                                    const Icon = interest.icon;

                                    return (
                                        <motion.button
                                            key={interest.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06, duration: 0.4 }}
                                            onClick={() => !isDisabled && toggleInterest(interest.id)}
                                            disabled={isDisabled}
                                            className="relative p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300"
                                            style={{
                                                background: isSelected
                                                    ? interest.color + '15'
                                                    : 'var(--bg-card)',
                                                border: isSelected
                                                    ? `2px solid ${interest.color}`
                                                    : '1px solid var(--border-default)',
                                                opacity: isDisabled ? 0.4 : 1,
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                boxShadow: isSelected ? `0 0 20px ${interest.color}30` : 'none',
                                            }}
                                            whileHover={!isDisabled ? { scale: 1.04 } : {}}
                                            whileTap={!isDisabled ? { scale: 0.96 } : {}}
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                                    style={{ background: interest.color }}
                                                >
                                                    <Check className="w-3 h-3 text-white" />
                                                </motion.div>
                                            )}
                                            <Icon
                                                className="w-6 h-6"
                                                style={{ color: isSelected ? interest.color : 'var(--text-muted)' }}
                                            />
                                            <span
                                                className="text-xs font-bold uppercase tracking-wider"
                                                style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                            >
                                                {interest.id}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all duration-300"
                                    style={{
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-muted)',
                                        border: '1px solid var(--border-default)',
                                    }}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    BACK
                                </button>
                                <button
                                    onClick={goForward}
                                    disabled={selectedInterests.length === 0}
                                    className="flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider text-white transition-all duration-300 group"
                                    style={{
                                        background: selectedInterests.length > 0 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                        boxShadow: selectedInterests.length > 0 ? 'var(--shadow-accent)' : 'none',
                                        opacity: selectedInterests.length === 0 ? 0.5 : 1,
                                        cursor: selectedInterests.length === 0 ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    CONTINUE
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: Placement Quiz ─────────────────────────────── */}
                    {step === 3 && (
                        <motion.div
                            key="quiz"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="mt-8 space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <h2
                                    className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    PLACEMENT{' '}
                                    <span style={{ color: 'var(--accent-primary)' }}>QUIZ</span>
                                </h2>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    Answer each question to determine your level
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                                        Question {currentQuestion + 1} / {QUIZ_QUESTIONS.length}
                                    </span>
                                    <span
                                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                        style={{
                                            background: 'var(--accent-primary-muted)',
                                            color: 'var(--accent-primary)',
                                        }}
                                    >
                                        {QUIZ_QUESTIONS[currentQuestion].level}
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${quizProgress}%` }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}
                                    />
                                </div>
                            </div>

                            {/* Question card */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentQuestion}
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-6 md:p-8 rounded-2xl space-y-6"
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-default)',
                                        backdropFilter: 'blur(12px)',
                                    }}
                                >
                                    <p className="text-xl md:text-2xl font-bold text-center leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                        {QUIZ_QUESTIONS[currentQuestion].question}
                                    </p>

                                    <div className="grid grid-cols-1 gap-3">
                                        {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => {
                                            const isSelected = selectedOption === idx;
                                            const isCorrect = idx === QUIZ_QUESTIONS[currentQuestion].correctIndex;
                                            const showResult = selectedOption !== null;

                                            let bgColor = 'var(--bg-tertiary)';
                                            let borderColor = 'var(--border-default)';
                                            let textColor = 'var(--text-secondary)';

                                            if (showResult && isSelected && isCorrect) {
                                                bgColor = 'var(--success-muted)';
                                                borderColor = 'var(--success)';
                                                textColor = 'var(--success)';
                                            } else if (showResult && isSelected && !isCorrect) {
                                                bgColor = 'var(--error-muted)';
                                                borderColor = 'var(--error)';
                                                textColor = 'var(--error)';
                                            } else if (showResult && !isSelected && isCorrect) {
                                                bgColor = 'var(--success-muted)';
                                                borderColor = 'var(--success)';
                                                textColor = 'var(--success)';
                                            }

                                            return (
                                                <motion.button
                                                    key={idx}
                                                    onClick={() => handleAnswer(idx)}
                                                    disabled={isAnswering}
                                                    className="w-full p-4 rounded-xl text-left font-medium transition-all duration-200 flex items-center gap-3"
                                                    style={{
                                                        background: bgColor,
                                                        border: `2px solid ${borderColor}`,
                                                        color: textColor,
                                                        cursor: isAnswering ? 'default' : 'pointer',
                                                    }}
                                                    whileHover={!isAnswering ? { scale: 1.01 } : {}}
                                                    whileTap={!isAnswering ? { scale: 0.98 } : {}}
                                                >
                                                    <span
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                                        style={{
                                                            background: showResult && isSelected
                                                                ? borderColor
                                                                : 'var(--bg-card)',
                                                            color: showResult && isSelected
                                                                ? '#fff'
                                                                : 'var(--text-muted)',
                                                            border: showResult && isSelected
                                                                ? 'none'
                                                                : '1px solid var(--border-default)',
                                                        }}
                                                    >
                                                        {showResult && isSelected && isCorrect ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : showResult && isSelected && !isCorrect ? (
                                                            '✗'
                                                        ) : (
                                                            String.fromCharCode(65 + idx)
                                                        )}
                                                    </span>
                                                    {option}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* ── STEP 4: Results ─────────────────────────────────────── */}
                    {step === 4 && (
                        <motion.div
                            key="results"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="mt-8 flex flex-col items-center text-center space-y-8"
                        >
                            {(() => {
                                const result = LEVEL_RESULTS[calculatedLevel];
                                return (
                                    <>
                                        {/* Level badge */}
                                        <motion.div
                                            initial={{ scale: 0, rotate: -10 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
                                            className="relative"
                                        >
                                            <div
                                                className="w-36 h-36 rounded-[2rem] flex flex-col items-center justify-center"
                                                style={{
                                                    background: `linear-gradient(135deg, ${result.color}20, ${result.color}05)`,
                                                    border: `3px solid ${result.color}`,
                                                    boxShadow: `0 0 40px ${result.color}30, 0 0 80px ${result.color}10`,
                                                }}
                                            >
                                                <span
                                                    className="text-5xl font-black italic"
                                                    style={{ color: result.color }}
                                                >
                                                    {calculatedLevel}
                                                </span>
                                                <span
                                                    className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    {result.label}
                                                </span>
                                            </div>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                                                className="absolute -bottom-3 -right-3 w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ background: result.color, boxShadow: `0 0 20px ${result.color}50` }}
                                            >
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </motion.div>
                                        </motion.div>

                                        <motion.div
                                            className="space-y-4"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5, duration: 0.5 }}
                                        >
                                            <h2
                                                className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                YOU&apos;RE{' '}
                                                <span style={{ color: result.color }}>{result.label}</span>
                                            </h2>
                                            <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                                                {result.description}
                                            </p>
                                        </motion.div>

                                        {/* Score summary */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7, duration: 0.5 }}
                                            className="w-full max-w-sm p-4 rounded-2xl"
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-default)',
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                                                    Quiz Score
                                                </span>
                                                <span className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                                                    {score} / {QUIZ_QUESTIONS.length}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(score / QUIZ_QUESTIONS.length) * 100}%` }}
                                                    transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                                    style={{ background: `linear-gradient(90deg, ${result.color}, var(--accent-secondary))` }}
                                                />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="space-y-2 w-full max-w-sm"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.9, duration: 0.5 }}
                                        >
                                            <div
                                                className="p-4 rounded-2xl text-center"
                                                style={{
                                                    background: 'var(--accent-primary-muted)',
                                                    border: '1px solid var(--accent-primary)',
                                                }}
                                            >
                                                <p className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                                                    Your personalized course is ready!
                                                </p>
                                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                    We&apos;ve tailored lessons to match your level and interests.
                                                </p>
                                            </div>
                                        </motion.div>

                                        <motion.button
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 1.1, duration: 0.5 }}
                                            onClick={handleFinish}
                                            disabled={isSaving}
                                            className="flex items-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold uppercase tracking-wider text-white transition-all duration-300 group"
                                            style={{
                                                background: 'var(--accent-primary)',
                                                boxShadow: 'var(--shadow-accent)',
                                                opacity: isSaving ? 0.7 : 1,
                                                cursor: isSaving ? 'wait' : 'pointer',
                                            }}
                                            whileHover={!isSaving ? { scale: 1.03 } : {}}
                                            whileTap={!isSaving ? { scale: 0.97 } : {}}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    SAVING...
                                                </>
                                            ) : (
                                                <>
                                                    START LEARNING
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </motion.button>
                                    </>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;