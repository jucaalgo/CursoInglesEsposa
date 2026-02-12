import React, { useState, useEffect } from 'react';
import { ChevronRight, Link2 } from 'lucide-react';
import Button from '../Button';
import { InteractiveContent } from '../../types';

interface MatchingExerciseProps {
    content: InteractiveContent;
    onComplete: () => void;
    onAwardXP: (points: number) => void;
    onPlaySound: (type: 'correct' | 'wrong' | 'click') => void;
}

const MatchingExercise: React.FC<MatchingExerciseProps> = ({ content, onComplete, onAwardXP, onPlaySound }) => {
    const [selected, setSelected] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
    const [pairs, setPairs] = useState<Record<string, string>>({});
    const [leftItems, setLeftItems] = useState<string[]>([]);
    const [rightItems, setRightItems] = useState<string[]>([]);

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
        } else {
            // If we have a left selection, check match
            if (selected.left) {
                const correct = content.wordMatching?.pairs.find(p => p.word === selected.left)?.match === item;
                if (correct) {
                    setPairs(prev => ({ ...prev, [selected.left!]: item }));
                    onAwardXP(10);
                } else {
                    onPlaySound('wrong');
                }
                setSelected({ left: null, right: null });
            }
        }
    };

    const isComplete = Object.keys(pairs).length === content.wordMatching.pairs.length;

    return (
        <div className="space-y-6">
            <div className="text-center p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                <h2 className="text-xl font-bold mb-2">Match the Pairs</h2>
                <p className="text-sm text-gray-400">Connect the English words with their translations</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    {leftItems.map((word) => (
                        <button
                            key={word}
                            disabled={!!pairs[word]}
                            onClick={() => handleMatch('left', word)}
                            className={`
                            w-full p-4 rounded-2xl text-center font-bold transition-all shadow-sm border-2
                            ${pairs[word]
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30 opacity-50'
                                    : selected.left === word
                                        ? 'bg-indigo-600 text-white scale-105 border-indigo-400 shadow-xl shadow-indigo-600/20'
                                        : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-indigo-500/50'
                                }
                        `}
                        >
                            {word}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {rightItems.map((match) => (
                        <button
                            key={match}
                            disabled={Object.values(pairs).includes(match)}
                            onClick={() => handleMatch('right', match)}
                            className={`
                            w-full p-4 rounded-2xl text-center font-bold transition-all border-2
                            ${Object.values(pairs).includes(match)
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30 opacity-50'
                                    : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-indigo-500/50'
                                }
                        `}
                        >
                            {match}
                        </button>
                    ))}
                </div>
            </div>

            {isComplete ? (
                <div className="animate-in zoom-in duration-300">
                    <Button onClick={onComplete} className="w-full h-14 bg-green-600 hover:bg-green-500 rounded-2xl">
                        Amazing! Next Section <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            ) : (
                <div className="h-14" />
            )}
        </div>
    );
};

export default MatchingExercise;
