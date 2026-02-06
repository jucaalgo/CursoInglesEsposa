import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Loader2, CheckCircle, AlertCircle, Volume2 } from 'lucide-react';
import { ChatMessage } from '../../types';
import { analyzeStudentResponse, generateSpeech, playRawAudio, blobToBase64 } from '../services/gemini';
import { useAudio } from '../hooks/useAudio';

interface ChatTutorProps {
    systemPrompt: string;
    initialMessages?: ChatMessage[];
    userLevel: string;
    voiceName?: string;
    onConversationEnd?: (messages: ChatMessage[]) => void;
}

const ChatTutor: React.FC<ChatTutorProps> = ({
    systemPrompt,
    initialMessages = [],
    userLevel,
    voiceName = 'Kore',
    onConversationEnd
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording,
        getBase64Audio,
        clearRecording
    } = useAudio();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendText = async () => {
        if (!input.trim() || isProcessing) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsProcessing(true);

        try {
            const response = await analyzeStudentResponse(
                systemPrompt,
                input.trim(),
                userLevel
            );
            setMessages(prev => [...prev, response]);
        } catch (e) {
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'model',
                text: 'Lo siento, hubo un error. Por favor intenta de nuevo.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendVoice = async () => {
        if (!audioBlob || isProcessing) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: '🎤 Mensaje de voz enviado'
        };

        setMessages(prev => [...prev, userMessage]);
        setIsProcessing(true);

        try {
            const base64 = await getBase64Audio();
            if (base64) {
                const response = await analyzeStudentResponse(
                    systemPrompt,
                    null,
                    userLevel,
                    base64
                );
                setMessages(prev => [...prev, response]);
            }
        } catch (e) {
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'model',
                text: 'No pude procesar el audio. Por favor intenta de nuevo.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
            clearRecording();
        }
    };

    const playMessageAudio = async (messageId: string, text: string) => {
        if (isPlayingAudio === messageId) return;
        setIsPlayingAudio(messageId);
        try {
            const audio = await generateSpeech(text, voiceName);
            await playRawAudio(audio);
        } catch (e) {
            console.error('TTS error:', e);
        } finally {
            setIsPlayingAudio(null);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    return (
        <div className="chat-tutor">
            {/* Messages container */}
            <div className="chat-messages">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={msg.id}
                            className={`chat-message ${msg.role}`}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className="chat-bubble">
                                <p>{msg.text}</p>

                                {/* Corrections */}
                                {msg.corrections && msg.corrections.length > 0 && (
                                    <div className="chat-corrections">
                                        {msg.corrections.map((corr, cIdx) => (
                                            <div key={cIdx} className="correction-item">
                                                {corr.original && corr.correction && (
                                                    <div className="correction-change">
                                                        <span className="original">{corr.original}</span>
                                                        <span className="arrow">→</span>
                                                        <span className="corrected">{corr.correction}</span>
                                                    </div>
                                                )}
                                                {corr.explanation && (
                                                    <p className="correction-explanation">{corr.explanation}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Audio button for model messages */}
                                {msg.role === 'model' && (
                                    <button
                                        className="chat-audio-btn"
                                        onClick={() => playMessageAudio(msg.id, msg.text)}
                                        disabled={isPlayingAudio === msg.id}
                                    >
                                        <Volume2
                                            size={16}
                                            className={isPlayingAudio === msg.id ? 'playing' : ''}
                                        />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isProcessing && (
                    <motion.div
                        className="chat-message model"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="chat-bubble typing">
                            <Loader2 className="spinning" size={20} />
                            <span>Escribiendo...</span>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="chat-input-area">
                {/* Voice recording indicator */}
                {isRecording && (
                    <motion.div
                        className="recording-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <span className="recording-dot" />
                        <span>Grabando...</span>
                    </motion.div>
                )}

                {/* Audio ready to send */}
                {audioBlob && !isRecording && (
                    <motion.div
                        className="audio-ready"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <CheckCircle size={16} />
                        <span>Audio listo</span>
                        <button onClick={handleSendVoice} disabled={isProcessing}>
                            <Send size={16} />
                        </button>
                        <button onClick={clearRecording} className="cancel">
                            Cancelar
                        </button>
                    </motion.div>
                )}

                <div className="chat-input-row">
                    {/* Voice input button */}
                    <motion.button
                        className={`chat-voice-btn ${isRecording ? 'recording' : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={isProcessing}
                    >
                        {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                    </motion.button>

                    {/* Text input */}
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Escribe en inglés..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isProcessing || isRecording}
                    />

                    {/* Send button */}
                    <motion.button
                        className="chat-send-btn"
                        onClick={handleSendText}
                        disabled={!input.trim() || isProcessing}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Send size={20} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default ChatTutor;
