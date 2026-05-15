import { Modality } from "@google/genai";
import { getClient } from "./client";
import { cacheTTSAudio, getCachedTTSAudio } from "../cache";

export const generateSpeech = async (text: string, voiceName?: string): Promise<string> => {
    if (!text || !text.trim()) {
        console.warn("Skipping TTS: Empty text");
        throw new Error("Empty text");
    }

    // Use stored voice preference or default to Kore
    const selectedVoice = voiceName || localStorage.getItem('profesoria_tts_voice') || 'Kore';

    // Check cache first
    const cached = getCachedTTSAudio(text);
    if (cached) {
        console.log("TTS cache hit for:", text.substring(0, 40));
        return cached;
    }

    const client = getClient();
    try {
        const response = await client.models.generateContent({
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

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated from model");

        // Cache the result
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