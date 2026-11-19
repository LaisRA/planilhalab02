import {AppState} from '../types';

const STORAGE_KEY = 'planilhalab_state_v1';

export function getTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDefaultState(): AppState {
  const today = getTodayISO();
  return {
    completedLessons: [],
    completedExercises: {},
    completedQuizzes: [],
    notes: [
      {
        id: 'note-welcome',
        title: 'Resumo de Atalhos Úteis',
        content:
          'F4 trava referências ($A$1).\nCtrl + Alt + T converte a base em Tabela Oficial.\nCtrl + Shift + L ativa filtros rapidamente.\nSempre usar FALSO (ou 0) no final do PROCV.',
        lessonId: 'l-02',
        updatedAt: new Date().toISOString(),
      },
    ],
    reminders: [
      {
        id: 'rem-initial',
        title: 'Praticar 2 exercícios de PROCV e SOMASE',
        date: today,
        time: '19:00',
        recurrence: 'dias-uteis',
        lessonId: 'l-08',
        done: false,
      },
    ],
    focusStats: {
      todayDate: today,
      todayMinutes: 0,
      totalMinutes: 0,
      completedSessions: 0,
    },
    preferences: {
      theme: 'light',
      formulaLang: 'pt',
    },
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaults = getDefaultState();
    const today = getTodayISO();
    const focus = parsed.focusStats || defaults.focusStats;
    return {
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : defaults.completedLessons,
      completedExercises:
        parsed.completedExercises && typeof parsed.completedExercises === 'object'
          ? parsed.completedExercises
          : defaults.completedExercises,
      completedQuizzes: Array.isArray(parsed.completedQuizzes) ? parsed.completedQuizzes : defaults.completedQuizzes,
      notes: Array.isArray(parsed.notes) ? parsed.notes : defaults.notes,
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : defaults.reminders,
      focusStats: {
        todayDate: today,
        todayMinutes: focus.todayDate === today ? focus.todayMinutes || 0 : 0,
        totalMinutes: focus.totalMinutes || 0,
        completedSessions: focus.completedSessions || 0,
      },
      preferences: {
        theme: parsed.preferences?.theme === 'dark' ? 'dark' : 'light',
        formulaLang: parsed.preferences?.formulaLang === 'en' ? 'en' : 'pt',
      },
    };
  } catch {
    return getDefaultState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function exportProgressJSON(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planilhalab_backup_${getTodayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedBackup(text: string): AppState | null {
  try {
    const parsed = JSON.parse(text) as Partial<AppState>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.completedLessons) || !Array.isArray(parsed.notes)) return null;
    const defaults = getDefaultState();
    return {
      ...defaults,
      ...parsed,
      completedExercises: parsed.completedExercises || {},
      completedQuizzes: Array.isArray(parsed.completedQuizzes) ? parsed.completedQuizzes : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      focusStats: parsed.focusStats || defaults.focusStats,
      preferences: {
        theme: parsed.preferences?.theme === 'dark' ? 'dark' : 'light',
        formulaLang: parsed.preferences?.formulaLang === 'en' ? 'en' : 'pt',
      },
    };
  } catch {
    return null;
  }
}
