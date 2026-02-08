export enum CEFRLevel {
    A1 = 'A1',
    A2 = 'A2',
    B1 = 'B1',
    B2 = 'B2',
    C1 = 'C1',
    C2 = 'C2',
}

// USER PROFILE
export interface UserProfile {
    username: string;
    name: string;
    current_level: string;
    target_level: string;
    xp_total: number;
    streak_count: number;
    last_practice_at?: string;
    interests: string[];
}
export type Profile = UserProfile;

// CONTENT & EXERCISES
export interface VocabularyItem {
    id?: string;
    term: string;
    definition: string;
    translation?: string;
    example?: string;
}

export interface QuizQuestion {
    id?: string;
    question: string;
    options: string[];
    correctIndex: number;
}

export interface ScrambleExercise {
    id?: string;
    sentence: string;
    scrambledParts: string[];
    translation: string;
}

export interface FillInBlankExercise {
    id?: string;
    sentence: string;
    correctWord: string;
    options: string[];
    translation?: string;
}

export interface ConversationTurn {
    speaker: string;
    text: string;
    translation?: string;
}

export interface InteractiveContent {
    scenario: {
        description: string;
        dialogueScript: string;
        context: string;
    };
    vocabulary: VocabularyItem[];
    scramble: ScrambleExercise;
    fillInBlanks: FillInBlankExercise[];
    quiz: QuizQuestion[];
    conversation: {
        turns: ConversationTurn[];
        goal: string;
    };
}
export type AcademyExerciseContent = InteractiveContent;

export interface CourseProgress {
    username: string;
    syllabus: string[];
    completed_lessons: string[];
    current_module_index: number;
}

export interface ConversationScenario {
    id: string;
    title: string;
    titleEs: string;
    description: string;
    icon: string;
    systemPrompt: string;
}

export interface Module {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
}

export interface Lesson {
    id: string;
    title: string;
    isCompleted: boolean;
}

export interface Course {
    id: string;
    title: string;
    modules: Module[];
}

export interface Session {
    id?: string;
    username: string;
    session_type: string;
    scenario: string;
    duration_seconds: number;
    xp_earned: number;
    score: number;
    details?: any; // JSON
    created_at?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    corrections?: {
        original: string;
        correction: string;
        explanation: string;
    }[];
}

export interface PronunciationResult {
    id?: string;
    username: string;
    phrase: string;
    score: number;
    feedback: string;
    word_analysis?: any; // JSON
    improvementTips?: string[];
    created_at?: string;
}
export type PronunciationAnalysis = Omit<PronunciationResult, 'username' | 'id' | 'created_at'> & { words?: any[] };
