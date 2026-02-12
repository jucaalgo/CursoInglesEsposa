import React, { useState } from 'react';
import { ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../Button';
import { InteractiveContent } from '../../types';

interface FillBlankExerciseProps {
    content: InteractiveContent;
    onComplete: () => void;
    onAwardXP: (points: number) => void;
    onPlaySound: (type: 'correct' | 'wrong' | 'click') => void;
}

const FillBlankExercise: React.FC<FillBlankExerciseProps> = ({ content, onComplete, onAwardXP, onPlaySound }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!submitted) {
            const correct = Object.entries(answers).every(([k, v]) => {
                const index = parseInt(k);
                const question = content.fillInBlanks[index];
                return question ? v === question.correctWord : false;
            });

            if (correct) {
                onAwardXP(15);
            } else {
                onPlaySound('wrong');
            }
            setSubmitted(true);
        } else {
            onComplete();
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Fill in the Blanks</h2>
            <div className="space-y-6">
                {content.fillInBlanks.map((item, i) => (
                    <div key={item.id || i} className="bg-gray-900 p-6 rounded-3xl border border-gray-800 space-y-4">
                        <p className="text-lg font-medium tracking-wide leading-relaxed">
                            {item.sentence.split('___').map((part, index, array) => (
                                <React.Fragment key={index}>
                                    {part}
                                    {index < array.length - 1 && (
                                        <span className={`inline-block border-b-2 px-4 min-w-[80px] text-center mx-1 ${submitted ? (answers[item.id || i] === item.correctWord ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400') : 'border-indigo-500 text-indigo-400'}`}>
                                            {answers[item.id || i] || '_____'}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {item.options.map((opt) => (
                                <button
                                    key={opt}
                                    disabled={submitted}
                                    onClick={() => {
                                        onPlaySound('click');
                                        setAnswers(prev => ({ ...prev, [item.id || i]: opt }));
                                    }}
                                    className={`
                                    px-6 py-2.5 rounded-2xl font-bold transition-all border-2
                                    ${answers[item.id || i] === opt
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                            : 'bg-gray-800 border-gray-700 text-gray-400'
                                        }
                                `}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        {submitted && (
                            <div className={`text-sm font-bold flex items-center gap-2 ${answers[item.id || i] === item.correctWord ? 'text-green-400' : 'text-red-400'}`}>
                                {answers[item.id || i] === item.correctWord ? <CheckCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                                {answers[item.id || i] === item.correctWord ? 'Correct!' : `Correct word: ${item.correctWord}`}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <Button
                onClick={handleSubmit}
                className={`w-full h-14 text-lg rounded-2xl ${submitted ? 'bg-indigo-600' : 'bg-gray-800'}`}
            >
                {submitted ? 'Continue to Scramble' : 'Check Answers'}
            </Button>
        </div>
    );
};

export default FillBlankExercise;
