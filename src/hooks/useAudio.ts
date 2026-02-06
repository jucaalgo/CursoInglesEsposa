import { useState, useRef, useCallback, useEffect } from 'react';
import { blobToBase64 } from '../../services/gemini';

interface AudioState {
    isRecording: boolean;
    isPlaying: boolean;
    audioBlob: Blob | null;
    audioUrl: string | null;
    duration: number;
    error: string | null;
}

export const useAudio = () => {
    const [state, setState] = useState<AudioState>({
        isRecording: false,
        isPlaying: false,
        audioBlob: null,
        audioUrl: null,
        duration: 0,
        error: null
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (state.audioUrl) {
                URL.revokeObjectURL(state.audioUrl);
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                }
            });

            streamRef.current = stream;
            audioChunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);

                setState(prev => ({
                    ...prev,
                    isRecording: false,
                    audioBlob,
                    audioUrl,
                    error: null
                }));

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setState(prev => ({ ...prev, isRecording: true, error: null }));

        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message || 'Failed to access microphone'
            }));
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            mediaRecorderRef.current.stop();
        }
    }, [state.isRecording]);

    const playAudio = useCallback(() => {
        if (state.audioUrl) {
            audioRef.current = new Audio(state.audioUrl);
            audioRef.current.onended = () => {
                setState(prev => ({ ...prev, isPlaying: false }));
            };
            audioRef.current.play();
            setState(prev => ({ ...prev, isPlaying: true }));
        }
    }, [state.audioUrl]);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setState(prev => ({ ...prev, isPlaying: false }));
        }
    }, []);

    const getBase64Audio = useCallback(async (): Promise<string | null> => {
        if (!state.audioBlob) return null;
        try {
            return await blobToBase64(state.audioBlob);
        } catch {
            return null;
        }
    }, [state.audioBlob]);

    const clearRecording = useCallback(() => {
        if (state.audioUrl) {
            URL.revokeObjectURL(state.audioUrl);
        }
        setState({
            isRecording: false,
            isPlaying: false,
            audioBlob: null,
            audioUrl: null,
            duration: 0,
            error: null
        });
    }, [state.audioUrl]);

    return {
        ...state,
        startRecording,
        stopRecording,
        playAudio,
        stopAudio,
        getBase64Audio,
        clearRecording
    };
};

export default useAudio;
