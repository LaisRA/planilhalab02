import React, {useEffect, useMemo, useState} from 'react';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  NotebookPen,
  Play,
  Table2,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import {CURRICULUM_MODULES, LESSONS} from '../data/curriculum';
import {SPREADSHEET_EXERCISES} from '../data/exercises';
import {AppState, FormulaLang, Lesson, ModuleLevel} from '../types';

interface CurriculumViewProps {
  state: AppState;
  isOnline: boolean;
  formulaLang: FormulaLang;
  onToggleLesson: (lessonId: string) => void;
  onOpenExercise: (exerciseId: string) => void;
  onCreateNoteForLesson: (lesson: Lesson) => void;
}

const LEVEL_FILTERS: ('Todos' | ModuleLevel)[] = ['Todos', 'Básico', 'Intermediário', 'Análise', 'Avançado'];

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  state,
  isOnline,
  formulaLang,
  onToggleLesson,
  onOpenExercise,
  onCreateNoteForLesson,
}) => {
  const [levelFilter, setLevelFilter] = useState<'Todos' | ModuleLevel>('Todos');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);
  const [loadedVideoId, setLoadedVideoId] = useState<string | null>(null);

  const filteredModules = useMemo(() => {
    if (levelFilter === 'Todos') return CURRICULUM_MODULES;
    return CURRICULUM_MODULES.filter((m) => m.level === levelFilter);
  }, [levelFilter]);

  const selectedLesson = useMemo(() => {
    return LESSONS.find((l) => l.id === selectedLessonId) || LESSONS[0];
  }, [selectedLessonId]);

  // Reset active video iframe when switching lessons to free memory and save battery
  useEffect(() => {
    setLoadedVideoId(null);
  }, [selectedLessonId]);

  const totalLessons = LESSONS.length;
  const completedLessonsCount = state.completedLessons.length;
  const completedExercisesCount = Object.keys(state.completedExercises).length;
  const pendingRemindersCount = state.reminders.filter((r) => !r.done).length;
  const overallPercent = Math.round(
    ((completedLessonsCount + completedExercisesCount) / (totalLessons + SPREADSHEET_EXERCISES.length)) * 100
  );

  const isCompleted = state.completedLessons.includes(selectedLesson.id);
  const lessonNotesCount = state.notes.filter((n) => n.lessonId === selectedLesson.id).length;

  return (
    <div className="space-y-6">
      {/* Resumo compacto de progresso (disciplina tabular sem caixas aninhadas) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Trilha de Excel — Do Básico ao Avançado
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Aulas gratuitas avulsas do YouTube (sem playlists) acompanhadas de resumos completos para estudo offline.
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="font-mono text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {overallPercent}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Progresso salvo localmente</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {completedLessonsCount}/{totalLessons}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Aulas concluídas</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {completedExercisesCount}/{SPREADSHEET_EXERCISES.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Exercícios na planilha</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {state.focusStats.todayMinutes} min
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Foco registrado hoje</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {pendingRemindersCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Lembretes pendentes</div>
          </div>
        </div>
      </section>

      {/* Filtro segmentado por nível */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
          {LEVEL_FILTERS.map((lvl) => {
            const active = levelFilter === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setLevelFilter(lvl);
                  if (lvl !== 'Todos') {
                    const firstInLevel = LESSONS.find((l) => l.level === lvl);
                    if (firstInLevel) setSelectedLessonId(firstInLevel.id);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Vídeos carregados somente ao clicar para poupar bateria e dados móveis.
        </div>
      </div>

      {/* Área principal 2 colunas: Lista da Trilha + Detalhe da Aula */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista de módulos e aulas */}
        <aside className="lg:col-span-5 space-y-5">
          {filteredModules.map((mod) => {
            const modLessons = LESSONS.filter((l) => l.moduleId === mod.id);
            const doneInMod = modLessons.filter((l) => state.completedLessons.includes(l.id)).length;
            return (
              <div
                key={mod.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] overflow-hidden"
              >
                <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{mod.title}</h2>
                    <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                      {doneInMod}/{modLessons.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{mod.description}</p>
                </div>

                <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {modLessons.map((lesson) => {
                    const active = lesson.id === selectedLesson.id;
                    const done = state.completedLessons.includes(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors duration-150 ${
                            active
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/35'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm font-medium leading-snug ${
                                active
                                  ? 'text-emerald-900 dark:text-emerald-200'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {lesson.order}. {lesson.title}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span>{lesson.channel}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{lesson.duration}</span>
                              {lesson.linkedExerciseId && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-700 dark:text-emerald-400">Com prática</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </aside>

        {/* Leitor da Aula Selecionada */}
        <article className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-6 space-y-6">
          {/* Cabeçalho da Aula */}
          <div className="space-y-2 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Aula {selectedLesson.order}</span>
              <span aria-hidden="true">·</span>
              <span>Nível {selectedLesson.level}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedLesson.channel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedLesson.duration}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedLesson.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedLesson.subtitle}</p>
          </div>

          {/* Player YouTube Avulso Sob Demanda (sem playlists, baixo consumo) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Videoaula Gratuita (Vídeo Avulso)</h3>
              <a
                href={`https://www.youtube.com/watch?v=${selectedLesson.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
              >
                <span>Abrir vídeo no YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {!isOnline ? (
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-5 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Você está no modo offline</div>
                  <p className="text-xs mt-1 text-amber-800 dark:text-amber-300/90">
                    O vídeo do YouTube requer conexão, mas o resumo estruturado, as sintaxes PT-BR/EN e o exercício prático abaixo continuam 100% disponíveis sem internet.
                  </p>
                </div>
              </div>
            ) : loadedVideoId === selectedLesson.videoId ? (
              <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-black">
                <iframe
                  title={selectedLesson.videoTitle}
                  src={`https://www.youtube-nocookie.com/embed/${selectedLesson.videoId}?rel=0&modestbranding=1&autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedLesson.videoTitle}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Canal: {selectedLesson.channel} · Duração: {selectedLesson.duration} · Vídeo único (sem playlist)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLoadedVideoId(selectedLesson.videoId)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors duration-150 whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Carregar vídeo agora</span>
                </button>
              </div>
            )}
          </div>

          {/* Resumo Completo Offline */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Guia de Estudo Offline</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedLesson.summary}</p>

            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
              {selectedLesson.keyPoints.map((pt, idx) => (
                <li key={idx} className="leading-relaxed">
                  {pt}
                </li>
              ))}
            </ul>
          </div>

          {/* Sintaxes da Aula */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Sintaxes Essenciais ({formulaLang === 'pt' ? 'Português' : 'Inglês'})
            </h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800">
              {selectedLesson.syntaxes.map((syn, idx) => (
                <div key={idx} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <code className="font-mono text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    {formulaLang === 'pt' ? syn.pt : syn.en}
                  </code>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{syn.meaning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Armadilha Comum */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Atenção na prática: </span>
              {selectedLesson.pitfall}
            </div>
          </div>

          {/* Barra de ações da aula */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleLesson(selectedLesson.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
                isCompleted
                  ? 'border border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Aula concluída' : 'Marcar como concluída'}</span>
            </button>

            {selectedLesson.linkedExerciseId && (
              <button
                type="button"
                onClick={() => onOpenExercise(selectedLesson.linkedExerciseId!)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap"
              >
                <Table2 className="w-4 h-4" />
                <span>Praticar na Mini Planilha</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onCreateNoteForLesson(selectedLesson)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap"
            >
              <NotebookPen className="w-4 h-4" />
              <span>Anotar ({lessonNotesCount})</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};
