import React from 'react';
import { BookOpen, Volume2, ChevronRight } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';
import { InteractiveContent } from '../../types';

interface StoryExerciseProps {
    content: InteractiveContent;
    onComplete: () => void;
    onPlayTTS: (text: string) => void;
}

const StoryExercise: React.FC<StoryExerciseProps> = ({ content, onComplete, onPlayTTS }) => {
    return (
        <Card className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                    <BookOpen className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-xl font-bold">The Story</h2>
                </div>
                <p className="text-gray-300 leading-relaxed italic border-l-2 border-indigo-500/30 pl-4">{content.scenario.description}</p>
                <div className="space-y-3">
                    {content.scenario.dialogueScript.split('\n').map((line, i) => (
                        <div key={i} className="flex items-start gap-4 p-3 bg-gray-900/50 rounded-2xl hover:bg-gray-900 transition-colors group">
                            <button
                                onClick={() => onPlayTTS(line.replace(/^[A-Z]:\s*/, ''))}
                                className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0"
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                            <p className="text-gray-200 pt-1 font-medium">{line}</p>
                        </div>
                    ))}
                </div>
            </div>
            <Button onClick={onComplete} className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-indigo-500/10">
                Got it! Continue <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
        </Card>
    );
};

export default StoryExercise;
