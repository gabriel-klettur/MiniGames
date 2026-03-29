export type Category =
  | 'search-algorithms'
  | 'evaluation'
  | 'optimization'
  | 'architecture'
  | 'data-structures'
  | 'testing'
  | 'machine-learning';

export type Difficulty = 1 | 2 | 3;

export type QuestionType =
  | 'definition-to-term'
  | 'term-to-definition'
  | 'true-false'
  | 'match-columns';

export interface Concept {
  id: string;
  term: string;
  termEs: string;
  category: Category;
  definition: string;
  keyPoints: string[];
  codeSnippet?: string;
  relatedConcepts: string[];
  difficulty: Difficulty;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface MatchPair {
  termId: string;
  term: string;
  definition: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  category: Category;
  difficulty: Difficulty;
  conceptId: string;
  prompt: string;
  options?: QuizOption[];
  pairs?: MatchPair[];
  correctAnswer: string | string[];
  explanation: string;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
}

export interface QuizConfig {
  categories: Category[];
  difficulties: Difficulty[];
  questionCount: number;
  questionTypes: QuestionType[];
}

export interface CategoryStats {
  correct: number;
  total: number;
}

export interface QuizStats {
  totalAnswered: number;
  totalCorrect: number;
  streak: number;
  bestStreak: number;
  byCategory: Record<Category, CategoryStats>;
  byDifficulty: Record<Difficulty, CategoryStats>;
}

export interface CurrentQuiz {
  questions: Question[];
  currentIndex: number;
  answers: UserAnswer[];
  startTime: number;
}

export type ViewId = 'home' | 'study' | 'quiz' | 'review' | 'results';

export interface QuizState {
  currentView: ViewId;
  quizConfig: QuizConfig;
  currentQuiz: CurrentQuiz | null;
  stats: QuizStats;
  mistakeBank: string[];
}
