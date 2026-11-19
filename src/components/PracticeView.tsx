import React, {useEffect, useMemo, useState} from 'react';
import {
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {QUICK_QUIZZES, SPREADSHEET_EXERCISES} from '../data/exercises';
import {AppState, CellData, FormulaLang} from '../types';
import {evaluateSheet, formatCellDisplay, isExcelError} from '../utils/formulaEngine';

interface PracticeViewProps {
  state: AppState;
  formulaLang: FormulaLang;
  initialExerciseId: string | null;
  onExerciseSolved: (exerciseId: string, formulaUsed: string) => void;
  onQuizSolved: (quizId: string) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  state,
  formulaLang,
  initialExerciseId,
  onExerciseSolved,
  onQuizSolved,
}) => {
  const [subTab, setSubTab] = useState<'planilha' | 'quiz'>('planilha');
  const [activeExId, setActiveExId] = useState<string>(initialExerciseId || SPREADSHEET_EXERCISES[0].id);

  useEffect(() => {
    if (initialExerciseId) {
      setSubTab('planilha');
      setActiveExId(initialExerciseId);
    }
  }, [initialExerciseId]);

  const exercise = useMemo(
    () => SPREADSHEET_EXERCISES.find((e) => e.id === activeExId) || SPREADSHEET_EXERCISES[0],
    [activeExId]
  );

  // Local editable cell state for the active exercise
  const [sheetCells, setSheetCells] = useState<Record<string, CellData>>(() => {
    const base = structuredClone(exercise.cells);
    const savedFormula = state.completedExercises[exercise.id];
    if (savedFormula && base[exercise.targetCell]) {
      base[exercise.targetCell] = {...base[exercise.targetCell], raw: savedFormula};
    }
    return base;
  });

  const [selectedCell, setSelectedCell] = useState<string>(exercise.targetCell);
  const [formulaInput, setFormulaInput] = useState<string>('');
  const [hintStep, setHintStep] = useState<number>(0);
  const [feedback, setFeedback] = useState<{status: 'idle' | 'pass' | 'fail'; message: string}>({
    status: 'idle',
    message: '',
  });

  // Sync sheet when active exercise changes
  useEffect(() => {
    const base = structuredClone(exercise.cells);
    const savedFormula = state.completedExercises[exercise.id];
    if (savedFormula && base[exercise.targetCell]) {
      base[exercise.targetCell] = {...base[exercise.targetCell], raw: savedFormula};
    }
    setSheetCells(base);
    setSelectedCell(exercise.targetCell);
    setFormulaInput(base[exercise.targetCell]?.raw || '');
    setHintStep(0);
    setFeedback({status: 'idle', message: ''});
  }, [exercise, state.completedExercises]);

  const evaluated = useMemo(() => evaluateSheet(sheetCells), [sheetCells]);

  const handleSelectCell = (ref: string) => {
    setSelectedCell(ref);
    setFormulaInput(sheetCells[ref]?.raw || '');
  };

  const commitCellValue = (ref: string, rawValue: string) => {
    const cell = sheetCells[ref];
    if (!cell?.editable) return;
    setSheetCells((prev) => ({
      ...prev,
      [ref]: {...prev[ref], raw: rawValue},
    }));
    setFeedback({status: 'idle', message: ''});
  };

  const handleFormulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitCellValue(selectedCell, formulaInput);
      // If user hit Enter on target cell, validate immediately
      if (selectedCell === exercise.targetCell) {
        validateExercise(formulaInput);
      }
    } else if (e.key === 'Escape') {
      setFormulaInput(sheetCells[selectedCell]?.raw || '');
    }
  };

  const validateExercise = (overrideFormula?: string) => {
    const targetRaw = (overrideFormula ?? sheetCells[exercise.targetCell]?.raw ?? '').trim();
    const updatedCells = {
      ...sheetCells,
      [exercise.targetCell]: {...sheetCells[exercise.targetCell], raw: targetRaw},
    };
    const evalMap = evaluateSheet(updatedCells);
    const result = evalMap[exercise.targetCell];

    if (!targetRaw.startsWith('=')) {
      setFeedback({
        status: 'fail',
        message: 'Digite uma fórmula começando com "=" em vez de digitar o resultado manualmente.',
      });
      return;
    }

    if (result?.error || isExcelError(result?.value)) {
      setFeedback({
        status: 'fail',
        message: `A fórmula retornou erro (${result?.value}). Revise parênteses, separadores (";" ou ",") e aspas em textos.`,
      });
      return;
    }

    // Check required tokens (accept either PT or EN syntax seamlessly!)
    const upperNormalized = targetRaw
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const matchesPt = exercise.requiredFormulaTokensPt.every((tok) =>
      upperNormalized.includes(tok.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );
    const matchesEn = exercise.requiredFormulaTokensEn.every((tok) =>
      upperNormalized.includes(tok.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );

    if (!matchesPt && !matchesEn) {
      const expectedFn = formulaLang === 'pt' ? exercise.requiredFormulaTokensPt[0] : exercise.requiredFormulaTokensEn[0];
      setFeedback({
        status: 'fail',
        message: `O resultado foi calculado, mas este desafio pede o uso de ${expectedFn} com as referências corretas.`,
      });
      return;
    }

    // Compare evaluated result
    let valueMatches = false;
    if (typeof exercise.expectedValue === 'number') {
      const tol = exercise.tolerance ?? 0.01;
      valueMatches = typeof result.value === 'number' && Math.abs(result.value - exercise.expectedValue) <= tol;
    } else {
      valueMatches = String(result.value).trim().toLowerCase() === exercise.expectedValue.trim().toLowerCase();
    }

    if (valueMatches) {
      setFeedback({
        status: 'pass',
        message: `Correto! ${exercise.explanation}`,
      });
      onExerciseSolved(exercise.id, targetRaw);
    } else {
      setFeedback({
        status: 'fail',
        message: `Resultado obtido: "${formatCellDisplay(result.value, exercise.cells[exercise.targetCell]?.format)}". Ainda não bate com o valor esperado para este cenário.`,
      });
    }
  };

  const handleResetSheet = () => {
    const clean = structuredClone(exercise.cells);
    setSheetCells(clean);
    setSelectedCell(exercise.targetCell);
    setFormulaInput('');
    setFeedback({status: 'idle', message: ''});
  };

  const handleFillSolution = () => {
    const sol = formulaLang === 'pt' ? exercise.exampleSolutionPt : exercise.exampleSolutionEn;
    setSelectedCell(exercise.targetCell);
    setFormulaInput(sol);
    commitCellValue(exercise.targetCell, sol);
  };

  const currentIdx = SPREADSHEET_EXERCISES.findIndex((e) => e.id === exercise.id);
  const nextExercise = SPREADSHEET_EXERCISES[(currentIdx + 1) % SPREADSHEET_EXERCISES.length];

  // Quick Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  return (
    <div className="space-y-6">
      {/* Cabeçalho + Seletor de modo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Laboratório de Prática
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Escreva fórmulas reais em PT-BR ou Inglês na mini planilha ou teste cenários rápidos de análise.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 self-start">
          <button
            type="button"
            onClick={() => setSubTab('planilha')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
              subTab === 'planilha'
                ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Mini Planilha ({Object.keys(state.completedExercises).length}/{SPREADSHEET_EXERCISES.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('quiz')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
              subTab === 'quiz'
                ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Desafios Rápidos ({state.completedQuizzes.length}/{QUICK_QUIZZES.length})
          </button>
        </div>
      </div>

      {subTab === 'planilha' ? (
        <div className="space-y-5">
          {/* Seletor horizontal de exercícios */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SPREADSHEET_EXERCISES.map((ex) => {
              const active = ex.id === exercise.id;
              const solved = Boolean(state.completedExercises[ex.id]);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setActiveExId(ex.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {solved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  <span className="font-mono">{String(ex.order).padStart(2, '0')}.</span>
                  <span>{ex.title}</span>
                </button>
              );
            })}
          </div>

          {/* Two-Zone Sandbox Layout (65% Planilha / 35% Desafio) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Zona Esquerda: Mini Planilha Interativa */}
            <div className="xl:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] overflow-hidden">
              {/* Barra de Fórmulas (fx) */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E141B]">
                <div className="w-14 text-center font-mono text-xs font-semibold py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111820] text-slate-800 dark:text-slate-200 shrink-0">
                  {selectedCell}
                </div>
                <span className="font-mono text-xs font-semibold italic text-slate-400 px-1 shrink-0">fx</span>
                <input
                  type="text"
                  value={formulaInput}
                  disabled={!sheetCells[selectedCell]?.editable}
                  onChange={(e) => {
                    setFormulaInput(e.target.value);
                    commitCellValue(selectedCell, e.target.value);
                  }}
                  onKeyDown={handleFormulaKeyDown}
                  placeholder={
                    sheetCells[selectedCell]?.editable
                      ? `Digite sua fórmula aqui (ex.: ${formulaLang === 'pt' ? exercise.exampleSolutionPt : exercise.exampleSolutionEn})`
                      : 'Célula de referência (selecione a célula destacada em verde para editar)'
                  }
                  className="flex-1 min-w-0 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 disabled:opacity-65 disabled:cursor-not-allowed"
                />
              </div>

              {/* Grade da Planilha */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-[#0E141B] text-slate-500 dark:text-slate-400">
                      <th className="w-10 border-b border-r border-slate-200 dark:border-slate-800 py-2 text-center font-mono text-xs font-medium">
                        #
                      </th>
                      {exercise.cols.map((col) => (
                        <th
                          key={col}
                          className="border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800 py-2 px-3 text-center font-mono text-xs font-medium min-w-[110px]"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length: exercise.rows}, (_, rIdx) => {
                      const rowNum = rIdx + 1;
                      return (
                        <tr key={rowNum}>
                          <td className="border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E141B] py-2 text-center font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {rowNum}
                          </td>
                          {exercise.cols.map((col) => {
                            const ref = `${col}${rowNum}`;
                            const cell = sheetCells[ref];
                            const evalCell = evaluated[ref];
                            const isSelected = selectedCell === ref;
                            const isTarget = exercise.targetCell === ref;
                            const displayVal = evalCell ? formatCellDisplay(evalCell.value, cell?.format) : '';
                            const hasErr = evalCell && (evalCell.error || isExcelError(evalCell.value));

                            return (
                              <td
                                key={ref}
                                onClick={() => handleSelectCell(ref)}
                                className={`border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800 px-3 py-2 cursor-pointer transition-colors duration-100 ${
                                  cell?.isHeader
                                    ? 'bg-slate-50/90 dark:bg-slate-800/40 font-semibold text-slate-800 dark:text-slate-200'
                                    : ''
                                } ${
                                  isTarget
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/35'
                                    : ''
                                } ${
                                  isSelected
                                    ? 'ring-2 ring-inset ring-emerald-600 dark:ring-emerald-400'
                                    : ''
                                } ${
                                  cell?.align === 'right' ? 'text-right font-mono tabular-nums text-xs' : 'text-left text-xs'
                                }`}
                              >
                                {hasErr ? (
                                  <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                                    {displayVal}
                                  </span>
                                ) : displayVal ? (
                                  <span className="text-slate-900 dark:text-slate-100">{displayVal}</span>
                                ) : isTarget ? (
                                  <span className="text-emerald-700/70 dark:text-emerald-400/70 italic font-mono">
                                    = fórmula...
                                  </span>
                                ) : (
                                  <span>&nbsp;</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Rodapé da Grade */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-[#0E141B] border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Célula alvo: <strong className="font-mono text-slate-800 dark:text-slate-200">{exercise.targetCell}</strong> · Aceita fórmulas em Português (<code className="font-mono">;</code>) ou Inglês (<code className="font-mono">,</code>)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSheet}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => validateExercise()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verificar Fórmula</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Zona Direita: Instruções, Dicas e Validação */}
            <aside className="xl:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-5 space-y-5">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Exercício {exercise.order} de {SPREADSHEET_EXERCISES.length} · Nível {exercise.level}
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{exercise.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{exercise.scenario}</p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Sua missão</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {formulaLang === 'pt' ? exercise.instructionPt : exercise.instructionEn}
                </p>
              </div>

              {/* Feedback de Validação (duplamente codificado: ícone + cor + texto) */}
              {feedback.status !== 'idle' && (
                <div
                  className={`rounded-lg border p-3.5 text-xs leading-relaxed flex items-start gap-2.5 ${
                    feedback.status === 'pass'
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : 'border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/35 text-red-900 dark:text-red-200'
                  }`}
                >
                  {feedback.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Dicas progressivas */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setHintStep((s) => Math.min(exercise.hints.length, s + 1))}
                    disabled={hintStep >= exercise.hints.length}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>
                      {hintStep === 0
                        ? 'Ver dica passo a passo'
                        : hintStep < exercise.hints.length
                        ? `Próxima dica (${hintStep}/${exercise.hints.length})`
                        : 'Todas as dicas exibidas'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFillSolution}
                    className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
                  >
                    Preencher exemplo
                  </button>
                </div>

                {hintStep > 0 && (
                  <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside bg-slate-50 dark:bg-[#0B0F14] rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                    {exercise.hints.slice(0, hintStep).map((h, i) => (
                      <li key={i} className="leading-relaxed">
                        {h}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Próximo exercício */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {state.completedExercises[exercise.id] ? 'Concluído e salvo' : 'Pendente'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveExId(nextExercise.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
                >
                  <span>Próximo: {nextExercise.title}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        /* Desafios Rápidos (Quiz de Cenários Reais) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {QUICK_QUIZZES.map((q, idx) => {
            const chosen = quizAnswers[q.id];
            const isAnswered = chosen !== undefined;
            const isCorrect = chosen === q.correctIndex;
            const alreadySaved = state.completedQuizzes.includes(q.id);

            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Desafio {idx + 1} · {q.level} · {q.topic}
                    </span>
                    {alreadySaved && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolvido
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {q.question}
                  </h3>

                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const selected = chosen === oIdx;
                      const showRight = isAnswered && oIdx === q.correctIndex;
                      const showWrong = isAnswered && selected && !isCorrect;

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            setQuizAnswers((prev) => ({...prev, [q.id]: oIdx}));
                            if (oIdx === q.correctIndex) {
                              onQuizSolved(q.id);
                            }
                          }}
                          className={`w-full text-left rounded-lg border px-3.5 py-2.5 text-xs transition-colors duration-150 ${
                            showRight
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100 font-medium'
                              : showWrong
                              ? 'border-red-500 bg-red-50 text-red-950 dark:border-red-600 dark:bg-red-950/40 dark:text-red-100'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isAnswered && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" />
                    <span>
                      <strong className="text-slate-900 dark:text-slate-100">
                        {isCorrect ? 'Correto: ' : 'Explicação: '}
                      </strong>
                      {q.explanation}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
