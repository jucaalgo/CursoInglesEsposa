import { Type } from "@google/genai";
import { PronunciationAnalysis, ChatMessage } from "../../types";
import { getClient } from "./client";

export const evaluatePronunciation = async (
    targetPhrase: string,
    audioBase64: string,
    userLevel: string
): Promise<PronunciationAnalysis> => {
    try {
        const client = getClient();
        const parts = [
            { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
            {
                text: `Act as a strict Linguistic Expert.
                Target Phrase: "${targetPhrase}".
                Student Level: ${userLevel}.
                
                Analyze the audio strictly for:
                1. Accuracy (Score 0-100).
                2. Tone/Intonation (e.g., Flat, Monotone, Natural, Expressive).
                3. Diction/Articulation (Clarity of individual sounds).
                4. Specific Errors.
                
                Return JSON. score, feedback (general), toneAnalysis (string), dictionAnalysis (string), improvementTips (array of strings), words (array).`
            }
        ];

        const fetchEval = client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        feedback: { type: Type.STRING },
                        toneAnalysis: { type: Type.STRING },
                        dictionAnalysis: { type: Type.STRING },
                        improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                        words: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    isCorrect: { type: Type.BOOLEAN },
                                    errorType: { type: Type.STRING, enum: ['mispronounced', 'skipped', 'tone'] }
                                }
                            }
                        }
                    }
                }
            }
        });

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Pronunciation analysis timed out")), 30000));
        const response = await Promise.race([fetchEval, timeout]) as { text?: () => string };

        const result = JSON.parse(response.text ? response.text() : '{"score": 0, "feedback": "Could not analyze", "words": []}');
        return { ...result, phrase: targetPhrase };
    } catch (e) {
        console.error("Pronunciation eval error", e);
        return { phrase: targetPhrase, score: 0, feedback: "Analysis error or timeout. Check connection.", words: [] };
    }
};

export const analyzeStudentResponse = async (
    prompt: string,
    studentInput: string | null,
    userLevel: string,
    audioBase64?: string
): Promise<ChatMessage> => {
    const client = getClient();
    const parts: { inlineData?: { mimeType: string; data: string }; text?: string }[] = [];

    const strictSystemPrompt = `
    ROLE: You are a STRICT Cambridge English Examiner.
    GOAL: Correct EVERY grammar, vocabulary, or pronunciation mistake instantly. Do NOT be polite if it means ignoring an error.
    
    INSTRUCTIONS:
    1. Compare user input to Native Speaker standard (Level ${userLevel}).
    2. If there is ANY error (even small), your "reply" MUST start with the correction.
    3. If the input is perfect, simply reply conversationally.
    
    OUTPUT JSON FORMAT (Strictly enforce this):
    {
      "has_mistake": boolean,
      "corrected_text": "The full correct sentence",
      "explanation": "Why it was wrong (concise grammar rule)",
      "reply": "Your conversational response (or the correction if serious)"
    }
  `;

    if (audioBase64) {
        parts.push({ inlineData: { mimeType: 'audio/wav', data: audioBase64 } });
        parts.push({ text: `${strictSystemPrompt}\n\nAUDIO ANALYSIS: Transcribe and analyze audio for prompt: "${prompt}".` });
    } else {
        parts.push({ text: `${strictSystemPrompt}\n\nTEXT ANALYSIS: Analyze text: "${studentInput}" for prompt: "${prompt}".` });
    }

    try {
        const fetchChat = client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        has_mistake: { type: Type.BOOLEAN },
                        corrected_text: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        reply: { type: Type.STRING },
                    }
                }
            }
        });

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Chat analysis timed out")), 20000));
        const response = await Promise.race([fetchChat, timeout]) as { text?: () => string };

        const analysis = JSON.parse(response.text ? response.text() : '{}');

        // Logic: If mistake, Force the UI to show it.
        const finalReply = analysis.reply;

        return {
            id: Date.now().toString(),
            role: 'model',
            text: finalReply || "Great job!",
            corrections: analysis.has_mistake ? [{
                original: studentInput || "(Voice Input)",
                correction: analysis.corrected_text || "",
                explanation: `${analysis.explanation || ""}`
            }] : []
        };
    } catch (e) {
        console.error("Analysis error", e);
        return { id: Date.now().toString(), role: 'model', text: "I understood that. Good job! (System Note: Correction unavailable)", corrections: [] };
    }
};

export const explainGrammar = async (text: string, userLevel: string): Promise<string> => {
    const client = getClient();
    const prompt = `
    ROLE: You are an expert English Professor specializing in Linguistics and the CEFR framework.
    TASK: Provide a comprehensive, professional, yet easy-to-understand breakdown of the grammar and structure of the following text:
    TEXT: "${text}"
    STUDENT LEVEL: ${userLevel}

    YOUR RESPONSE SHOULD INCLUDE:
    1. **Sentence Structure**: Identify the type of sentence and its main components (Subject, Verb, Object).
    2. **Parts of Speech**: Briefly explain key words and their roles.
    3. **Tense and Mood**: Identify the tense used and why.
    4. **Advanced Tips**: If applicable for Level ${userLevel}, suggest a more natural way to phrase it.

    FORMAT: Use Markdown with bold headers. Keep it educational.
  `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "I'm sorry, I couldn't generate an explanation right now.";
    } catch (e) {
        console.error("Grammar explanation error", e);
        return "Failed to analyze grammar. Please check your connection.";
    }
};
