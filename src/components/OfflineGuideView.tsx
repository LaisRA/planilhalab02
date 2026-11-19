import React, {useMemo, useState} from 'react';
import {Check, Copy, Search} from 'lucide-react';
import {EXCEL_ERRORS, KEYBOARD_SHORTCUTS, OFFLINE_FORMULAS} from '../data/offlineGuide';
import {FormulaLang, FormulaRef, ShortcutRef} from '../types';

interface OfflineGuideViewProps {
  formulaLang: FormulaLang;
}

const FORMULA_CATEGORIES: ('Todas' | FormulaRef['category'])[] = [
  'Todas',
  'Matemática',
  'Lógica',
  'Busca',
  'Texto',
  'Estatística',
  'Data',
  'Erro',
];

const SHORTCUT_CATEGORIES: ('Todos' | ShortcutRef['category'])[] = [
  'Todos',
  'Navegação',
  'Seleção',
  'Fórmulas',
  'Formatação',
];

export const OfflineGuideView: React.FC<OfflineGuideViewProps> = ({formulaLang}) => {
  const [tab, setTab] = useState<'formulas' | 'erros' | 'atalhos'>('formulas');
  const [query, setQuery] = useState('');
  const [formulaCat, setFormulaCat] = useState<'Todas' | FormulaRef['category']>('Todas');
  const [shortcutCat, setShortcutCat] = useState<'Todos' | ShortcutRef['category']>('Todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFormulas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OFFLINE_FORMULAS.filter((f) => {
      const catOk = formulaCat === 'Todas' || f.category === formulaCat;
      if (!catOk) return false;
      if (!q) return true;
      return (
        f.pt.toLowerCase().includes(q) ||
        f.en.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    });
  }, [query, formulaCat]);

  const filteredShortcuts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return KEYBOARD_SHORTCUTS.filter((s) => {
      const catOk = shortcutCat === 'Todos' || s.category === shortcutCat;
      if (!catOk) return false;
      if (!q) return true;
      return (
        s.action.toLowerCase().includes(q) ||
        s.win.toLowerCase().includes(q) ||
        s.mac.toLowerCase().includes(q)
      );
    });
  }, [query, shortcutCat]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Guia Rápido Offline
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Consulta instantânea sem internet: dicionário de fórmulas PT-BR ↔ EN, tabela de erros e atalhos essenciais.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 self-start">
          <button
            type="button"
            onClick={() => setTab('formulas')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'formulas'
                ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Fórmulas ({OFFLINE_FORMULAS.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('erros')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'erros'
                ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Erros ({EXCEL_ERRORS.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('atalhos')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'atalhos'
                ? 'bg-white dark:bg-[#111820] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Atalhos ({KEYBOARD_SHORTCUTS.length})
          </button>
        </div>
      </div>

      {/* Busca + Filtro por categoria */}
      {tab !== 'erros' && (
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === 'formulas'
                  ? 'Buscar fórmula em PT ou EN (ex.: PROCV, XLOOKUP, média)...'
                  : 'Buscar atalho (ex.: filtro, moeda, travar)...'
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(tab === 'formulas' ? FORMULA_CATEGORIES : SHORTCUT_CATEGORIES).map((cat) => {
              const active = tab === 'formulas' ? formulaCat === cat : shortcutCat === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (tab === 'formulas') setFormulaCat(cat as 'Todas' | FormulaRef['category']);
                    else setShortcutCat(cat as 'Todos' | ShortcutRef['category']);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    active
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conteúdo por aba */}
      {tab === 'formulas' && (
        filteredFormulas.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nenhuma fórmula encontrada para &ldquo;{query}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFormulaCat('Todas');
              }}
              className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFormulas.map((f) => {
              const primaryExample = formulaLang === 'pt' ? f.examplePt : f.exampleEn;
              const primarySyntax = formulaLang === 'pt' ? f.syntaxPt : f.syntaxEn;
              return (
                <article
                  key={f.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h2 className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                          {formulaLang === 'pt' ? f.pt : f.en}
                        </h2>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          ({formulaLang === 'pt' ? `EN: ${f.en}` : `PT: ${f.pt}`})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f.category}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleCopy(f.id, primaryExample)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      {copiedId === f.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === f.id ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{f.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Sintaxe: </span>
                      <code className="font-mono text-slate-900 dark:text-slate-100">{primarySyntax}</code>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Exemplo: </span>
                      <code className="font-mono text-emerald-700 dark:text-emerald-400">{primaryExample}</code>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 pt-1">Dica: {f.tip}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

      {tab === 'erros' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0E141B] text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Código (PT / EN)</th>
                  <th className="py-3 px-4 font-medium">Significado</th>
                  <th className="py-3 px-4 font-medium">Causa mais comum</th>
                  <th className="py-3 px-4 font-medium">Como corrigir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {EXCEL_ERRORS.map((err) => (
                  <tr key={err.codePt} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-semibold text-red-600 dark:text-red-400 whitespace-nowrap align-top">
                      {err.codePt}
                      {err.codeEn !== err.codePt && (
                        <span className="text-slate-400 font-normal"> / {err.codeEn}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 align-top">
                      {err.meaning}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed align-top">
                      {err.cause}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 leading-relaxed align-top">
                      {err.fix}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'atalhos' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111820] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0E141B] text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Categoria</th>
                  <th className="py-3 px-4 font-medium">Windows</th>
                  <th className="py-3 px-4 font-medium">macOS</th>
                  <th className="py-3 px-4 font-medium">Ação no Excel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredShortcuts.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{sc.category}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {sc.win}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {sc.mac}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{sc.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
