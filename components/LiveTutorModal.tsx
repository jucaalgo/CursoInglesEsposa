import React, { useEffect, useState, useRef } from 'react';
import { Mic, X, MicOff, PhoneOff, Headphones } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { LiveSession } from '../services/gemini';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userLevel: string;
}

const LiveTutorModal: React.FC<Props> = ({ isOpen, onClose, userName, userLevel }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [transcript, setTranscript] = useState<string>("Tutor is listening...");
  const sessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    if (isOpen) {
        startSession();
    } else {
        cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const startSession = async () => {
    setStatus('connecting');
    try {
        const session = new LiveSession((text, isInterrupted) => {
            if (isInterrupted) setTranscript("Interrupted...");
            else if (text) setTranscript(text);
        });
        
        sessionRef.current = session;
        
        const instructions = `You are a friendly, encouraging English tutor for a student named ${userName}. 
        Their level is ${userLevel}. 
        Keep your responses concise, conversational, and helpful. 
        Correct them gently if they make mistakes, but focus on keeping the conversation flowing.
        Do not lecture; chat.`;
        
        await session.connect(instructions);
        setStatus('connected');
    } catch (e) {
        console.error(e);
        setStatus('error');
    }
  };

  const cleanup = () => {
      if (sessionRef.current) {
          sessionRef.current.disconnect();
          sessionRef.current = null;
      }
      setTranscript("Tutor is listening...");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative bg-white dark:bg-darkcard w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10">
            <div className="bg-black/20 backdrop-blur rounded-full px-3 py-1 text-white text-xs font-bold flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                {status === 'connected' ? 'LIVE SESSION' : 'CONNECTING...'}
            </div>
            <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Main Visual Area */}
        <div className="flex-1 bg-gradient-to-b from-indigo-500 to-purple-600 relative flex flex-col items-center justify-center p-8 text-center">
             <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center mb-8 shadow-inner relative">
                <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-ping opacity-20"></div>
                <Headphones className="w-16 h-16 text-white" />
             </div>
             
             <h2 className="text-2xl font-bold text-white mb-2">English Tutor AI</h2>
             <p className="text-indigo-100 text-sm mb-8">Speaking Practice • Level {userLevel}</p>

             <div className="w-full h-24 flex items-center justify-center">
                {status === 'connected' ? (
                     <AudioVisualizer isActive={true} isDark={true} />
                ) : (
                    <div className="text-white/50 text-sm">Establishing secure connection...</div>
                )}
             </div>
        </div>

        {/* Transcript Area */}
        <div className="h-32 bg-white dark:bg-darkcard p-6 border-t dark:border-gray-700 flex flex-col justify-center">
            <p className="text-center text-gray-600 dark:text-gray-300 font-medium leading-relaxed animate-in fade-in">
                "{transcript}"
            </p>
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800 flex justify-center items-center gap-6">
            <button className="p-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 transition-colors">
                <MicOff className="w-6 h-6" />
            </button>
            <button onClick={onClose} className="p-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 transform hover:scale-105 transition-all">
                <PhoneOff className="w-8 h-8 fill-current" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveTutorModal;