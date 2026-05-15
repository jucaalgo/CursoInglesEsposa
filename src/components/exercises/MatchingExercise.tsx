import React, { useState, useEffect } from 'react';
import { ChevronRight, Link2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button';
import { InteractiveContent } from '../../types';

interface MatchingExerciseProps {
    content: InteractiveContent;
    onComplete: () => void;
    onAwardXP: (points: number) => void;
    onPlaySound: (type: 'correct' | 'wrong' | 'click') => void;
}

interface MatchedPair {
    word: string;
    match: string;
}

const MatchingExercise: React.FC<MatchingExerciseProps> = ({ content, onComplete, onAwardXP, onPlaySound }) => {
    const [selected, setSelected] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
    const [pairs, setPairs] = useState<Record<string, string>>({});
    const [leftItems, setLeftItems] = useState<string[]>([]);
    const [rightItems, setRightItems] = useState<string[]>([]);
    const [lastMatch, setLastMatch] = useState<'correct' | 'wrong' | null>(null);
    const [wrongPair, setWrongPair] = useState<{ side: 'left' | 'right'; value: string } | null>(null);

    useEffect(() => {
        if (content.wordMatching) {
            setLeftItems([...content.wordMatching.pairs.map(p => p.word)].sort(() => Math.random() - 0.5));
            setRightItems([...content.wordMatching.pairs.map(p => p.match)].sort(() => Math.random() - 0.5));
        }
    }, [content]);

    if (!content.wordMatching) return null;

    const handleMatch = (side: 'left' | 'right', item: string) => {
        onPlaySound('click');

        if (side === 'left') {
            setSelected(prev => ({ ...prev, left: prev.left === item ? null : item }));
            setWrongPair(null);
        } else {
            if (selected.left) {
                const correct = content.wordMatching?.pairs.find(p => p.word === selected.left)?.match === item;
                if (correct) {
                    setPairs(prev => ({ ...prev, [selected.left!]: item }));
                    onAwardXP(10);
                    setLastMatch('correct');
                    setTimeout(() => setLastMatch(null), 600);
                } else {
                    onPlaySound('wrong');
                    setLastMatch('wrong');
                    setWrongPair({ side: 'right', value: item });
                    setTimeout(() => {
                        setLastMatch(null);
                        setWrongPair(null);
                    }, 600);
                }
                setSelected({ left: null, right: null });
            }
        }
    };

    const isComplete = Object.keys(pairs).length === content.wordMatching.pairs.length;
    const matchedPairs: MatchedPair[] = Object.entries(pairs).map(([word, match]) => ({ word, match }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-center p-6 rounded-3xl"
                style={{ background: 'var(--accent-primary-muted)', border: '1px solid var(--accent-primary)' }}
            >
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Match the Pairs
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Connect the English words with their translations
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                    {content.wordMatching.pairs.map((_, i) => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full transition-all duration-300"
                            style={{
                                background: i < matchedPairs.length ? 'var(--success)' : 'var(--bg-tertiary)',
                                boxShadow: i < matchedPairs.length ? '0 0 6px var(--success)' : 'none',
                            }}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Match result feedback */}
            <AnimatePresence>
                {lastMatch === 'correct' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center py-2"
                    >
                        <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>Correct!</span>
                    </motion.div>
                )}
                {lastMatch === 'wrong' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center py-2"
                    >
                        <span className="text-sm font-bold" style={{ color: 'var(--error)' }}>Try again!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Matching Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    {leftItems.map((word, index) => {
                        const isMatched = !!pairs[word];
                        const isSelected = selected.left === word;
                        return (
                            <motion.button
                                key={word}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                disabled={isMatched}
                                onClick={() => handleMatch('left', word)}
                                className="w-full p-4 rounded-2xl text-center font-bold transition-all border-2"
                                style={{
                                    background: isMatched ? 'var(--success-muted)' : isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                    color: isMatched ? 'var(--success)' : isSelected ? 'white' : 'var(--text-primary)',
                                    borderColor: isMatched ? 'var(--success)' : isSelected ? 'var(--accent-primary-hover)' : 'var(--border-default)',
                                    boxShadow: isSelected ? '0 0 16px var(--accent-primary-muted)' : 'none',
                                    opacity: isMatched ? 0.5 : 1,
                                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                                }}
                                whileTap={!isMatched ? { scale: 0.97 } : undefined}
                            >
                                {isMatched && <Check className="w-4 h-4 inline mr-1" />}
                                {word}
                            </motion.button>
                        );
                    })}
                </div>

                <div className="space-y-3">
                    {rightItems.map((match, index) => {
                        const isMatched = Object.values(pairs).includes(match);
                        const isWrong = wrongPair?.side === 'right' && wrongPair.value === match;
                        return (
                            <motion.button
                                key={match}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    ...(isWrong ? { x: [-4, 4, -4, 4, 0] } : {}),
                                }}
                                transition={{ delay: index * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                disabled={isMatched}
                                onClick={() => handleMatch('right', match)}
                                className="w-full p-4 rounded-2xl text-center font-bold transition-all border-2"
                                style={{
                                    background: isMatched ? 'var(--success-muted)' : isWrong ? 'var(--error-muted)' : 'var(--bg-tertiary)',
                                    color: isMatched ? 'var(--success)' : isWrong ? 'var(--error)' : 'var(--text-primary)',
                                    borderColor: isMatched ? 'var(--success)' : isWrong ? 'var(--error)' : 'var(--border-default)',
                                    opacity: isMatched ? 0.5 : 1,
                                }}
                                whileTap={!isMatched ? { scale: 0.97 } : undefined}
                            >
                                {isMatched && <Check className="w-4 h-4 inline mr-1" />}
                                {match}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Completion */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <Button
                            onClick={onComplete}
                            className="w-full h-14 rounded-2xl text-lg font-bold"
                            style={{ background: 'var(--success)', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)' }}
                        >
                            Amazing! Next Section <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MatchingExercise;