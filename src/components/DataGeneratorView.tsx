import React, {useMemo, useState} from 'react';
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DATA_SCENARIOS,
  datasetToTSV,
  downloadDatasetCSV,
  downloadDatasetXLSX,
  generateDataset,
  ScenarioId,
} from '../utils/dummyDataGenerator';

const ROW_COUNTS = [15, 50, 100, 250, 500];

export const DataGeneratorView: React.FC = () => {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('vendas');
  const [rowCount, setRowCount] = useState<number>(50);
  const [dirtyMode, setDirtyMode] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(20261119);
  const [copied, setCopied] = useState<boolean>(false);
  const [exportingXlsx, setExportingXlsx] = useState<boolean>(false);

  const dataset = useMemo(
    () => generateDataset(scenarioId, rowCount, dirtyMode, seed),
    [scenarioId, rowCount, dirtyMode, seed]
  );

  const previewRows = useMemo(() => dataset.rows.slice(0, 20), [dataset.rows]);

  const handleCopyTSV = async () => {
    const tsv = datasetToTSV(dataset);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = tsv;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadXlsx = async () => {
    setExportingXlsx(true);
    try {
      await downloadDatasetXLSX(dataset);
    } finally {
      setExportingXlsx(false);
    }
  };

  const formatPreviewVal = (col: string, val: string | number) => {
    if (val === '') return '— (vazio)';
    if (typeof val === 'number') {
      if (col.includes('Receita') || col.includes('Salario') || col.includes('Bonus') || col.includes('Valor') || col.includes('Preco') || col.includes('Custo')) {
        return val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
      }
      if (col.includes('Pct')) {
        return `${val}%`;
      }
      return val.toLocaleString('pt-BR', {maximumFractionDigits: 2});
    }
    return val;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Gerador de Dados Fictícios & Cenários Realistas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Gere massas de dados corporativas 100% offline para testar fórmulas, Tabelas Dinâmicas, Power Query e Dashboards no Excel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 97)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111820] px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Gerar nova amostra</span>
        </button>
      </div>

      {/* Seletor de Cenários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {DATA_SCENARIOS.map((sc) => {
          const active = sc.id === scenarioId;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setScenarioId(sc.id)}
              className={`text-left rounded-xl border p-4 transition-colors duration-150 ${
                active
                  ? 'border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/35'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div
                className={`text-sm font-semibold leading-snug ${
                  active ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {sc.name}
              </div>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{sc.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Controles de Geração e Botões de Exportação */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-5">
            {/* Volume de linhas */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Volume de registros</div>
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                {ROW_COUNTS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setRowCount(cnt)}
                    className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-md transition-colors ${
                      rowCount === cnt
                        ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Opção de sujeira realista */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-4 sm:pt-0">
              <input
                type="checkbox"
                checked={dirtyMode}
                onChange={(e) => setDirtyMode(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <div>
                <div className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Injetar inconsistências realistas</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Adiciona espaços extras, células vazias e linhas duplicadas para treinar limpeza e Power Query.
                </div>
              </div>
            </label>
          </div>

          {/* Exportações */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleCopyTSV()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors duration-150 whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado! Cole no Excel (Ctrl+V)' : 'Copiar para Excel'}</span>
            </button>
            <button
              type="button"
              onClick={() => downloadDatasetCSV(dataset)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadXlsx()}
              disabled={exportingXlsx}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap disabled:opacity-60"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exportingXlsx ? 'Gerando...' : 'Baixar .XLSX'}</span>
            </button>
          </div>
        </div>

        {/* Missões sugeridas de análise */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Missões sugeridas para praticar com esta base (também incluídas na 2ª aba do arquivo .XLSX):
          </h2>
          <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
            {dataset.scenario.missions.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tabela de Prévia */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Prévia dos dados — {dataset.scenario.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Exibindo {previewRows.length} de {dataset.rows.length} linhas · {dataset.scenario.columns.length} colunas
            {dataset.dirtyInjected ? ' · Com inconsistências' : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0E141B] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 text-right font-mono font-medium w-10">#</th>
                {dataset.scenario.columns.map((col) => {
                  const isNum = dataset.scenario.numericColumns.includes(col);
                  return (
                    <th
                      key={col}
                      className={`py-2.5 px-3 font-mono font-medium whitespace-nowrap ${
                        isNum ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {previewRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/35">
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-400">{idx + 1}</td>
                  {dataset.scenario.columns.map((col) => {
                    const raw = row[col];
                    const isNum = dataset.scenario.numericColumns.includes(col);
                    const isEmpty = raw === '';
                    const hasExtraSpaces = typeof raw === 'string' && raw !== raw.trim();
                    return (
                      <td
                        key={col}
                        className={`py-2 px-3 whitespace-nowrap ${
                          isNum ? 'text-right font-mono tabular-nums' : 'text-left'
                        } ${
                          isEmpty
                            ? 'text-amber-700 dark:text-amber-400 italic'
                            : hasExtraSpaces
                            ? 'text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/25 font-mono'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {formatPreviewVal(col, raw)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
