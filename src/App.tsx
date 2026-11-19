import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Bell,
  BookOpen,
  Database,
  Download,
  GraduationCap,
  Menu,
  MessageCircle,
  Moon,
  NotebookPen,
  Sun,
  Table2,
  Timer,
  Upload,
  WifiOff,
  X,
} from 'lucide-react';
import {CurriculumView} from './components/CurriculumView';
import {DataGeneratorView} from './components/DataGeneratorView';
import {FocusTimerController, FocusTimerModal, formatTimerMMSS} from './components/FocusTimerDrawer';
import {NotesRemindersView} from './components/NotesRemindersView';
import {OfflineGuideView} from './components/OfflineGuideView';
import {PracticeView} from './components/PracticeView';
import {PWAInstallButton} from './components/PWAInstallButton';
import {useOnlineStatus} from './hooks/useOnlineStatus';
import {AppState, Lesson, StudyNote, StudyReminder, ViewId} from './types';
import {
  exportProgressJSON,
  getTodayISO,
  loadAppState,
  parseImportedBackup,
  saveAppState,
} from './utils/storage';

const NAV_ITEMS: {id: ViewId; label: string; icon: React.ComponentType<{className?: string}>}[] = [
  {id: 'trilha', label: 'Trilha & Aulas', icon: GraduationCap},
  {id: 'pratica', label: 'Prática', icon: Table2},
  {id: 'gerador', label: 'Gerador de Dados', icon: Database},
  {id: 'guia', label: 'Guia Offline', icon: BookOpen},
  {id: 'caderno', label: 'Caderno & Lembretes', icon: NotebookPen},
];

function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch {
    // Ignore audio context restriction errors
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activeView, setActiveView] = useState<ViewId>('trilha');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [targetExerciseId, setTargetExerciseId] = useState<string | null>(null);
  const [draftNoteLessonId, setDraftNoteLessonId] = useState<string | null>(null);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [dismissedReminderBanner, setDismissedReminderBanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isOnline = useOnlineStatus();

  // Battery-friendly Focus Timer state (timestamp-based, interval runs ONLY while active)
  const [timerMode, setTimerMode] = useState<'foco' | 'pausa'>('foco');
  const [presetMinutes, setPresetMinutes] = useState<number>(25);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const endTimeRef = useRef<number | null>(null);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.preferences.theme]);

  // Persist locally on state changes
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  // Focus timer tick loop (zero CPU usage when paused!)
  useEffect(() => {
    if (!isRunning) return;
    endTimeRef.current = Date.now() + remainingSeconds * 1000;

    const interval = window.setInterval(() => {
      if (!endTimeRef.current) return;
      const diff = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (diff <= 0) {
        window.clearInterval(interval);
        setIsRunning(false);
        setRemainingSeconds(0);
        if (soundEnabled) playGentleChime();
        if (timerMode === 'foco') {
          const today = getTodayISO();
          setState((prev) => ({
            ...prev,
            focusStats: {
              todayDate: today,
              todayMinutes: (prev.focusStats.todayDate === today ? prev.focusStats.todayMinutes : 0) + presetMinutes,
              totalMinutes: prev.focusStats.totalMinutes + presetMinutes,
              completedSessions: prev.focusStats.completedSessions + 1,
            },
          }));
        }
      } else {
        setRemainingSeconds(diff);
      }
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const timerController: FocusTimerController = useMemo(
    () => ({
      mode: timerMode,
      presetMinutes,
      remainingSeconds,
      isRunning,
      soundEnabled,
      setPreset: (mode, minutes) => {
        setIsRunning(false);
        setTimerMode(mode);
        setPresetMinutes(minutes);
        setRemainingSeconds(minutes * 60);
      },
      toggleRun: () => {
        if (remainingSeconds <= 0) {
          setRemainingSeconds(presetMinutes * 60);
          setIsRunning(true);
        } else {
          setIsRunning((r) => !r);
        }
      },
      reset: () => {
        setIsRunning(false);
        setRemainingSeconds(presetMinutes * 60);
      },
      toggleSound: () => setSoundEnabled((s) => !s),
    }),
    [timerMode, presetMinutes, remainingSeconds, isRunning, soundEnabled]
  );

  // Today / overdue reminders for non-intrusive reminder strip
  const dueReminders = useMemo(() => {
    const today = getTodayISO();
    return state.reminders.filter((r) => !r.done && r.date <= today);
  }, [state.reminders]);

  const handleToggleLesson = useCallback((lessonId: string) => {
    setState((prev) => {
      const exists = prev.completedLessons.includes(lessonId);
      return {
        ...prev,
        completedLessons: exists
          ? prev.completedLessons.filter((id) => id !== lessonId)
          : [...prev.completedLessons, lessonId],
      };
    });
  }, []);

  const handleExerciseSolved = useCallback((exerciseId: string, formulaUsed: string) => {
    setState((prev) => ({
      ...prev,
      completedExercises: {
        ...prev.completedExercises,
        [exerciseId]: formulaUsed,
      },
    }));
  }, []);

  const handleQuizSolved = useCallback((quizId: string) => {
    setState((prev) => {
      if (prev.completedQuizzes.includes(quizId)) return prev;
      return {...prev, completedQuizzes: [...prev.completedQuizzes, quizId]};
    });
  }, []);

  const handleSaveNote = useCallback((note: StudyNote) => {
    setState((prev) => {
      const exists = prev.notes.some((n) => n.id === note.id);
      return {
        ...prev,
        notes: exists ? prev.notes.map((n) => (n.id === note.id ? note : n)) : [note, ...prev.notes],
      };
    });
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
    }));
  }, []);

  const handleAddReminder = useCallback((reminder: StudyReminder) => {
    setState((prev) => ({
      ...prev,
      reminders: [reminder, ...prev.reminders],
    }));
    setDismissedReminderBanner(false);
  }, []);

  const handleToggleReminder = useCallback((reminderId: string) => {
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) => (r.id === reminderId ? {...r, done: !r.done} : r)),
    }));
  }, []);

  const handleDeleteReminder = useCallback((reminderId: string) => {
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((r) => r.id !== reminderId),
    }));
  }, []);

  const handleOpenExercise = useCallback((exerciseId: string) => {
    setTargetExerciseId(exerciseId);
    setActiveView('pratica');
    setMobileNavOpen(false);
  }, []);

  const handleCreateNoteForLesson = useCallback((lesson: Lesson) => {
    setDraftNoteLessonId(lesson.id);
    setActiveView('caderno');
    setMobileNavOpen(false);
  }, []);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = parseImportedBackup(String(reader.result || ''));
      if (imported) {
        setState(imported);
        setBackupMessage('Progresso restaurado com sucesso.');
      } else {
        setBackupMessage('Arquivo de backup inválido.');
      }
      setTimeout(() => setBackupMessage(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleTheme = () => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme: prev.preferences.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  };

  const setFormulaLang = (lang: 'pt' | 'en') => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        formulaLang: lang,
      },
    }));
  };

  const activeNavLabel = NAV_ITEMS.find((n) => n.id === activeView)?.label || 'Trilha & Aulas';

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Marca */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setActiveView('trilha');
              setMobileNavOpen(false);
            }}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap"
          >
            PlanilhaLab
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Fechar menu"
            className="lg:hidden p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação principal (5 links limpos de linha única) */}
        <nav className="space-y-1" aria-label="Seções principais">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveView(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                  active
                    ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-700 dark:text-emerald-400' : ''}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dock inferior da barra lateral: Timer compacto + Tema + Backup + PWA */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        {/* Dock do Timer de Foco */}
        <button
          type="button"
          onClick={() => setTimerModalOpen(true)}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] px-3 py-2.5 text-left hover:border-emerald-600 transition-colors duration-150"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Timer className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                {isRunning ? (timerMode === 'foco' ? 'Foco ativo' : 'Em pausa') : 'Timer de Foco'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Hoje: {state.focusStats.todayMinutes} min
              </div>
            </div>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 shrink-0">
            {formatTimerMMSS(remainingSeconds)}
          </span>
        </button>

        {/* Contato da criadora */}
        <a
          href="https://wa.me/5537999046824"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B0F14] px-3 py-2.5 hover:border-emerald-600 transition-colors duration-150"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Criado por</div>
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">LAIS RANIELE</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            <span>WhatsApp (37) 99904-6824</span>
          </div>
        </a>

        {/* Tema Claro / Escuro OLED */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            {state.preferences.theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{state.preferences.theme === 'dark' ? 'Tema Claro' : 'Modo Escuro (Bateria)'}</span>
          </span>
        </button>

        {/* Backup Local JSON */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              exportProgressJSON(state);
              setBackupMessage('Backup local exportado.');
              setTimeout(() => setBackupMessage(null), 2500);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {backupMessage && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center">{backupMessage}</p>
        )}

        {/* Botão de Instalação PWA */}
        <PWAInstallButton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0B0F14] text-slate-900 dark:text-slate-100">
      {/* Sidebar Desktop Fixa */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Drawer Mobile */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-68 max-w-[82vw] bg-white dark:bg-[#111820] border-r border-slate-200 dark:border-slate-800 h-full">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/45" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      {/* Área Principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Cabeçalho Contextual Limpo */}
        <header className="sticky top-0 z-30 h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#111820]/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir navegação"
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline whitespace-nowrap">
                PlanilhaLab
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Seletor PT-BR / EN para sintaxe de fórmulas */}
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Idioma das fórmulas"
            >
              <button
                type="button"
                onClick={() => setFormulaLang('pt')}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap ${
                  state.preferences.formulaLang === 'pt'
                    ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                PT-BR
              </button>
              <button
                type="button"
                onClick={() => setFormulaLang('en')}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap ${
                  state.preferences.formulaLang === 'en'
                    ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Botão rápido de Foco */}
            <button
              type="button"
              onClick={() => setTimerModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors whitespace-nowrap"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{isRunning ? formatTimerMMSS(remainingSeconds) : 'Foco'}</span>
            </button>
          </div>
        </header>

        {/* Faixa de Lembrete Ativo Hoje (se houver e não dispensado) */}
        {dueReminders.length > 0 && !dismissedReminderBanner && (
          <div className="border-b border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/30 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 min-w-0">
              <Bell className="w-3.5 h-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
              <span className="truncate">
                <strong>Lembrete de estudo:</strong> {dueReminders[0].title} ({dueReminders[0].time})
                {dueReminders.length > 1 ? ` e mais ${dueReminders.length - 1}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveView('caderno')}
                className="font-semibold text-emerald-800 dark:text-emerald-300 hover:underline whitespace-nowrap"
              >
                Ver agenda
              </button>
              <button
                type="button"
                onClick={() => setDismissedReminderBanner(true)}
                aria-label="Dispensar aviso"
                className="text-emerald-700 dark:text-emerald-400 hover:opacity-75"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo da Vista Ativa */}
        <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {activeView === 'trilha' && (
            <CurriculumView
              state={state}
              isOnline={isOnline}
              formulaLang={state.preferences.formulaLang}
              onToggleLesson={handleToggleLesson}
              onOpenExercise={handleOpenExercise}
              onCreateNoteForLesson={handleCreateNoteForLesson}
            />
          )}

          {activeView === 'pratica' && (
            <PracticeView
              state={state}
              formulaLang={state.preferences.formulaLang}
              initialExerciseId={targetExerciseId}
              onExerciseSolved={handleExerciseSolved}
              onQuizSolved={handleQuizSolved}
            />
          )}

          {activeView === 'gerador' && <DataGeneratorView />}

          {activeView === 'guia' && <OfflineGuideView formulaLang={state.preferences.formulaLang} />}

          {activeView === 'caderno' && (
            <NotesRemindersView
              state={state}
              draftNoteLessonId={draftNoteLessonId}
              onClearDraftLesson={() => setDraftNoteLessonId(null)}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
            />
          )}
        </main>
      </div>

      {/* Modal do Timer de Foco */}
      <FocusTimerModal
        open={timerModalOpen}
        onClose={() => setTimerModalOpen(false)}
        timer={timerController}
        stats={state.focusStats}
      />

      {/* Indicador Offline Discreto (aparece apenas sem conexão) */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3.5 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 shadow-sm">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Modo Offline — Guia, Prática, Gerador e Notas disponíveis localmente</span>
        </div>
      )}
    </div>
  );
}
