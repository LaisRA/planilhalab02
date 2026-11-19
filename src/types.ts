export type ViewId = 'trilha' | 'pratica' | 'gerador' | 'guia' | 'caderno';

export type FormulaLang = 'pt' | 'en';
export type ThemeMode = 'light' | 'dark';

export type ModuleLevel = 'Básico' | 'Intermediário' | 'Análise' | 'Avançado';

export interface LessonSyntax {
  pt: string;
  en: string;
  meaning: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  level: ModuleLevel;
  title: string;
  subtitle: string;
  duration: string;
  videoId: string;
  videoTitle: string;
  channel: string;
  summary: string;
  keyPoints: string[];
  syntaxes: LessonSyntax[];
  pitfall: string;
  linkedExerciseId?: string;
}

export interface CurriculumModule {
  id: string;
  order: number;
  level: ModuleLevel;
  title: string;
  description: string;
}

export interface CellData {
  raw: string;
  editable?: boolean;
  isHeader?: boolean;
  align?: 'left' | 'right' | 'center';
  format?: 'currency' | 'percent' | 'number' | 'text';
}

export interface SpreadsheetExercise {
  id: string;
  order: number;
  level: ModuleLevel;
  title: string;
  scenario: string;
  instructionPt: string;
  instructionEn: string;
  cols: string[];
  rows: number;
  cells: Record<string, CellData>;
  targetCell: string;
  expectedValue: number | string;
  tolerance?: number;
  requiredFormulaTokensPt: string[];
  requiredFormulaTokensEn: string[];
  exampleSolutionPt: string;
  exampleSolutionEn: string;
  hints: string[];
  explanation: string;
}

export interface QuickQuizQuestion {
  id: string;
  level: ModuleLevel;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FormulaRef {
  id: string;
  pt: string;
  en: string;
  category: 'Matemática' | 'Lógica' | 'Busca' | 'Texto' | 'Data' | 'Estatística' | 'Erro';
  description: string;
  syntaxPt: string;
  syntaxEn: string;
  examplePt: string;
  exampleEn: string;
  tip: string;
}

export interface ExcelErrorRef {
  codePt: string;
  codeEn: string;
  meaning: string;
  cause: string;
  fix: string;
}

export interface ShortcutRef {
  id: string;
  category: 'Navegação' | 'Seleção' | 'Fórmulas' | 'Formatação';
  win: string;
  mac: string;
  action: string;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  lessonId: string; // '' for general note
  updatedAt: string;
}

export type ReminderRecurrence = 'uma-vez' | 'diario' | 'dias-uteis' | 'semanal';

export interface StudyReminder {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  recurrence: ReminderRecurrence;
  lessonId: string;
  done: boolean;
}

export interface FocusStats {
  todayDate: string; // YYYY-MM-DD
  todayMinutes: number;
  totalMinutes: number;
  completedSessions: number;
}

export interface AppState {
  completedLessons: string[];
  completedExercises: Record<string, string>; // exerciseId -> formula used
  completedQuizzes: string[];
  notes: StudyNote[];
  reminders: StudyReminder[];
  focusStats: FocusStats;
  preferences: {
    theme: ThemeMode;
    formulaLang: FormulaLang;
  };
}
