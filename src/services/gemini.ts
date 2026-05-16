// Director's Barrel File
// Aggregates all AI services for backward compatibility.

import { GoogleGenAI, Type, Modality } from "@google/genai";

// Exports from modules
export { GoogleGenAI, Type, Modality };
export { callGemini, getLiveApiKey } from "./ai/client";
export { playRawAudio, stopCurrentAudio, setPlaybackSpeed, getPlaybackSpeed, decodeAudioData, blobToBase64 } from "./ai/audio";
export { generateSyllabus, generateModuleLessons, generateInteractiveContent } from "./ai/generators";
export { evaluatePronunciation, analyzeStudentResponse, explainGrammar } from "./ai/analysis";
export { generateSpeech } from "./ai/tts";
export { LiveSession } from "./ai/live";

export const generateLessonImage = async (promptText: string, _aspectRatio: string = '16:9'): Promise<string | null> => {
  console.log("Image generation disabled (quota exhausted)");
  return null;
};