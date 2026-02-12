import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '../Button';
import { InteractiveContent } from '../../types';

interface QuizExerciseProps {
    content: InteractiveContent;
    onComplete: () => void;
    onAwardXP: (points: number) => void;
    onPlaySound: (type: 'correct' | 'wrong' | 'click') => void;
    voiceCommand?: import('../../services/ai/voice_command_manager').VoiceCommand | null;
}

const QuizExercise: React.FC<QuizExerciseProps> = ({ content, onComplete, onAwardXP, onPlaySound, voiceCommand }) => {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);

    // Voice Command Handler
    React.useEffect(() => {
        if (!voiceCommand) return;

        if (voiceCommand.type === 'SELECT_OPTION' && typeof voiceCommand.payload === 'number') {
            const optionIndex = voiceCommand.payload - 1; // 1-based to 0-based
            if (optionIndex >= 0) {
                // Determine which question to answer. 
                // Simple strategy: Find the first unanswered question.
                const firstUnansweredIndex = content.quiz.findIndex((_, i) => answers[i] === undefined);

                if (firstUnansweredIndex !== -1) {
                    onPlaySound('click');
                    setAnswers(prev => ({ ...prev, [firstUnansweredIndex]: optionIndex }));
                } else if (!submitted) {
                    // All answered? maybe change answer for the last one? 
                    // Or just ignore.
                }
            }
        }
        else if (voiceCommand.type === 'NEXT') {
            handleSubmit();
        }
    }, [voiceCommand]);

    const handleSubmit = () => {
        if (submitted) {
            onComplete();
        } else {
            // Check if all answered?
            if (Object.keys(answers).length < content.quiz.length) {
                // Maybe play a warning sound or TTS "Please answer all questions"
                return;
            }

            const totalCorrect = content.quiz.filter((q, i) => answers[i] === q.correctIndex).length;
            if (totalCorrect === content.quiz.length) {
                onAwardXP(25);
            } else {
                onPlaySound('wrong');
            }
            setSubmitted(true);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Testing your knowledge</h2>
            <div className="space-y-6">
                {content.quiz.map((q, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
                        <div className="p-6 bg-gray-800/50">
                            <h3 className="text-lg font-bold leading-tight">{q.question}</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            {q.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    disabled={submitted}
                                    onClick={() => {
                                        onPlaySound('click');
                                        setAnswers(prev => ({ ...prev, [i]: idx }));
                                    }}
                                    className={`
                                    w-full p-4 rounded-2xl text-left font-bold transition-all border-2
                                    ${answers[i] === idx
                                            ? submitted
                                                ? idx === q.correctIndex ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
                                                : 'bg-indigo-600 border-indigo-500 text-white'
                                            : submitted && idx === q.correctIndex
                                                ? 'bg-green-600/10 border-green-500/50 text-green-400'
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                        }
                                  `}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{opt}</span>
                                        {answers[i] === idx && (
                                            submitted ? (idx === q.correctIndex ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />) : <Check className="w-5 h-5 opacity-50" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <Button
                onClick={handleSubmit}
                className="w-full h-16 text-xl rounded-2xl"
            >
                {submitted ? 'Continue to Listening' : 'Complete Quiz'}
            </Button>
        </div>
    );
};

export default QuizExercise;
