// 🚀 Director's Barrel File
// This file aggregates all AI services for backward compatibility.
// Refactored on 2026-02-08

import { GoogleGenAI, Type, Modality } from "@google/genai";

// Exports from modules
export { GoogleGenAI, Type, Modality };
export { getClient } from "./ai/client";
export { playRawAudio, decodeAudioData, blobToBase64 } from "./ai/audio";
export { generateSyllabus, generateModuleLessons, generateInteractiveContent } from "./ai/generators";
export { evaluatePronunciation, analyzeStudentResponse, explainGrammar } from "./ai/analysis";
export { generateSpeech } from "./ai/tts";
export { LiveSession } from "./ai/live";

// Note: generateLessonImage stub removed as it was disabled.
export const generateLessonImage = async (promptText: string, aspectRatio: string = '16:9'): Promise<string | null> => {
  // TEMPORARILY DISABLED: Image generation quota exhausted
  console.log("Image generation disabled (quota exhausted)");
  return null;
};