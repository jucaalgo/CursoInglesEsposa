import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Volume2, Check, AlertCircle, ArrowRight, User, Headphones, Activity, SpellCheck, Lightbulb } from 'lucide-react';
import * as GeminiService from '../services/gemini';
import { PronunciationResult, ConversationTurn } from '../types';

interface Props {
  turns: ConversationTurn[];
  userLevel: string;
  onComplete?: () => void;
}

const PronunciationDrill: React.FC<Props> = ({ turns, userLevel, onComplete }) => {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentTurn = turns[currentTurnIndex];

  // Auto-play tutor audio when turn starts
  useEffect(() => {
    if (currentTurn.speaker === 'Tutor') {
        setTimeout(() => playTutorAudio(currentTurn.text), 500);
    }
  }, [currentTurnIndex]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentTurnIndex, result]); // Auto scroll when result appears too

  const playTutorAudio = async (text: string) => {
    try {
        const audio = await GeminiService.generateSpeech(text);
        await GeminiService.playRawAudio(audio);
    } catch (e) {
        console.error(e);
    }
  };

  const handleNext = () => {
      if (currentTurnIndex < turns.length - 1) {
          setCurrentTurnIndex(prev => prev + 1);
          setResult(null);
      } else {
          if (onComplete) onComplete();
      }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const base64 = await GeminiService.blobToBase64(audioBlob);
        analyzeAudio(base64);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsAnalyzing(true);
    }
  };

  const analyzeAudio = async (base64: string) => {
    try {
      const evaluation = await GeminiService.evaluatePronunciation(currentTurn.text, base64, userLevel);
      setResult(evaluation);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-darkcard rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-[750px] w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-5 text-white flex justify-between items-center rounded-t-2xl shadow-md z-10">
        <div>
            <h3 className="text-xl font-bold flex items-center">
                <Mic className="w-6 h-6 mr-3" /> Conversation Simulator
            </h3>
            <p className="opacity-90 text-sm">Turn {currentTurnIndex + 1} of {turns.length}</p>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-900/50 scroll-smooth" ref={scrollRef}>
          {turns.map((turn, idx) => (
              <div key={idx} className={`flex ${turn.speaker === 'Student' ? 'justify-end' : 'justify-start'} ${idx > currentTurnIndex ? 'opacity-30 blur-sm' : ''}`}>
                  <div className={`max-w-[90%] md:max-w-[85%] rounded-3xl p-6 shadow-md transition-all duration-300 ${
                      turn.speaker === 'Student' 
                      ? 'bg-brand-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}>
                      <div className="flex items-center gap-2 mb-3 opacity-80 text-sm font-bold uppercase tracking-wide">
                          {turn.speaker === 'Student' ? <User className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                          {turn.speaker}
                      </div>
                      
                      {/* Increased Font Size for Readability */}
                      <p className="text-2xl md:text-3xl leading-relaxed font-medium">{turn.text}</p>
                      
                      {turn.translation && idx === currentTurnIndex && (
                          <p className="text-lg opacity-80 mt-4 border-t border-white/20 pt-3 italic">{turn.translation}</p>
                      )}
                      
                      {/* Detailed Result Card - Expanded Layout */}
                      {turn.speaker === 'Student' && idx === currentTurnIndex && result && (
                           <div className="mt-8 bg-white/10 rounded-2xl p-6 border border-white/20 animate-in fade-in slide-in-from-bottom-2 ring-1 ring-white/10">
                               <div className="flex justify-between items-center mb-5 font-bold border-b border-white/20 pb-4">
                                   <span className="text-xl">Analysis Report</span>
                                   <span className={`px-4 py-1.5 rounded-lg text-base font-bold shadow-sm ${result.score >= 80 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                       Score: {result.score}
                                   </span>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                   <div className="bg-black/20 rounded-xl p-4">
                                       <div className="flex items-center text-sm opacity-90 mb-2 font-bold uppercase tracking-wider text-blue-100"><Activity className="w-4 h-4 mr-2"/> Tone</div>
                                       <div className="font-medium text-lg leading-snug">{result.toneAnalysis || "N/A"}</div>
                                   </div>
                                   <div className="bg-black/20 rounded-xl p-4">
                                        <div className="flex items-center text-sm opacity-90 mb-2 font-bold uppercase tracking-wider text-purple-100"><SpellCheck className="w-4 h-4 mr-2"/> Diction</div>
                                        <div className="font-medium text-lg leading-snug">{result.dictionAnalysis || "N/A"}</div>
                                   </div>
                               </div>

                               {result.improvementTips && result.improvementTips.length > 0 && (
                                   <div className="text-lg space-y-3 bg-black/10 rounded-xl p-5">
                                       <div className="flex items-center opacity-100 font-bold mb-2 text-yellow-300"><Lightbulb className="w-6 h-6 mr-2"/> Suggested Improvements:</div>
                                       {result.improvementTips.map((tip, i) => (
                                           <div key={i} className="pl-8 relative before:content-['•'] before:absolute before:left-3 before:text-yellow-300 before:font-bold">
                                               {tip}
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                      )}
                  </div>
              </div>
          ))}
          {/* Spacer to prevent content from hiding behind the footer */}
          <div className="h-6"></div>
      </div>

      {/* Footer Controls - Always Visible (Sticky/Fixed behavior within flex) */}
      <div className="p-6 bg-white dark:bg-darkcard border-t dark:border-gray-700 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
        {currentTurn.speaker === 'Tutor' ? (
             <div className="flex flex-col items-center animate-in fade-in">
                 <p className="text-gray-500 dark:text-gray-400 text-base font-medium mb-4">Listen to the tutor...</p>
                 <div className="flex gap-6 items-center">
                    <button onClick={() => playTutorAudio(currentTurn.text)} className="p-5 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all transform hover:scale-110 shadow-sm border border-gray-200 dark:border-gray-600">
                        <Volume2 className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                    </button>
                    <button onClick={handleNext} className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold text-lg flex items-center shadow-lg transition-transform transform hover:scale-105">
                        Next Turn <ArrowRight className="w-6 h-6 ml-3" />
                    </button>
                 </div>
             </div>
        ) : (
            <div className="flex flex-col items-center animate-in fade-in">
                <div className="flex items-center gap-8">
                    {!isRecording && !isAnalyzing && (
                        <>
                            <button 
                                onClick={startRecording} 
                                className="w-24 h-24 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-500/30 flex items-center justify-center transition-all transform hover:scale-110 hover:rotate-3 group"
                                title="Start Recording"
                            >
                                <Mic className="w-12 h-12 group-hover:animate-pulse" />
                            </button>
                            {/* Continue button appears if we have a result */}
                            {result && result.score >= 0 && (
                                <button onClick={handleNext} className="px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-xl shadow-lg animate-in zoom-in flex items-center transition-transform hover:scale-105">
                                    Continue <ArrowRight className="w-6 h-6 ml-3" />
                                </button>
                            )}
                        </>
                    )}

                    {isRecording && (
                        <div className="flex flex-col items-center gap-3">
                             <button onClick={stopRecording} className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 animate-pulse flex items-center justify-center transition-transform hover:scale-105">
                                <Square className="w-10 h-10 fill-current" />
                            </button>
                            <span className="text-red-500 font-bold animate-pulse text-base">Recording... Tap to stop</span>
                        </div>
                    )}

                    {isAnalyzing && (
                         <div className="flex flex-col items-center gap-3">
                             <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-4 border-brand-100 dark:border-gray-700">
                                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                             </div>
                             <span className="text-brand-600 font-bold text-base">Analyzing pronunciation...</span>
                         </div>
                    )}
                </div>
                {!isRecording && !isAnalyzing && !result && (
                    <p className="text-base text-gray-400 dark:text-gray-500 mt-5 font-medium">Tap microphone and read aloud</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationDrill;