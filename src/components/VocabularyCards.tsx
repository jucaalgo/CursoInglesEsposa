import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Check, X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { VocabularyItem } from '../../types';
import { generateSpeech, playRawAudio } from '../services/gemini';

interface VocabularyCardsProps {
    vocabulary: VocabularyItem[];
    onComplete: () => void;
    voiceName?: string;
}

const VocabularyCards: React.FC<VocabularyCardsProps> = ({
    vocabulary,
    onComplete,
    voiceName = 'Kore'
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
    const [isPlaying, setIsPlaying] = useState(false);
    const [direction, setDirection] = useState(0);

    const currentWord = vocabulary[currentIndex];
    const progress = ((currentIndex + 1) / vocabulary.length) * 100;

    const playPronunciation = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            const audio = await generateSpeech(currentWord.term, voiceName);
            await playRawAudio(audio);
        } catch (e) {
            console.error('TTS error:', e);
        } finally {
            setIsPlaying(false);
        }
    };

    const handleKnow = () => {
        setKnownWords(prev => new Set(prev).add(currentWord.id));
        goToNext();
    };

    const handleDontKnow = () => {
        goToNext();
    };

    const goToNext = () => {
        if (currentIndex < vocabulary.length - 1) {
            setDirection(1);
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        } else {
            onComplete();
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 200);
        }
    };

    const flipCard = () => {
        setIsFlipped(!isFlipped);
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            rotateY: direction > 0 ? 45 : -45
        }),
        center: {
            x: 0,
            opacity: 1,
            rotateY: 0
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            rotateY: direction < 0 ? 45 : -45
        })
    };

    return (
        <div className="vocabulary-cards">
            {/* Progress bar */}
            <div className="vocab-progress">
                <div className="vocab-progress-bar">
                    <motion.div
                        className="vocab-progress-fill"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <span className="vocab-progress-text">
                    {currentIndex + 1} / {vocabulary.length}
                </span>
            </div>

            {/* Navigation */}
            <div className="vocab-navigation">
                <button
                    className="vocab-nav-btn"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Card container */}
                <div className="vocab-card-container">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className={`vocab-card ${isFlipped ? 'flipped' : ''}`}
                            onClick={flipCard}
                        >
                            <div className="vocab-card-inner">
                                {/* Front - Term */}
                                <div className="vocab-card-front">
                                    <motion.button
                                        className="vocab-audio-btn"
                                        onClick={(e) => { e.stopPropagation(); playPronunciation(); }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        disabled={isPlaying}
                                    >
                                        <Volume2 size={24} className={isPlaying ? 'playing' : ''} />
                                    </motion.button>

                                    <h2 className="vocab-term">{currentWord.term}</h2>
                                    <span className="vocab-hint">Toca para ver definición</span>
                                </div>

                                {/* Back - Definition */}
                                <div className="vocab-card-back">
                                    <h3 className="vocab-definition-label">Definición:</h3>
                                    <p className="vocab-definition">{currentWord.definition}</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <button
                    className="vocab-nav-btn"
                    onClick={goToNext}
                    disabled={currentIndex === vocabulary.length - 1}
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Action buttons */}
            <div className="vocab-actions">
                <motion.button
                    className="vocab-action-btn dont-know"
                    onClick={handleDontKnow}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <X size={20} />
                    <span>No la sé</span>
                </motion.button>

                <motion.button
                    className="vocab-action-btn flip"
                    onClick={flipCard}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <RotateCcw size={20} />
                    <span>Voltear</span>
                </motion.button>

                <motion.button
                    className="vocab-action-btn know"
                    onClick={handleKnow}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Check size={20} />
                    <span>¡La sé!</span>
                </motion.button>
            </div>

            {/* Known counter */}
            <div className="vocab-known-counter">
                <span>Palabras conocidas: {knownWords.size}/{vocabulary.length}</span>
            </div>
        </div>
    );
};

export default VocabularyCards;
