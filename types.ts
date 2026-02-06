export enum CEFRLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export interface UserProfile {
  username?: string;
  password?: string;
  isAdmin?: boolean;
  name: string;
  voice?: string;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  interests: string[];
  learningStyle: 'visual' | 'auditory' | 'practical';
  dailyGoalMins: number;
  // State persistence fields
  lastActiveModuleId?: string | null;
  lastActiveLessonId?: string | null;
}

export interface VocabularyItem {
  id: string;
  term: string;
  definition: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

// Replaced Crossword with Sentence Scramble
export interface ScrambleExercise {
  id: string;
  sentence: string; // The full correct sentence
  scrambledParts: string[]; // The words mixed up
  translation: string;
}

export interface FillInBlankExercise {
  id: string;
  sentence: string; // The sentence with a placeholder
  correctWord: string;
  options: string[]; // Distractors
  translation: string;
}

export interface PronunciationResult {
  score: number;
  feedback: string;
  toneAnalysis?: string; // New: Tone feedback
  dictionAnalysis?: string; // New: Diction/Articulation feedback
  improvementTips?: string[]; // New: Specific corrections
  words: {
    word: string;
    isCorrect: boolean;
    errorType?: 'mispronounced' | 'skipped' | 'tone'; // New
  }[];
}

export interface ConversationTurn {
  speaker: 'Tutor' | 'Student';
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
  scramble: ScrambleExercise; // New game
  fillInBlanks: FillInBlankExercise[];
  quiz: QuizQuestion[];
  conversation: { // New multi-turn speaking
    turns: ConversationTurn[];
    goal: string;
  };
}

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

export type AppState = 'auth' | 'admin' | 'onboarding' | 'loading_course' | 'dashboard' | 'module_view' | 'lesson_view';