import React, { useState } from 'react';
import { CheckCircle, XCircle, Award, ArrowRight, RotateCcw, Eye } from 'lucide-react';
import { QuizQuestion } from '../types';
import confetti from 'canvas-confetti';

interface Props {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const Quiz: React.FC<Props> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!questions || questions.length === 0) {
      return <div className="text-center p-8 text-gray-500">No quiz questions available.</div>;
  }

  const currentQ = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    
    if (idx === currentQ.correctIndex) {
      setScore(s => s + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#4ade80']
      });
    }
  };

  const handleReveal = () => {
      if (isAnswered) return;
      setSelectedOption(currentQ.correctIndex);
      setIsAnswered(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      onComplete(score);
      if (score === questions.length) {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      }
    }
  };

  const restart = () => {
      setCurrentIndex(0);
      setScore(0);
      setShowResults(false);
      setSelectedOption(null);
      setIsAnswered(false);
  };

  if (showResults) {
      return (
          <div className="text-center p-8 bg-white dark:bg-darkcard rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="w-20 h-20 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-brand-600" />
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-2">Quiz Completed!</h3>
              <p className="text-gray-500 mb-6">You scored {score} out of {questions.length}</p>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${score === questions.length ? 'bg-green-500' : 'bg-brand-500'}`} 
                    style={{width: `${(score/questions.length)*100}%`}}
                  ></div>
              </div>

              <button onClick={restart} className="flex items-center justify-center w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg transition-colors">
                  <RotateCcw className="w-4 h-4 mr-2" /> Try Again
              </button>
          </div>
      );
  }

  return (
    <div className="bg-white dark:bg-darkcard rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-brand-600 uppercase tracking-wider">Question {currentIndex + 1}/{questions.length}</span>
        <span className="text-sm font-medium text-gray-400">Score: {score}</span>
      </div>

      <h3 className="text-xl font-bold dark:text-white mb-6">{currentQ.question}</h3>

      <div className="space-y-3 mb-6">
        {currentQ.options.map((opt, idx) => {
          let stateStyles = "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800";
          if (isAnswered) {
             if (idx === currentQ.correctIndex) stateStyles = "bg-green-50 border-green-500 dark:bg-green-900/20 dark:border-green-500 text-green-700 dark:text-green-300";
             else if (idx === selectedOption) stateStyles = "bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-500 text-red-700 dark:text-red-300";
             else stateStyles = "opacity-50 border-gray-200 dark:border-gray-700";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${stateStyles}`}
            >
              <span className="font-medium dark:text-gray-200">{opt}</span>
              {isAnswered && idx === currentQ.correctIndex && <CheckCircle className="absolute right-4 top-4 w-5 h-5 text-green-600" />}
              {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && <XCircle className="absolute right-4 top-4 w-5 h-5 text-red-600" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between h-12">
        {!isAnswered && (
             <button onClick={handleReveal} className="text-sm text-gray-400 hover:text-brand-600 flex items-center transition-colors">
                 <Eye className="w-4 h-4 mr-2" /> Reveal Answer
             </button>
        )}
        <div className="flex-1 flex justify-end">
            {isAnswered && (
              <button onClick={nextQuestion} className="flex items-center px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg animate-in fade-in slide-in-from-right-2">
                {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'} <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;