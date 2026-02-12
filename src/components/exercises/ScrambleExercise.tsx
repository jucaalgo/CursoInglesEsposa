import React, { useState, useEffect } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import Button from '../Button';
import { InteractiveContent } from '../../types';

interface ScrambleExerciseProps {
    content: InteractiveContent;
    onComplete: () => void;
    onAwardXP: (points: number) => void;
    onPlaySound: (type: 'correct' | 'wrong' | 'click') => void;
}

interface ScrambleItem {
    id: string;
    text: string;
    selected: boolean;
}

const ScrambleExercise: React.FC<ScrambleExerciseProps> = ({ content, onComplete, onAwardXP, onPlaySound }) => {
    const [order, setOrder] = useState<ScrambleItem[]>([]);
    const [answerIds, setAnswerIds] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (content.scramble) {
            setAnswerIds([]);
            setOrder(content.scramble.scrambledParts.map((text, i) => ({
                id: `w-${i}-${Math.random().toString(36).substr(2, 5)}`,
                text,
                selected: false
            })));
            setSubmitted(false);
        }
    }, [content]);

    if (!content.scramble) return null;

    const handleCheck = () => {
        const sentence = answerIds.map(id => order.find(w => w.id === id)?.text).join(' ');
        if (sentence.toLowerCase() === content.scramble!.sentence.toLowerCase()) {
            onAwardXP(20);
            setSubmitted(true);
        } else {
            onPlaySound('wrong');
        }
    };

    const handleReset = () => {
        onPlaySound('click');
        setOrder(prev => prev.map(w => ({ ...w, selected: false })));
        setAnswerIds([]);
        setSubmitted(false);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Unscramble</h2>
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl space-y-8">
                <div className="min-h-[100px] flex flex-wrap gap-3 p-6 bg-gray-950 rounded-2xl border-2 border-dashed border-gray-800 items-center justify-center min-w-full">
                    {answerIds.map((id) => {
                        const w = order.find(item => item.id === id);
                        if (!w) return null;
                        return (
                            <button
                                key={w.id}
                                onClick={() => {
                                    onPlaySound('click');
                                    setAnswerIds(prev => prev.filter(pid => pid !== w.id));
                                    setOrder(prev => prev.map(item => item.id === w.id ? { ...item, selected: false } : item));
                                    setSubmitted(false);
                                }}
                                className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 animate-in zoom-in-50"
                            >
                                {w.text}
                            </button>
                        );
                    })}
                    {answerIds.length === 0 && <span className="text-gray-600 italic font-medium">Tap words below to build the sentence...</span>}
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                    {order.filter(w => !w.selected).map((w) => (
                        <button
                            key={w.id}
                            onClick={() => {
                                onPlaySound('click');
                                setAnswerIds(prev => [...prev, w.id]);
                                setOrder(prev => prev.map(item => item.id === w.id ? { ...item, selected: true } : item));
                            }}
                            className="px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-2xl font-bold hover:bg-gray-700 transition-all active:scale-[0.85]"
                        >
                            {w.text}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-4">
                <Button variant="ghost" onClick={handleReset} className="h-14 px-6 rounded-2xl">
                    <RefreshCw className="w-5 h-5 mr-2" /> Reset
                </Button>
                <Button
                    disabled={order.filter(w => w.selected).length === 0}
                    onClick={handleCheck}
                    className="flex-1 h-14 text-lg rounded-2xl"
                >
                    Check Sentence
                </Button>
            </div>
            {submitted && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <Button onClick={onComplete} className="w-full h-14 bg-green-600 rounded-2xl">
                        Perfect! Continue to Quiz <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ScrambleExercise;
