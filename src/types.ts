export interface Topic {
  id: string;
  title: string;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  keyTerms: string[];
  readingsOrRefs?: string[];
  isCompleted?: boolean;
}

export interface Module {
  id: string;
  title: string;
  weekNumber: number;
  orderIndex: number;
  description: string;
  topics: Topic[];
}

export interface Deadline {
  id: string;
  title: string;
  type: 'exam' | 'assignment' | 'quiz' | 'project' | 'reading';
  dueDate: string;
  weightPercent?: number;
  description?: string;
  isCompleted?: boolean;
  relatedTopicTitle?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor?: string;
  term?: string;
  description?: string;
  createdAt: string;
  modules: Module[];
  deadlines: Deadline[];
  suggestedStudyOrderExplanation?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  topicId?: string;
  topicTitle?: string;
  isInitialGreeting?: boolean;
}

export interface Note {
  id: string;
  courseId: string;
  courseName: string;
  topicId?: string;
  topicTitle: string;
  title: string;
  content: string; // Markdown formatted
  createdAt: string;
  updatedAt: string;
  tags: string[];
  aiGenerated?: boolean;
  analysis?: {
    summary?: string;
    identifiedGaps?: string[];
    quizQuestions?: {
      question: string;
      answer: string;
      explanation?: string;
    }[];
  };
}

export interface YouTubeRecommendation {
  id: string;
  title: string;
  searchQuery: string;
  whyRelevant: string;
  recommendedChannelStyle?: string;
  difficultyLevel: 'Quick Overview' | 'Deep Dive' | 'Visual Intuition' | 'Problem Solving';
  youtubeSearchUrl: string;
}

export interface FocusSession {
  id: string;
  date: string;
  durationMinutes: number;
  type: 'pomodoro' | 'stopwatch';
  topicTitle?: string;
  courseName?: string;
}
