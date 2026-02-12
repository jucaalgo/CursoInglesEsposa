import { Type } from "@google/genai";
import { UserProfile, InteractiveContent } from "../../types";
import { getClient } from "./client";

export const generateSyllabus = async (profile: UserProfile): Promise<string[]> => {
    const client = getClient();
    const prompt = `
      Act as a Lead Curriculum Designer.
      Student Profile: Level ${profile.current_level} -> ${profile.target_level}. Interests: ${(profile.interests || []).join(', ')}.
      
      Create a comprehensive list of exactly 50 FOCUS AREAS (Broad Topics) for their learning journey.
      Examples: "Airport Survival", "Business Email Etiquette", "Past Tense Mastery", "Ordering Food".
      Order them progressively from easiest to hardest.
      Return ONLY a JSON array of 50 strings.
    `;

    try {
        const fetchSyllabus = client.models.generateContent({
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

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Syllabus generation timed out")), 60000));
        const response = await Promise.race([fetchSyllabus, timeout]) as { text?: () => string };

        return JSON.parse(response.text ? response.text() : '[]');
    } catch (_e) {
        console.error("Syllabus gen error", _e);
        return Array.from({ length: 50 }, (_, i) => `Focus Area ${i + 1}: English Topic`);
    }
};

// Helper function for cleaning JSON, assuming it's defined elsewhere or will be added.
// For now, it will just parse the JSON.
const cleanJson = (text: string) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Error parsing JSON:", e);
        return []; // Return an empty array or handle error as appropriate
    }
};

export const generateModuleLessons = async (topic: string, level: string, numLessons: number, _moduleTitle: string): Promise<string[]> => {
    const client = getClient();
    const prompt = `
      For the English Focus Area: "${topic}" (Level ${level}).
      Generate exactly ${numLessons} distinct, sequential STEPS (Lesson Titles) to master this area.
      They should form a clear roadmap.
      Return ONLY a JSON array of ${numLessons} strings.
    `;

    try {
        const fetchLessons = client.models.generateContent({
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

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Lesson generation timed out")), 45000));
        const response = await Promise.race([fetchLessons, timeout]) as { text?: () => string };

        return JSON.parse(response.text ? response.text() : '[]');
    } catch (_e) {
        return Array.from({ length: 10 }, (_, i) => `${_moduleTitle} - Step ${i + 1}`);
    }
};

export const generateInteractiveContent = async (lessonTitle: string, userLevel: string, moduleTitle: string = "English"): Promise<InteractiveContent> => {
    const client = getClient();
    const prompt = `
    ROLE: You are an Expert Cambridge English Examiner and Linguist.
    TASK: Generate a high-quality, interactive English lesson about "${lessonTitle}".
    LEVEL: ${userLevel} (Strict adherence required).
    
    GUIDELINES:
    - If Level is A1/A2: Use simple vocab, short sentences, focus on basics.
    - If Level is B1/B2: Use compound sentences, phrasal verbs, idioms.
    - If Level is C1/C2: Use nuance, advanced grammar (inversion, conditionals), sophisticated vocab.
    
    REQUIRED JSON STRUCTURE (Strictly follow field names):
    {
      "scenario": { 
          "description": "Context situation", 
          "dialogueScript": "A: Hello\\nB: Hi", 
          "context": "Brief context" 
      },
      "vocabulary": [
          { "id": "1", "term": "Word", "definition": "Meaning" },
          { "id": "2", "term": "Word2", "definition": "Meaning2" },
          { "id": "3", "term": "Word3", "definition": "Meaning3" },
          { "id": "4", "term": "Word4", "definition": "Meaning4" }
      ],
      "quiz": [
          { "id": "q1", "question": "Question 1?", "options": ["Wrong", "Correct", "Wrong"], "correctIndex": 1 },
          { "id": "q2", "question": "Question 2?", "options": ["Correct", "Wrong", "Wrong"], "correctIndex": 0 }
      ],
      "fillInBlanks": [
          { "id": "f1", "sentence": "I ___ to the store.", "correctWord": "go", "options": ["go", "gone", "went"], "translation": "Voy a la tienda" },
          { "id": "f2", "sentence": "She ___ very happy.", "correctWord": "is", "options": ["is", "are", "be"], "translation": "Ella está muy feliz" }
      ],
      "scramble": { 
          "id": "s1", "sentence": "I like apple pie", "scrambledParts": ["pie", "I", "apple", "like"], "translation": "Me gusta..." 
      },
      "wordMatching": {
          "id": "wm1",
          "pairs": [
              { "word": "Hello", "match": "Hola" },
              { "word": "Goodbye", "match": "Adiós" },
              { "word": "Please", "match": "Por favor" },
              { "word": "Thank you", "match": "Gracias" }
          ]
      },
      "listening": [
          { "id": "l1", "phrase": "Nice to meet you", "answer": "Nice to meet you", "hint": "A greeting" },
          { "id": "l2", "phrase": "How are you doing?", "answer": "How are you doing?", "hint": "Asking about well-being" }
      ],
      "conversation": {
          "goal": "Order food",
          "turns": [
              { "speaker": "Tutor", "text": "What do you want?" },
              { "speaker": "Student", "text": "A pizza please" }
          ]
      }
    }
    
    Use strictly valid JSON. No markdown backticks.`;

    // EMERGENCY FALLBACK CONTENT
    const fallbackContent: InteractiveContent = {
        scenario: {
            description: `Practice Session: ${lessonTitle}`,
            dialogueScript: "Tutor: Ready to practice?\nStudent: Yes, I am ready!",
            context: `Internalizing concepts about ${lessonTitle}`
        },
        vocabulary: [
            { id: "v1", term: "Practice", definition: "To do something repeatedly to improve" },
            { id: "v2", term: "Learn", definition: "To gain knowledge or skill" },
            { id: "v3", term: "Improve", definition: "To get better" },
            { id: "v4", term: "Goal", definition: "The object of a person's ambition" }
        ],
        quiz: [
            {
                id: "q_fallback_1",
                question: `What is the main topic of this lesson?`,
                options: ["Cooking", lessonTitle, "Sports"],
                correctIndex: 1
            },
            {
                id: "q_fallback_2",
                question: "How do you say 'Aprender' in English?",
                options: ["Sleep", "Learn", "Run"],
                correctIndex: 1
            }
        ],
        fillInBlanks: [
            {
                id: "fb_fallback_1",
                sentence: `I want to ___ more about ${lessonTitle}.`,
                correctWord: "learn",
                options: ["learn", "swim", "fly"],
                translation: `Quiero aprender más sobre ${lessonTitle}.`
            },
            {
                id: "fb_fallback_2",
                sentence: "Practice makes ___.",
                correctWord: "perfect",
                options: ["perfect", "bad", "tired"],
                translation: "La práctica hace al maestro."
            }
        ],
        scramble: {
            id: "sc_fallback_1",
            sentence: "English is very useful",
            scrambledParts: ["useful", "is", "English", "very"],
            translation: "El inglés es muy útil"
        },
        wordMatching: {
            id: "wm_fallback_1",
            pairs: [
                { word: "Practice", match: "Practicar" },
                { word: "Learn", match: "Aprender" },
                { word: "Improve", match: "Mejorar" },
                { word: "Goal", match: "Meta" }
            ]
        },
        listening: [
            { id: "l_fallback_1", phrase: "I want to learn English", answer: "I want to learn English", hint: "About learning" },
            { id: "l_fallback_2", phrase: "Practice makes perfect", answer: "Practice makes perfect", hint: "A proverb" }
        ],
        conversation: {
            goal: `Discuss ${lessonTitle} with the tutor.`,
            turns: [
                { speaker: "Tutor", text: `What do you know about ${lessonTitle}?`, translation: "¿Qué sabes sobre este tema?" },
                { speaker: "Student", text: "I am learning about it now.", translation: "Estoy aprendiendo sobre ello ahora." },
                { speaker: "Tutor", text: "That is great! Keep going.", translation: "¡Eso es genial! Continúa así." },
                { speaker: "Student", text: "Thank you for your help.", translation: "Gracias por tu ayuda." }
            ]
        }
    };

    try {
        const fetchContent = client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scenario: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, dialogueScript: { type: Type.STRING }, context: { type: Type.STRING } } },
                        vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, term: { type: Type.STRING }, definition: { type: Type.STRING } } } },
                        quiz: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctIndex: { type: Type.INTEGER } } } },
                        fillInBlanks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, sentence: { type: Type.STRING }, correctWord: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, translation: { type: Type.STRING } } } },
                        scramble: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, sentence: { type: Type.STRING }, scrambledParts: { type: Type.ARRAY, items: { type: Type.STRING } }, translation: { type: Type.STRING } } },
                        wordMatching: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, pairs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, match: { type: Type.STRING } } } } } },
                        listening: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, phrase: { type: Type.STRING }, answer: { type: Type.STRING }, hint: { type: Type.STRING } } } },
                        conversation: { type: Type.OBJECT, properties: { goal: { type: Type.STRING }, turns: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { speaker: { type: Type.STRING }, text: { type: Type.STRING }, translation: { type: Type.STRING } } } } } }
                    }
                }
            }
        });

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 90000)
        );

        const response = await Promise.race([fetchContent, timeout]) as { text?: () => string };
        const text = response.text ? response.text() : '{}';
        let json = JSON.parse(text);

        // Validate JSON content - if empty arrays, USE FALLBACK
        if (!json.quiz || json.quiz.length === 0) {
            console.warn("Gemini returned empty quiz. Using fallback.");
            return fallbackContent;
        }

        return json;
    } catch (error) {
        console.error("Content generation error, using FALLBACK:", error);
        return fallbackContent;
    }
};
