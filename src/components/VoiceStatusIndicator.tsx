import React from 'react';
import { Mic, Loader2, Check, MicOff, AlertCircle } from 'lucide-react';
import Card from './Card';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'blood_error'; // 'error' is reserved? using blood_error to be safe/funny or just 'error_state'

interface VoiceStatusIndicatorProps {
    status: VoiceStatus;
    transcript?: string;
    lastCommand?: string;
    errorMessage?: string;
}

const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({ status, transcript, lastCommand, errorMessage }) => {
    if (status === 'idle') return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <Card className="bg-gray-900/90 backdrop-blur-xl border-t border-x border-gray-700/50 shadow-2xl rounded-2xl p-4 flex items-center gap-4">

                {/* Icon State */}
                <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                    ${status === 'listening' ? 'bg-red-500/20 text-red-500 animate-pulse ring-2 ring-red-500/40' : ''}
                    ${status === 'processing' ? 'bg-indigo-500/20 text-indigo-500' : ''}
                    ${status === 'success' ? 'bg-emerald-500/20 text-emerald-500 scale-110' : ''}
                    ${status === 'blood_error' ? 'bg-orange-500/20 text-orange-500' : ''}
                `}>
                    {status === 'listening' && <Mic className="w-6 h-6" />}
                    {status === 'processing' && <Loader2 className="w-6 h-6 animate-spin" />}
                    {status === 'success' && <Check className="w-6 h-6" />}
                    {status === 'blood_error' && <AlertCircle className="w-6 h-6" />}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
                        {status === 'listening' && 'Listening...'}
                        {status === 'processing' && 'Thinking...'}
                        {status === 'success' && 'Command Recognized'}
                        {status === 'blood_error' && 'Did not catch that'}
                    </p>

                    <p className="font-medium text-white truncate h-6">
                        {status === 'listening' && (transcript || "Say 'Next', 'Repeat', or an option...")}
                        {status === 'processing' && "Analyzing audio..."}
                        {status === 'success' && lastCommand}
                        {status === 'blood_error' && (errorMessage || "Please try again.")}
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default VoiceStatusIndicator;
