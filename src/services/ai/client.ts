import { GoogleGenAI } from "@google/genai";

// Helper to get client with current key
export const getClient = () => {
    const customKey = localStorage.getItem('profesoria_api_key');

    // Safe access to process.env for browser environments where it might not be polyfilled
    // @ts-ignore
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    const apiKey = customKey || envKey;

    if (!apiKey) {
        console.warn("API Key is missing! Please add it in Settings.");
        throw new Error("API Key Missing. Please configure it in Settings.");
    }
    return new GoogleGenAI({ apiKey: apiKey });
};
