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
  // DB/Repository compatible fields (snake_case)
  current_level: string;
  target_level: string;
  xp_total: number;
  streak_count: number;
  last_practice_at?: string;
  // Legacy/Optional fields
  password?: string;
  isAdmin?: boolean;
  voice?: string;
  interests: string[];
  learningStyle?: 'visual' | 'auditory' | 'practical';
  dailyGoalMins?: number;
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

// SESSION & PROGRESS
export interface Session {
  id?: string;
  username: string;
  session_type: 'call' | 'vocab' | 'pronunciation' | 'roleplay';
  scenario?: string;
  duration_seconds: number;
  xp_earned: number;
  score?: number;
  details?: any;
  created_at?: string;
}

export interface WordAnalysis {
  word: string;
  isCorrect: boolean;
  errorType?: 'mispronounced' | 'skipped' | 'tone' | string;
  suggestion?: string;
}

export interface PronunciationResult {
  id?: string;
  username: string;
  phrase: string;
  score: number;
  word_analysis?: WordAnalysis[];
  words?: WordAnalysis[]; // Alias for API response
  feedback: string;
  toneAnalysis?: string;
  dictionAnalysis?: string;
  improvementTips?: string[];
  created_at?: string;
}

export type PronunciationAnalysis = Omit<PronunciationResult, 'username' | 'id' | 'created_at'>;

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  audioUrl?: string;
  corrections?: {
    original: string;
    correction: string;
    explanation: string;
  }[];
}

// Modules & Lessons
export interface Lesson {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  score?: number;
  content?: InteractiveContent;
  imageUrl?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isGenerated: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  syllabus?: string[];
}

// Vocab Screen specific type
export interface VocabWord {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  example: string;
  level: string;
}

export type AppState = 'auth' | 'admin' | 'onboarding' | 'loading_course' | 'dashboard' | 'module_view' | 'lesson_view' | 'loading' | 'login' | 'call' | 'vocab' | 'pronunciation' | 'settings' | 'academy';