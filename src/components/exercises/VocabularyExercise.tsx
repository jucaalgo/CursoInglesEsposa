import React from 'react';
import { Volume2, ChevronRight } from 'lucide-react';
import Button from '../Button';
import { InteractiveContent } from '../../types';

interface VocabularyExerciseProps {
    content: InteractiveContent;
    onComplete: () => void;
    onPlayTTS: (text: string) => void;
}

const VocabularyExercise: React.FC<VocabularyExerciseProps> = ({ content, onComplete, onPlayTTS }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Key Vocabulary</h2>
                <div className="text-xs text-gray-500">{content.vocabulary.length} words</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.vocabulary.map((item, i) => (
                    <button
                        key={i}
                        className="p-5 bg-gray-900 border border-gray-800 rounded-3xl text-left hover:border-indigo-500/50 transition-all active:scale-[0.98] group"
                        onClick={() => onPlayTTS(item.term)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-indigo-400 font-bold text-lg">{item.term}</span>
                            <Volume2 className="w-4 h-4 text-gray-600 group-hover:text-indigo-500" />
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{item.definition}</p>
                    </button>
                ))}
            </div>
            <Button onClick={onComplete} className="w-full h-14 text-lg rounded-2xl">
                Next: Challenge <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
        </div>
    );
};

export default VocabularyExercise;
