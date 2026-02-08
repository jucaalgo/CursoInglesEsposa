import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check, Mic } from 'lucide-react';

interface WordAnalysis {
    word: string;
    isCorrect: boolean;
    errorType?: 'mispronounced' | 'skipped' | 'tone';
}

interface PronunciationHeatmapProps {
    words: WordAnalysis[];
    score: number;
}

const PronunciationHeatmap: React.FC<PronunciationHeatmapProps> = ({ words, score }) => {
    if (!words || words.length === 0) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Analysis Heatmap</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${score >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    Score: {score}%
                </div>
            </div>

            <div className="flex flex-wrap gap-2 p-4 bg-gray-950 rounded-2xl border border-gray-800">
                {words.map((w, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`
                            relative px-3 py-1.5 rounded-lg text-lg font-medium cursor-help group transition-colors
                            ${w.isCorrect
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            }
                        `}
                    >
                        {w.word}

                        {/* Tooltip for errors */}
                        {!w.isCorrect && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] p-2 bg-red-900 border border-red-700 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                <div className="flex items-center gap-1 mb-1 font-bold text-red-300">
                                    <AlertCircle className="w-3 h-3" />
                                    {w.errorType === 'skipped' ? 'Skipped' : 'Mispronounced'}
                                </div>
                                Try speaking clearer.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-red-900"></div>
                            </div>
                        )}

                        {/* Success Icon for correct */}
                        {w.isCorrect && (
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Check className="w-3 h-3 text-green-500 bg-gray-900 rounded-full" />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <p className="text-xs text-center text-gray-500">
                <Mic className="w-3 h-3 inline mr-1" />
                Tap on red words to see why they were marked incorrect.
            </p>
        </div>
    );
};

export default PronunciationHeatmap;
