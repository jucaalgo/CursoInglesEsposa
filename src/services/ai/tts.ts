import { Modality } from "@google/genai";
import { callGemini } from "./client";
import { cacheTTSAudio, getCachedTTSAudio } from "../cache";

export const generateSpeech = async (text: string, voiceName?: string): Promise<string> => {
    if (!text || !text.trim()) {
        console.warn("Skipping TTS: Empty text");
        throw new Error("Empty text");
    }

    const selectedVoice = voiceName || localStorage.getItem('profesoria_tts_voice') || 'Kore';

    // Check cache first
    const cached = getCachedTTSAudio(text);
    if (cached) {
        console.log("TTS cache hit for:", text.substring(0, 40));
        return cached;
    }

    try {
        const response = await callGemini({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: text.trim() }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: selectedVoice },
                    },
                },
            },
        });

        // Extract base64 audio from the REST API response format
        const candidates = response.candidates as Array<Record<string, unknown>>;
        const content = candidates?.[0]?.content as Record<string, unknown> | undefined;
        const parts = content?.parts as Array<Record<string, unknown>> | undefined;
        const inlineData = parts?.[0]?.inlineData as { data?: string } | undefined;
        const base64Audio = inlineData?.data;

        if (!base64Audio) throw new Error("No audio generated from model");

        cacheTTSAudio(text, base64Audio);
        return base64Audio;
    } catch (e: any) {
        console.error("TTS generation failed:", e);
        if (e?.message?.includes("prompt is not supported by the AudioOut model")) {
            console.warn("TTS fallback: content might be filtered.");
        }
        throw e;
    }
};