import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import AudioRecorder from '../components/AudioRecorder'; // Import new component
import SettingsModal from '../components/Layout'; // Indirectly importing via Layout... wait, no. 
// Actually I need to fix the import in Layout or just check storage. The Modal is in Layout.

import { analyzeStudentResponse, generateSpeech, playRawAudio } from '../services/gemini'; // Added TTS imports
import { useUserProfile } from '../hooks/useUserProfile';
import { ChatMessage } from '../types';

// Helper icon
const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const Practice: React.FC = () => {
    const { profile } = useUserProfile();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const key = localStorage.getItem('profesoria_api_key');
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!key && !envKey) {
            setApiKeyMissing(true);
        } else {
            setApiKeyMissing(false);
            if (messages.length === 0) {
                setMessages([{
                    id: 'init',
                    role: 'model',
                    text: `Hello ${profile?.name || 'there'}! I'm your AI Tutor. What would you like to practice today?`
                }]);
            }
        }
    }, [profile?.name]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (textInput?: string, audioBase64?: string) => {
        const textToSend = textInput || input;

        if ((!textToSend && !audioBase64) || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: textToSend || '(Audio Message)'
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const lastModelMsg = messages.filter(m => m.role === 'model').pop()?.text || "Start conversation";

            // Call API with either text or audio
            const response = await analyzeStudentResponse(
                lastModelMsg,
                textToSend || null,
                profile?.current_level || 'A2',
                audioBase64
            );

            const aiMsg = { ...response, id: (Date.now() + 1).toString() };
            setMessages(prev => [...prev, aiMsg]);

            // Try to play TTS for the response
            if (aiMsg.text) {
                try {
                    const audioData = await generateSpeech(aiMsg.text);
                    await playRawAudio(audioData);
                } catch (ttsError) {
                    console.warn("TTS failed", ttsError);
                }
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "Sorry, I had trouble connecting to the AI. Please check your API Key settings."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleAudioRecorded = (base64: string) => {
        handleSend(undefined, base64);
    };

    if (apiKeyMissing) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center h-[60vh]">
                <AlertCircle className="w-16 h-16 text-yellow-500" />
                <h2 className="text-2xl font-bold">API Key Missing</h2>
                <p className="text-gray-400 max-w-md">
                    To use the AI Tutor, you need to configure your Google Gemini API Key.
                </p>
                <div className="p-4 bg-gray-800 rounded-lg text-sm text-gray-300">
                    Click the <span className="inline-block mx-1"><SettingsIcon /></span> settings icon in the top right corner.
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100vh-8rem)] max-h-[800px] relative">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800 mb-4 custom-scrollbar">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-6`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                                }`}
                        >
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                        </div>

                        {/* Correction Card - Prominent & Educational */}
                        {msg.corrections && msg.corrections.length > 0 && (
                            <div className="mt-2 max-w-[85%] w-full animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50" />
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-red-500/20 rounded-full shrink-0 mt-0.5">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div className="space-y-2 w-full">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Feedback</span>
                                                <p className="text-gray-300 text-sm">
                                                    You said: <span className="line-through decoration-red-500/50 text-gray-500">{msg.corrections[0].original}</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Better</span>
                                                <p className="text-green-100 font-medium text-lg">
                                                    "{msg.corrections[0].correction}"
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-red-500/20 mt-1">
                                                <p className="text-red-200/80 text-xs italic">
                                                    💡 {msg.corrections[0].explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            <span className="text-sm text-gray-400">AI is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <Card className="p-2 border-t border-gray-800 bg-gray-950/50 backdrop-blur-sm">
                <div className="flex gap-2 items-end">
                    <div className="relative flex-1">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            className="w-full bg-gray-900 border-0 rounded-lg pl-4 pr-10 py-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 resize-none max-h-32 min-h-[50px]"
                            rows={1}
                        />
                        {/* Audio Recorder Button Placement could be absolute here, or separate */}
                    </div>

                    {/* Audio Recorder triggers send automatically on stop */}
                    <AudioRecorder onRecordingComplete={handleAudioRecorded} isProcessing={isLoading} />

                    <Button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="h-[50px] w-[50px] rounded-lg p-0 flex items-center justify-center shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Practice;
