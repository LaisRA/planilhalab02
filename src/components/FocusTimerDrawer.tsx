import React, {useState} from 'react';
import {Pause, Play, RotateCcw, Volume2, VolumeX, X} from 'lucide-react';
import {FocusStats} from '../types';

export interface FocusTimerController {
  mode: 'foco' | 'pausa';
  presetMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  soundEnabled: boolean;
  setPreset: (mode: 'foco' | 'pausa', minutes: number) => void;
  toggleRun: () => void;
  reset: () => void;
  toggleSound: () => void;
}

interface FocusTimerModalProps {
  open: boolean;
  onClose: () => void;
  timer: FocusTimerController;
  stats: FocusStats;
}

export function formatTimerMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({open, onClose, timer, stats}) => {
  const [customMin, setCustomMin] = useState('25');

  if (!open) return null;

  const presets: {label: string; mode: 'foco' | 'pausa'; minutes: number}[] = [
    {label: 'Pomodoro 25m', mode: 'foco', minutes: 25},
    {label: 'Imersão 50m', mode: 'foco', minutes: 50},
    {label: 'Pausa 5m', mode: 'pausa', minutes: 5},
    {label: 'Pausa 10m', mode: 'pausa', minutes: 10},
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customMin, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 180) {
      timer.setPreset('foco', parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Timer de Foco nos Estudos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {timer.mode === 'foco' ? 'Sessão de foco ativo' : 'Intervalo de descanso'} · Baixo consumo de bateria
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar timer"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display principal */}
        <div className="py-7 text-center">
          <div className="font-mono text-5xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
            {formatTimerMMSS(timer.remainingSeconds)}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {timer.isRunning ? 'Em andamento — você pode fechar esta janela e continuar estudando' : 'Pausado'}
          </p>
        </div>

        {/* Controles principais */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={timer.toggleRun}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors duration-150 whitespace-nowrap"
          >
            {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{timer.isRunning ? 'Pausar' : 'Iniciar'}</span>
          </button>
          <button
            type="button"
            onClick={timer.reset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar</span>
          </button>
          <button
            type="button"
            onClick={timer.toggleSound}
            title={timer.soundEnabled ? 'Desativar som ao finalizar' : 'Ativar som ao finalizar'}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
          >
            {timer.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Presets */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2.5">Ciclos rápidos</p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => {
              const active = timer.mode === p.mode && timer.presetMinutes === p.minutes;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => timer.setPreset(p.mode, p.minutes)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium text-left transition-colors duration-150 border ${
                    active
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleApplyCustom} className="mt-3 flex items-center gap-2">
            <label htmlFor="custom-min" className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Tempo livre (min):
            </label>
            <input
              id="custom-min"
              type="number"
              min={1}
              max={180}
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F14] px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Aplicar
            </button>
          </form>
        </div>

        {/* Estatísticas locais */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {stats.todayMinutes} min
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Foco hoje</div>
          </div>
          <div>
            <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {stats.totalMinutes} min
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total acumulado</div>
          </div>
          <div>
            <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {stats.completedSessions}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Sessões</div>
          </div>
        </div>
      </div>
    </div>
  );
};
