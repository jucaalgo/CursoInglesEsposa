import React, { useState } from 'react';
import { Mic, Award, Loader2, Volume2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import Button from '../Button';
import AudioRecorder from '../AudioRecorder';
import PronunciationHeatmap from '../PronunciationHeatmap';
import { InteractiveContent, PronunciationAnalysis } from '../../types';
import { evaluatePronunciation } from '../../services/gemini';

interface PronunciationExerciseProps {
    content: InteractiveContent;
    currentLevel: string;
    onComplete: () => void;
    onAwardXP: (points: number) => void;
    onPlaySound: (type: 'correct' | 'wrong' | 'click') => void;
    onPlayTTS: (text: string) => void;
}

const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--error)';
};

const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great!';
    if (score >= 70) return 'Good!';
    if (score >= 50) return 'Keep Practicing';
    return 'Try Again';
};

const PronunciationExercise: React.FC<PronunciationExerciseProps> = ({
    content,
    currentLevel,
    onComplete,
    onAwardXP,
    onPlaySound,
    onPlayTTS
}) => {
    const [result, setResult] = useState<PronunciationAnalysis | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [showScore, setShowScore] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const handlePronunciationTest = async (audioBase64: string) => {
        setIsEvaluating(true);
        setResult(null);
        setShowScore(false);
        try {
            const targetPhrase = content.conversation.turns[0]?.text || "Hello, how are you?";
            const analysis = await evaluatePronunciation(targetPhrase, audioBase64, currentLevel);
            setResult(analysis);
            setAttempts(prev => prev + 1);

            // Delayed score reveal for dramatic effect
            setTimeout(() => setShowScore(true), 300);

            if (analysis.score >= 70) {
                onAwardXP(15);
            } else {
                onPlaySound('wrong');
            }
        } catch (error) {
            console.error("Pronunciation evaluation failed", error);
            setResult({ phrase: "", score: 0, feedback: "Evaluation failed. Please try again.", words: [] });
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleRetry = () => {
        setResult(null);
        setShowScore(false);
    };

    return (
        <div className="text-center space-y-8 py-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
            >
                <motion.div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto relative overflow-hidden"
                    style={{ background: 'var(--accent-primary)', boxShadow: 'var(--shadow-accent)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform" />
                    <Mic className="w-10 h-10 text-white relative z-10" />
                </motion.div>
                <h2 className="text-2xl font-black italic tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    THE FINAL CHALLENGE
                </h2>
                <p className="uppercase text-xs font-bold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                    Record your pronunciation
                </p>
            </motion.div>

            {/* Target Phrase */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="max-w-md mx-auto p-8 rounded-[2rem] space-y-4"
                style={{ background: 'var(--bg-tertiary)', border: '2px solid var(--border-default)' }}
            >
                <p className="text-2xl font-bold uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                    "{content.conversation.turns[0]?.text || 'Hello, world!'}"
                </p>
                <button
                    onClick={() => onPlayTTS(content.conversation.turns[0]?.text || 'Hello')}
                    className="inline-flex items-center gap-2 transition-colors font-bold text-sm underline underline-offset-4"
                    style={{ color: 'var(--accent-primary)' }}
                >
                    <Volume2 className="w-4 h-4" />
                    LISTEN FIRST
                </button>
            </motion.div>

            {/* Recorder */}
            {!result && !isEvaluating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center pb-4"
                >
                    <AudioRecorder onRecordingComplete={handlePronunciationTest} />
                </motion.div>
            )}

            {/* Evaluating State */}
            {isEvaluating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 py-6"
                >
                    <div className="relative w-24 h-24 mx-auto">
                        <motion.div
                            className="w-24 h-24 rounded-full"
                            style={{ border: '3px solid var(--accent-primary-muted)' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                            <div className="absolute inset-0 rounded-full"
                                 style={{
                                     background: 'conic-gradient(var(--accent-primary) 0deg, transparent 120deg)',
                                 }}
                            />
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Mic className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                        </div>
                    </div>
                    <p className="font-bold uppercase tracking-widest text-xs" style={{ color: 'var(--text-muted)' }}>
                        ANALYZING SPEECH...
                    </p>
                </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
                {result && showScore && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="space-y-6"
                    >
                        {/* Score Circle */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                            className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full border-4 shadow-2xl relative"
                            style={{
                                borderColor: getScoreColor(result.score),
                                background: `${getScoreColor(result.score)}10`,
                                boxShadow: `0 0 40px ${getScoreColor(result.score)}20`,
                            }}
                        >
                            {/* Animated ring */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                                <motion.circle
                                    cx="80" cy="80" r="74"
                                    fill="none"
                                    stroke={getScoreColor(result.score)}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: result.score / 100 }}
                                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                                />
                            </svg>
                            <span className="text-5xl font-black" style={{ color: getScoreColor(result.score) }}>
                                {result.score}%
                            </span>
                            <span className="text-xs uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                {getScoreLabel(result.score)}
                            </span>
                        </motion.div>

                        {/* Feedback */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="max-w-sm mx-auto font-medium leading-relaxed italic"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            "{result.feedback}"
                        </motion.p>

                        {/* Heatmap */}
                        {result.words && result.words.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <PronunciationHeatmap
                                    words={result.words}
                                    score={result.score}
                                />
                            </motion.div>
                        )}

                        {/* Retry or Complete */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="flex flex-col sm:flex-row gap-3 justify-center"
                        >
                            <Button
                                onClick={handleRetry}
                                className="h-12 px-6 rounded-xl"
                                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                            </Button>
                            <Button
                                onClick={onComplete}
                                className="h-14 px-8 text-lg rounded-2xl font-bold"
                                style={{
                                    background: result.score >= 70
                                        ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                                        : 'var(--bg-tertiary)',
                                    boxShadow: result.score >= 70 ? 'var(--shadow-accent)' : 'none',
                                }}
                            >
                                <Award className="w-5 h-5 mr-2" />
                                {result.score >= 70 ? 'CLAIM REWARDS' : 'CONTINUE'}
                            </Button>
                        </motion.div>

                        {/* Attempts counter */}
                        {attempts > 1 && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Attempt #{attempts} • Best score: {result.score}%
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PronunciationExercise;