import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import Button from '../Button';
import { InteractiveContent } from '../../types';

interface ListeningExerciseProps {
    content: InteractiveContent;
    onComplete: () => void;
    onAwardXP: (points: number) => void;
    onPlaySound: (type: 'correct' | 'wrong' | 'click') => void;
    onPlayTTS: (text: string) => void;
}

const ListeningExercise: React.FC<ListeningExerciseProps> = ({ content, onComplete, onAwardXP, onPlaySound, onPlayTTS }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (submitted) {
            onComplete();
        } else {
            const correct = (content.listening || []).every((item, i) => answers[i]?.trim().toLowerCase() === item.answer.toLowerCase());
            if (correct) {
                onAwardXP(20);
            } else {
                onPlaySound('wrong');
            }
            setSubmitted(true);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Listen & Type</h2>
            <div className="space-y-4">
                {(content.listening || []).map((item, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl space-y-6">
                        <div className="flex justify-center">
                            <button
                                onClick={() => onPlayTTS(item.phrase)}
                                className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:scale-105 transition-transform"
                            >
                                <Volume2 className="w-10 h-10 text-white" />
                            </button>
                        </div>
                        <div className="text-center text-sm text-gray-500 italic">"{item.hint}"</div>
                        <input
                            type="text"
                            className="w-full h-14 bg-gray-950 border-2 border-gray-800 rounded-2xl px-6 text-center text-xl font-bold focus:border-indigo-500 transition-all outline-none"
                            placeholder="What did you hear?"
                            value={answers[i] || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                            disabled={submitted}
                        />
                        {submitted && (
                            <div className={`text-center font-bold animate-in zoom-in ${answers[i]?.trim().toLowerCase() === item.answer.toLowerCase() ? 'text-green-400' : 'text-red-400'}`}>
                                {answers[i]?.trim().toLowerCase() === item.answer.toLowerCase() ? '✓ Spot on!' : `✗ Correct answer: "${item.answer}"`}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <Button
                onClick={handleSubmit}
                className="w-full h-14 rounded-2xl"
            >
                {submitted ? 'Almost Finished! Speak' : 'Verify Audio'}
            </Button>
        </div>
    );
};

export default ListeningExercise;
