import React, { useState } from 'react';
import { Mic, Award, Loader2 } from 'lucide-react';
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

    const handlePronunciationTest = async (audioBase64: string) => {
        setIsEvaluating(true);
        setResult(null);
        try {
            const targetPhrase = content.conversation.turns[0]?.text || "Hello, how are you?";
            const analysis = await evaluatePronunciation(targetPhrase, audioBase64, currentLevel);
            setResult(analysis);

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

    return (
        <Card className="text-center space-y-10 py-10">
            <div className="space-y-2">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                    <Mic className="w-10 h-10 text-white relative z-10" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tight">THE FINAL CHALLENGE</h2>
                <p className="text-gray-500 uppercase text-xs font-bold tracking-[0.2em]">Record your pronunciation</p>
            </div>

            <div className="max-w-md mx-auto p-8 bg-gray-900 border-2 border-gray-800 rounded-[2.5rem] space-y-4">
                <p className="text-2xl font-bold text-gray-100 uppercase tracking-tighter">
                    "{content.conversation.turns[0]?.text || 'Hello, world!'}"
                </p>
                <button
                    onClick={() => onPlayTTS(content.conversation.turns[0]?.text || 'Hello')}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold text-sm underline underline-offset-4"
                >
                    LISTEN FIRST
                </button>
            </div>

            <div className="flex justify-center pb-6">
                <AudioRecorder onRecordingComplete={handlePronunciationTest} />
            </div>

            {isEvaluating && (
                <div className="animate-pulse">
                    <Loader2 className="w-10 h-10 mx-auto text-indigo-500 animate-spin" />
                    <p className="text-gray-400 mt-4 font-bold tracking-widest">ANALYZING SPEECH...</p>
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-in zoom-in">
                    <div className={`
                    inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 shadow-2xl
                    ${result.score >= 80 ? 'bg-green-500/10 border-green-500 text-green-400 shadow-green-500/20' :
                            result.score >= 50 ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-amber-500/20' :
                                'bg-red-500/10 border-red-500 text-red-400 shadow-red-500/20'}
                `}>
                        <span className="text-4xl font-black">{result.score}%</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Accuracy</span>
                    </div>
                    <p className="max-w-sm mx-auto text-gray-300 font-medium leading-relaxed italic">"{result.feedback}"</p>

                    <PronunciationHeatmap
                        words={result.words || []}
                        score={result.score}
                    />
                </div>
            )}

            <Button onClick={onComplete} className="w-full h-16 text-xl rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] shadow-2xl shadow-indigo-600/30">
                <Award className="w-6 h-6 mr-2" /> CLAIM REWARDS
            </Button>
        </Card>
    );
};

export default PronunciationExercise;
