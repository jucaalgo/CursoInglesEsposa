import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { UserProfile, Course, ChatMessage, InteractiveContent, PronunciationResult, Lesson, Module } from "../types";

// Helper to get client with current key
// MODIFIED: Checks LocalStorage first, then Env variable safely.
const getClient = () => {
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

// --- UTILS ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- AUDIO PLAYBACK ---

let playbackContext: AudioContext | null = null;

export const playRawAudio = async (base64Str: string) => {
  if (!base64Str) return;
  if (!playbackContext) {
    playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  // Resume context if suspended (browser autoplay policy)
  if (playbackContext.state === 'suspended') {
    await playbackContext.resume();
  }

  try {
    const bytes = decode(base64Str);
    const audioBuffer = await decodeAudioData(bytes, playbackContext, 24000, 1);

    const source = playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playbackContext.destination);
    source.start(0);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

// --- VISUALS ---

export const generateLessonImage = async (promptText: string, aspectRatio: string = '16:9'): Promise<string | null> => {
  try {
    const client = getClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `Create a modern, minimalist, vector-style flat illustration representing: "${promptText}". Use soft, educational colors. No text in the image.`
        }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      },
    });

    // Safe access
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.warn("Image generation failed", error);
    return null;
  }
};

// --- COURSE GENERATION (HIERARCHICAL) ---

export const generateSyllabus = async (profile: UserProfile): Promise<string[]> => {
  const client = getClient();
  const prompt = `
      Act as a Lead Curriculum Designer.
      Student Profile: Level ${profile.currentLevel} -> ${profile.targetLevel}. Interests: ${profile.interests.join(', ')}.
      
      Create a comprehensive list of exactly 50 FOCUS AREAS (Broad Topics) for their learning journey.
      Examples: "Airport Survival", "Business Email Etiquette", "Past Tense Mastery", "Ordering Food".
      Order them progressively from easiest to hardest.
      Return ONLY a JSON array of 50 strings.
    `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Syllabus gen error", e);
    return Array.from({ length: 50 }, (_, i) => `Focus Area ${i + 1}: English Topic`);
  }
};

export const generateModuleLessons = async (moduleTitle: string, userLevel: string): Promise<string[]> => {
  const client = getClient();
  const prompt = `
      For the English Focus Area: "${moduleTitle}" (Level ${userLevel}).
      Generate exactly 10 distinct, sequential STEPS (Lesson Titles) to master this area.
      They should form a clear roadmap.
      Return ONLY a JSON array of 10 strings.
    `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return Array.from({ length: 10 }, (_, i) => `${moduleTitle} - Step ${i + 1}`);
  }
};

// --- INTERACTIVE LESSON CONTENT ---

// MODIFIED: Accepts moduleTitle to ensure Context Relevance
export const generateInteractiveContent = async (lessonTitle: string, userLevel: string, moduleTitle: string = "English"): Promise<InteractiveContent> => {
  const client = getClient();
  // STRICT CONTEXT ENFORCEMENT PROMPT
  const prompt = `Create INTERACTIVE English lesson content.
    Target Lesson: "${lessonTitle}" inside the Module: "${moduleTitle}".
    Target Level: ${userLevel}.
    
    STRICT CONTEXT RULE: All vocabulary, quiz questions, scramble sentences, and dialogue MUST be 100% related to "${lessonTitle}". Do not generate random generic English content.
    
    Structure:
    1. Scenario: Short dialogue context.
    2. Vocabulary: 4 key words strictly from the context.
    3. Quiz: 2 multiple choice questions regarding the scenario.
    4. FillInBlanks: 2 sentences related to "${lessonTitle}" where the user must pick the correct word.
    5. Scramble: One sentence related to "${lessonTitle}" that the user must unscramble.
    6. Conversation: A roleplay script.
       - EXACTLY 3 interactions (Tutor asks, Student replies).
       - Total 6 turns (Tutor, Student, Tutor, Student, Tutor, Student).
       - The 'text' for the student is what they SHOULD say.
    
    Return JSON.`;

  const fetchContent = client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenario: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              dialogueScript: { type: Type.STRING },
              context: { type: Type.STRING }
            }
          },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              }
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER }
              }
            }
          },
          fillInBlanks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sentence: { type: Type.STRING },
                correctWord: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                translation: { type: Type.STRING }
              }
            }
          },
          scramble: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              sentence: { type: Type.STRING, description: "The correct full sentence" },
              scrambledParts: { type: Type.ARRAY, items: { type: Type.STRING } },
              translation: { type: Type.STRING }
            }
          },
          conversation: {
            type: Type.OBJECT,
            properties: {
              goal: { type: Type.STRING },
              turns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING, enum: ["Tutor", "Student"] },
                    text: { type: Type.STRING },
                    translation: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), 90000)
  );

  try {
    const response = await Promise.race([fetchContent, timeout]) as any;
    const text = response.text || '{}';
    const json = JSON.parse(text);

    if (!json.scenario || !json.vocabulary) {
      throw new Error("Received incomplete lesson structure.");
    }

    // Sanitize defaults
    if (!json.fillInBlanks) json.fillInBlanks = [];
    if (!json.scramble) {
      json.scramble = { id: 'def', sentence: 'Hello world', scrambledParts: ['world', 'Hello'], translation: 'Hola mundo' };
    }
    if (!json.conversation || !json.conversation.turns) {
      json.conversation = {
        goal: "Practice greeting",
        turns: [
          { speaker: "Tutor", text: "Hello!" },
          { speaker: "Student", text: "Hi, how are you?" }
        ]
      };
    }

    return json;
  } catch (error) {
    console.error("Content generation error:", error);
    throw error;
  }
}

// --- PRONUNCIATION EVALUATION (ADVANCED) ---

export const evaluatePronunciation = async (
  targetPhrase: string,
  audioBase64: string,
  userLevel: string
): Promise<PronunciationResult> => {
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

    const response = await client.models.generateContent({
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

    return JSON.parse(response.text || '{"score": 0, "feedback": "Could not analyze", "words": []}');
  } catch (e) {
    console.error("Pronunciation eval error", e);
    return { score: 0, feedback: "Analysis error. Check API Key.", words: [] };
  }
};

export const analyzeStudentResponse = async (
  prompt: string,
  studentInput: string | null,
  userLevel: string,
  audioBase64?: string
): Promise<ChatMessage> => {
  const client = getClient();
  let parts: any[] = [];

  if (audioBase64) {
    parts.push({ inlineData: { mimeType: 'audio/wav', data: audioBase64 } });
    parts.push({ text: `Analyze audio input for prompt: "${prompt}". Level: ${userLevel}. Return JSON: corrected_text, explanation, reply.` });
  } else {
    parts.push({ text: `Analyze text: "${studentInput}" for prompt: "${prompt}". Level: ${userLevel}. Return JSON: corrected_text, explanation, reply.` });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            corrected_text: { type: Type.STRING },
            explanation: { type: Type.STRING },
            reply: { type: Type.STRING },
          }
        }
      }
    });

    const analysis = JSON.parse(response.text || '{}');
    return {
      id: Date.now().toString(),
      role: 'model',
      text: analysis.reply || "Great job!",
      corrections: [{
        original: studentInput || "(Voice Input)",
        correction: analysis.corrected_text || "",
        explanation: `${analysis.explanation || ""}`
      }]
    };
  } catch (e) {
    console.error("Analysis error", e);
    return { id: Date.now().toString(), role: 'model', text: "I understood that. Good job!", corrections: [] };
  }
};

// --- TTS ---

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
  } catch (e: any) {
    console.error("TTS generation failed:", e);
    // Specific handling for "prompt not supported" which usually means safety filter triggered on text or invalid chars
    if (e.message?.includes("prompt is not supported by the AudioOut model")) {
      console.warn("TTS fallback: content might be filtered.");
    }
    throw e;
  }
};

// --- LIVE API ---

export class LiveSession {
  private sessionPromise: Promise<any> | null = null;
  private inputContext: AudioContext;
  private outputContext: AudioContext;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime: number = 0;
  private onMessageCallback: (text: string | null, isInterrupted: boolean) => void;
  private stream: MediaStream | null = null;

  constructor(onMessage: (text: string | null, isInterrupted: boolean) => void) {
    this.onMessageCallback = onMessage;
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  async connect(systemInstruction: string, voiceName: string = 'Puck') {
    const client = getClient();
    if (this.outputContext.state === 'suspended') await this.outputContext.resume();
    if (this.inputContext.state === 'suspended') await this.inputContext.resume();

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Updated to latest live model
    const config = {
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: async () => {
          if (this.stream) this.startAudioStream(this.stream);
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) this.playAudio(base64Audio);
          const transcript = message.serverContent?.modelTurn?.parts?.[0]?.text;
          const interrupted = !!message.serverContent?.interrupted;
          if (transcript || interrupted) this.onMessageCallback(transcript || null, interrupted);
          if (interrupted) {
            this.nextStartTime = 0;
            this.onMessageCallback("Interrupted", true);
          }
        },
        onclose: () => { },
        onerror: (err: any) => console.error("Live Session Error", err)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemInstruction,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
        }
      }
    };
    this.sessionPromise = client.live.connect(config);
    await this.sessionPromise;
  }

  private startAudioStream(stream: MediaStream) {
    this.inputSource = this.inputContext.createMediaStreamSource(stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      if (this.sessionPromise) {
        this.sessionPromise.then(session => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      }
    };
    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async playAudio(base64: string) {
    this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
    const audioBuffer = await decodeAudioData(decode(base64), this.outputContext, 24000, 1);
    const source = this.outputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputContext.destination);
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  async disconnect() {
    if (this.inputSource) this.inputSource.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.sessionPromise) {
      try {
        const session = await this.sessionPromise;
        // @ts-ignore
        session.close();
      } catch (e) { }
    }
    await this.inputContext.close();
    await this.outputContext.close();
  }
}