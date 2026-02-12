import { Modality } from "@google/genai";
import { getClient } from "./client";

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    if (!text || !text.trim()) {
        console.warn("Skipping TTS: Empty text");
        throw new Error("Empty text");
    }

    const client = getClient();
    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: text.trim() }] },
            config: {
                responseModalities: [Modality.AUDIO], // Correct enum usage
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated from model");
        return base64Audio;
    } catch (e: unknown) {
        console.error("TTS generation failed:", e);
        // Specific handling for "prompt not supported" which usually means safety filter triggered on text or invalid chars
        if (e.message?.includes("prompt is not supported by the AudioOut model")) {
            console.warn("TTS fallback: content might be filtered.");
        }
        throw e;
    }
};
