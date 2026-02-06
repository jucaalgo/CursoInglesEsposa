import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { PronunciationResult } from '../../types';
import { evaluatePronunciation, generateSpeech, playRawAudio, blobToBase64 } from '../services/gemini';
import { useAudio } from '../hooks/useAudio';

interface PronunciationLabProps {
    targetPhrase: string;
    translation?: string;
    userLevel: string;
    voiceName?: string;
    onComplete: (score: number) => void;
}

const PronunciationLab: React.FC<PronunciationLabProps> = ({
    targetPhrase,
    translation,
    userLevel,
    voiceName = 'Kore',
    onComplete
}) => {
    const [result, setResult] = useState<PronunciationResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isPlayingTarget, setIsPlayingTarget] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording,
        getBase64Audio,
        clearRecording
    } = useAudio();

    const playTargetAudio = async () => {
        if (isPlayingTarget) return;
        setIsPlayingTarget(true);
        try {
            const audio = await generateSpeech(targetPhrase, voiceName);
            await playRawAudio(audio);
        } catch (e) {
            console.error('TTS error:', e);
        } finally {
            setIsPlayingTarget(false);
        }
    };

    const handleEvaluate = async () => {
        if (!audioBlob) return;

        setIsEvaluating(true);
        try {
            const base64 = await getBase64Audio();
            if (base64) {
                const evaluation = await evaluatePronunciation(targetPhrase, base64, userLevel);
                setResult(evaluation);
                setAttempts(prev => prev + 1);
            }
        } catch (e) {
            console.error('Evaluation error:', e);
            setResult({
                score: 0,
                feedback: 'Error al evaluar. Por favor intenta de nuevo.',
                words: []
            });
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleRetry = () => {
        setResult(null);
        clearRecording();
    };

    const handleComplete = () => {
        if (result) {
            onComplete(result.score);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'var(--color-success)';
        if (score >= 60) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    const getScoreEmoji = (score: number) => {
        if (score >= 90) return '🌟';
        if (score >= 80) return '👏';
        if (score >= 60) return '👍';
        if (score >= 40) return '💪';
        return '🔄';
    };

    return (
        <div className="pronunciation-lab">
            {/* Target phrase */}
            <div className="plab-target">
                <div className="plab-target-header">
                    <span className="plab-label">Di esta frase:</span>
                    <motion.button
                        className="plab-listen-btn"
                        onClick={playTargetAudio}
                        disabled={isPlayingTarget}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Volume2 size={20} className={isPlayingTarget ? 'playing' : ''} />
                        <span>Escuchar</span>
                    </motion.button>
                </div>

                <h2 className="plab-phrase">{targetPhrase}</h2>
                {translation && (
                    <p className="plab-translation">{translation}</p>
                )}
            </div>

            {/* Recording section */}
            {!result && (
                <div className="plab-recording">
                    <motion.button
                        className={`plab-record-btn ${isRecording ? 'recording' : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={isRecording ? {
                            boxShadow: [
                                '0 0 0 0 rgba(239, 68, 68, 0.4)',
                                '0 0 0 20px rgba(239, 68, 68, 0)',
                            ]
                        } : {}}
                        transition={isRecording ? { repeat: Infinity, duration: 1 } : {}}
                    >
                        {isRecording ? (
                            <>
                                <MicOff size={32} />
                                <span>Detener</span>
                            </>
                        ) : (
                            <>
                                <Mic size={32} />
                                <span>Grabar</span>
                            </>
                        )}
                    </motion.button>

                    {audioBlob && !isRecording && (
                        <motion.button
                            className="plab-evaluate-btn"
                            onClick={handleEvaluate}
                            disabled={isEvaluating}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isEvaluating ? (
                                <>
                                    <Loader2 className="spinning" size={20} />
                                    <span>Analizando...</span>
                                </>
                            ) : (
                                <span>Evaluar pronunciación</span>
                            )}
                        </motion.button>
                    )}
                </div>
            )}

            {/* Results section */}
            {result && (
                <motion.div
                    className="plab-results"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Score */}
                    <div
                        className="plab-score"
                        style={{ '--score-color': getScoreColor(result.score) } as React.CSSProperties}
                    >
                        <span className="plab-score-emoji">{getScoreEmoji(result.score)}</span>
                        <span className="plab-score-value">{result.score}%</span>
                    </div>

                    {/* Word-by-word analysis */}
                    {result.words && result.words.length > 0 && (
                        <div className="plab-words">
                            {result.words.map((word, idx) => (
                                <span
                                    key={idx}
                                    className={`plab-word ${word.isCorrect ? 'correct' : 'incorrect'}`}
                                    title={word.errorType || ''}
                                >
                                    {word.word}
                                    {word.isCorrect ? (
                                        <CheckCircle size={14} />
                                    ) : (
                                        <XCircle size={14} />
                                    )}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Feedback */}
                    <div className="plab-feedback">
                        <p>{result.feedback}</p>

                        {result.toneAnalysis && (
                            <div className="plab-analysis">
                                <strong>Tono:</strong> {result.toneAnalysis}
                            </div>
                        )}

                        {result.dictionAnalysis && (
                            <div className="plab-analysis">
                                <strong>Dicción:</strong> {result.dictionAnalysis}
                            </div>
                        )}

                        {result.improvementTips && result.improvementTips.length > 0 && (
                            <div className="plab-tips">
                                <strong>Consejos:</strong>
                                <ul>
                                    {result.improvementTips.map((tip, idx) => (
                                        <li key={idx}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="plab-actions">
                        <motion.button
                            className="plab-retry-btn"
                            onClick={handleRetry}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <RotateCcw size={18} />
                            <span>Intentar de nuevo</span>
                        </motion.button>

                        <motion.button
                            className="plab-continue-btn"
                            onClick={handleComplete}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>Continuar</span>
                        </motion.button>
                    </div>

                    <div className="plab-attempts">
                        Intentos: {attempts}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default PronunciationLab;
