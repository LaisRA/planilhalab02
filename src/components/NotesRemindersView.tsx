import React, {useEffect, useMemo, useState} from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {LESSONS} from '../data/curriculum';
import {AppState, ReminderRecurrence, StudyNote, StudyReminder} from '../types';
import {getTodayISO} from '../utils/storage';

interface NotesRemindersViewProps {
  state: AppState;
  draftNoteLessonId: string | null;
  onClearDraftLesson: () => void;
  onSaveNote: (note: StudyNote) => void;
  onDeleteNote: (noteId: string) => void;
  onAddReminder: (reminder: StudyReminder) => void;
  onToggleReminder: (reminderId: string) => void;
  onDeleteReminder: (reminderId: string) => void;
}

const RECURRENCE_LABELS: Record<ReminderRecurrence, string> = {
  'uma-vez': 'Uma vez',
  diario: 'Diário',
  'dias-uteis': 'Dias úteis',
  semanal: 'Semanal',
};

export const NotesRemindersView: React.FC<NotesRemindersViewProps> = ({
  state,
  draftNoteLessonId,
  onClearDraftLesson,
  onSaveNote,
  onDeleteNote,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
}) => {
  // Notes state
  const [noteQuery, setNoteQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteLessonId, setNoteLessonId] = useState('');

  // Reminders state
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState(getTodayISO());
  const [remTime, setRemTime] = useState('19:00');
  const [remRecurrence, setRemRecurrence] = useState<ReminderRecurrence>('uma-vez');
  const [remLessonId, setRemLessonId] = useState('');
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // If user jumped here from a specific lesson's "Anotar" button
  useEffect(() => {
    if (draftNoteLessonId) {
      const lesson = LESSONS.find((l) => l.id === draftNoteLessonId);
      setEditingNoteId(null);
      setNoteLessonId(draftNoteLessonId);
      setNoteTitle(lesson ? `Notas: ${lesson.title}` : '');
      setNoteContent('');
      onClearDraftLesson();
    }
  }, [draftNoteLessonId, onClearDraftLesson]);

  const filteredNotes = useMemo(() => {
    const q = noteQuery.trim().toLowerCase();
    return [...state.notes]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((n) => {
        if (!q) return true;
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      });
  }, [state.notes, noteQuery]);

  const sortedReminders = useMemo(() => {
    return [...state.reminders].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
    });
  }, [state.reminders]);

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;
    const note: StudyNote = {
      id: editingNoteId || `note-${Date.now()}`,
      title: noteTitle.trim() || 'Anotação sem título',
      content: noteContent.trim(),
      lessonId: noteLessonId,
      updatedAt: new Date().toISOString(),
    };
    onSaveNote(note);
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteLessonId('');
  };

  const handleEditNote = (note: StudyNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteLessonId(note.lessonId);
  };

  const handleSubmitReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() || !remDate || !remTime) return;
    onAddReminder({
      id: `rem-${Date.now()}`,
      title: remTitle.trim(),
      date: remDate,
      time: remTime,
      recurrence: remRecurrence,
      lessonId: remLessonId,
      done: false,
    });
    setRemTitle('');
    setRemLessonId('');
  };

  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    } catch {
      setNotifPermission('denied');
    }
  };

  const lessonName = (id: string) => {
    if (!id) return 'Geral';
    const found = LESSONS.find((l) => l.id === id);
    return found ? `Aula ${found.order}: ${found.title}` : 'Geral';
  };

  const today = getTodayISO();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Caderno de Anotações & Lembretes de Estudo
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Registre suas descobertas sobre fórmulas e organize horários de revisão — tudo salvo localmente no seu dispositivo.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda (7 cols): Caderno de Anotações */}
        <section className="xl:col-span-7 space-y-5">
          {/* Formulário de Nova / Editar Anotação */}
          <form
            onSubmit={handleSubmitNote}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {editingNoteId ? 'Editar anotação' : 'Nova anotação de estudo'}
              </h2>
              {editingNoteId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNoteId(null);
                    setNoteTitle('');
                    setNoteContent('');
                    setNoteLessonId('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancelar edição
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Título da anotação (ex.: Regra do SOMASE)"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
              <select
                value={noteLessonId}
                onChange={(e) => setNoteLessonId(e.target.value)}
                aria-label="Vincular a uma aula"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              >
                <option value="">Anotação geral</option>
                {LESSONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    Aula {l.order} — {l.title}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Anote exemplos de fórmulas, atalhos, dúvidas ou passos de Power Query..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingNoteId ? 'Atualizar anotação' : 'Salvar anotação'}</span>
              </button>
            </div>
          </form>

          {/* Lista de Anotações Salvas */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Anotações salvas ({state.notes.length})
              </h3>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={noteQuery}
                  onChange={(e) => setNoteQuery(e.target.value)}
                  placeholder="Filtrar anotações..."
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F14] pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma anotação encontrada. Escreva sua primeira nota acima para consultar offline depois.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredNotes.map((note) => (
                  <li key={note.id} className="p-5 space-y-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {lessonName(note.lessonId)} · Atualizada em{' '}
                          {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditNote(note)}
                          className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Excluir anotação"
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {note.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Coluna Direita (5 cols): Lembretes de Estudo */}
        <section className="xl:col-span-5 space-y-5">
          <form
            onSubmit={handleSubmitReminder}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Novo lembrete de estudo</h2>
              {notifPermission === 'default' && (
                <button
                  type="button"
                  onClick={() => void handleRequestNotifications()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Ativar avisos do navegador</span>
                </button>
              )}
              {notifPermission === 'granted' && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <BellRing className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Avisos ativos</span>
                </span>
              )}
            </div>

            <input
              type="text"
              required
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              placeholder="Ex.: Revisar Tabela Dinâmica por 25 min"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rem-date" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Data
                </label>
                <input
                  id="rem-date"
                  type="date"
                  required
                  value={remDate}
                  onChange={(e) => setRemDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="rem-time" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Horário
                </label>
                <input
                  id="rem-time"
                  type="time"
                  required
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={remRecurrence}
                onChange={(e) => setRemRecurrence(e.target.value as ReminderRecurrence)}
                aria-label="Frequência do lembrete"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              >
                <option value="uma-vez">Uma vez</option>
                <option value="diario">Diário</option>
                <option value="dias-uteis">Dias úteis</option>
                <option value="semanal">Semanal</option>
              </select>

              <select
                value={remLessonId}
                onChange={(e) => setRemLessonId(e.target.value)}
                aria-label="Aula relacionada"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              >
                <option value="">Sem aula fixa</option>
                {LESSONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    Aula {l.order}: {l.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Salvar lembrete</span>
            </button>
          </form>

          {/* Lista de Lembretes */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Agenda de lembretes ({state.reminders.filter((r) => !r.done).length} ativos)
              </h3>
            </div>

            {sortedReminders.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhum lembrete agendado. Crie uma meta de estudo acima para manter constância.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {sortedReminders.map((rem) => {
                  const isToday = rem.date === today;
                  const isPast = rem.date < today && !rem.done;
                  return (
                    <li key={rem.id} className="px-5 py-3.5 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleReminder(rem.id)}
                        aria-label={rem.done ? 'Reabrir lembrete' : 'Concluir lembrete'}
                        className="mt-0.5 shrink-0"
                      >
                        {rem.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-emerald-600" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-medium leading-snug ${
                            rem.done
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {rem.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono tabular-nums">
                            {rem.date.split('-').reverse().join('/')} às {rem.time}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{RECURRENCE_LABELS[rem.recurrence]}</span>
                          {isPast && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-amber-700 dark:text-amber-400">Pendente</span>
                            </>
                          )}
                          {isToday && !rem.done && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">Hoje</span>
                            </>
                          )}
                        </div>
                        {rem.lessonId && (
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                            {lessonName(rem.lessonId)}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteReminder(rem.id)}
                        aria-label="Remover lembrete"
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
