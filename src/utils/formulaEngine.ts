import {CellData} from '../types';

export type EvalValue = number | string | boolean;

export interface EvaluatedCell {
  raw: string;
  value: EvalValue;
  error?: string;
}

const EXCEL_ERRORS = new Set(['#DIV/0!', '#N/D', '#VALOR!', '#NOME?', '#REF!', '#ERRO!']);

export function isExcelError(v: unknown): boolean {
  return typeof v === 'string' && EXCEL_ERRORS.has(v);
}

function colLettersToIndex(letters: string): number {
  let idx = 0;
  const upper = letters.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    idx = idx * 26 + (upper.charCodeAt(i) - 64);
  }
  return idx;
}

function indexToColLetters(idx: number): string {
  let s = '';
  let n = idx;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function normalizeCellRef(ref: string): string {
  return ref.replace(/\$/g, '').toUpperCase().trim();
}

function parseCellCoords(ref: string): {col: number; row: number} | null {
  const m = normalizeCellRef(ref).match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return {col: colLettersToIndex(m[1]), row: parseInt(m[2], 10)};
}

function expandRange(rangeStr: string): string[][] {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return [];
  const start = parseCellCoords(parts[0]);
  const end = parseCellCoords(parts[1]);
  if (!start || !end) return [];
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const grid: string[][] = [];
  for (let r = minRow; r <= maxRow; r++) {
    const rowRefs: string[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      rowRefs.push(`${indexToColLetters(c)}${r}`);
    }
    grid.push(rowRefs);
  }
  return grid;
}

function splitTopLevelArgs(argStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  // Detect whether semicolon is used at top level; if so, split by ';', otherwise by ','
  let hasTopSemicolon = false;
  for (let i = 0; i < argStr.length; i++) {
    const ch = argStr[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ';' && depth === 0) hasTopSemicolon = true;
    }
  }
  const sep = hasTopSemicolon ? ';' : ',';
  depth = 0;
  inQuotes = false;
  for (let i = 0; i < argStr.length; i++) {
    const ch = argStr[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (!inQuotes && ch === '(') {
      depth++;
      current += ch;
    } else if (!inQuotes && ch === ')') {
      depth--;
      current += ch;
    } else if (!inQuotes && depth === 0 && ch === sep) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0 || args.length > 0) {
    args.push(current.trim());
  }
  return args;
}

function normalizeFuncName(name: string): string {
  const clean = name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const map: Record<string, string> = {
    SOMA: 'SUM',
    SUM: 'SUM',
    MEDIA: 'AVERAGE',
    AVERAGE: 'AVERAGE',
    MAXIMO: 'MAX',
    MAX: 'MAX',
    MINIMO: 'MIN',
    MIN: 'MIN',
    'CONT.NUM': 'COUNT',
    COUNT: 'COUNT',
    'CONT.VALORES': 'COUNTA',
    COUNTA: 'COUNTA',
    SE: 'IF',
    IF: 'IF',
    E: 'AND',
    AND: 'AND',
    OU: 'OR',
    OR: 'OR',
    SOMASE: 'SUMIF',
    SUMIF: 'SUMIF',
    'CONT.SE': 'COUNTIF',
    COUNTIF: 'COUNTIF',
    PROCV: 'VLOOKUP',
    VLOOKUP: 'VLOOKUP',
    PROCX: 'XLOOKUP',
    XLOOKUP: 'XLOOKUP',
    INDICE: 'INDEX',
    INDEX: 'INDEX',
    CORRESP: 'MATCH',
    MATCH: 'MATCH',
    SEERRO: 'IFERROR',
    IFERROR: 'IFERROR',
    ESQUERDA: 'LEFT',
    LEFT: 'LEFT',
    DIREITA: 'RIGHT',
    RIGHT: 'RIGHT',
    ARRUMAR: 'TRIM',
    TRIM: 'TRIM',
    CONCAT: 'CONCAT',
    CONCATENAR: 'CONCAT',
    CONCATENATE: 'CONCAT',
    ARRED: 'ROUND',
    ROUND: 'ROUND',
  };
  return map[clean] || clean;
}

function toNumber(v: EvalValue): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const trimmed = v.trim();
  if (trimmed === '') return 0;
  // Support Brazilian decimal comma when simple number like "0,1"
  const normalized = trimmed.includes(',') && !trimmed.includes('.') ? trimmed.replace(',', '.') : trimmed;
  if (normalized.endsWith('%')) {
    const n = Number(normalized.slice(0, -1));
    return Number.isNaN(n) ? NaN : n / 100;
  }
  const n = Number(normalized);
  return Number.isNaN(n) ? NaN : n;
}

function matchesCriteria(cellVal: EvalValue, criteriaRaw: EvalValue): boolean {
  if (typeof criteriaRaw === 'number') {
    return typeof cellVal === 'number' && Math.abs(cellVal - criteriaRaw) < 1e-9;
  }
  const crit = String(criteriaRaw).trim();
  const opMatch = crit.match(/^(>=|<=|<>|>|<|=)(.*)$/);
  if (opMatch) {
    const op = opMatch[1];
    const rhsStr = opMatch[2].trim();
    const rhsNum = toNumber(rhsStr);
    const lhsNum = toNumber(cellVal);
    if (!Number.isNaN(rhsNum) && !Number.isNaN(lhsNum)) {
      if (op === '>=') return lhsNum >= rhsNum;
      if (op === '<=') return lhsNum <= rhsNum;
      if (op === '>') return lhsNum > rhsNum;
      if (op === '<') return lhsNum < rhsNum;
      if (op === '<>') return Math.abs(lhsNum - rhsNum) > 1e-9;
      if (op === '=') return Math.abs(lhsNum - rhsNum) < 1e-9;
    }
    const a = String(cellVal).toLowerCase();
    const b = rhsStr.toLowerCase();
    if (op === '<>') return a !== b;
    if (op === '=') return a === b;
    return false;
  }
  return String(cellVal).trim().toLowerCase() === crit.toLowerCase();
}

export function evaluateSheet(cells: Record<string, CellData>): Record<string, EvaluatedCell> {
  const cache: Record<string, EvaluatedCell> = {};
  const visiting = new Set<string>();

  function evalCell(ref: string): EvaluatedCell {
    const key = normalizeCellRef(ref);
    if (cache[key]) return cache[key];
    const data = cells[key];
    if (!data || data.raw.trim() === '') {
      const empty: EvaluatedCell = {raw: '', value: ''};
      cache[key] = empty;
      return empty;
    }
    const raw = data.raw.trim();
    if (!raw.startsWith('=')) {
      const num = toNumber(raw);
      const isPureNum = /^[-+]?\d+([.,]\d+)?%?$/.test(raw);
      const val: EvalValue = isPureNum && !Number.isNaN(num) ? num : raw;
      const res: EvaluatedCell = {raw, value: val};
      cache[key] = res;
      return res;
    }

    if (visiting.has(key)) {
      return {raw, value: '#REF!', error: 'Referência circular detectada'};
    }
    visiting.add(key);
    try {
      const val = evalExpression(raw.slice(1).trim());
      const result: EvaluatedCell = isExcelError(val) ? {raw, value: val, error: String(val)} : {raw, value: val};
      cache[key] = result;
      return result;
    } catch {
      const errRes: EvaluatedCell = {raw, value: '#ERRO!', error: 'Sintaxe de fórmula inválida'};
      cache[key] = errRes;
      return errRes;
    } finally {
      visiting.delete(key);
    }
  }

  function getRangeMatrix(rangeExpr: string): EvalValue[][] {
    const clean = rangeExpr.trim();
    if (clean.includes(':')) {
      const refs = expandRange(clean);
      return refs.map((row) => row.map((r) => evalCell(r).value));
    }
    if (/^\$?[A-Za-z]+\$?\d+$/.test(clean)) {
      return [[evalCell(clean).value]];
    }
    return [[evalExpression(clean)]];
  }

  function getRangeFlat(rangeExpr: string): EvalValue[] {
    return getRangeMatrix(rangeExpr).flat();
  }

  function evalFunction(rawName: string, argStr: string): EvalValue {
    const fn = normalizeFuncName(rawName);
    const args = argStr.trim() === '' ? [] : splitTopLevelArgs(argStr);

    if (fn === 'IFERROR') {
      if (args.length < 2) return '#VALOR!';
      const primary = evalExpression(args[0]);
      if (isExcelError(primary)) {
        return evalExpression(args[1]);
      }
      return primary;
    }

    if (fn === 'IF') {
      if (args.length < 2) return '#VALOR!';
      const cond = evalExpression(args[0]);
      if (isExcelError(cond)) return cond;
      const truthy = typeof cond === 'boolean' ? cond : typeof cond === 'number' ? cond !== 0 : cond.toLowerCase() === 'verdadeiro' || cond.toLowerCase() === 'true';
      if (truthy) return evalExpression(args[1]);
      return args.length >= 3 ? evalExpression(args[2]) : false;
    }

    if (fn === 'AND' || fn === 'OR') {
      const bools = args.map((a) => {
        const v = evalExpression(a);
        return typeof v === 'boolean' ? v : Boolean(v);
      });
      return fn === 'AND' ? bools.every(Boolean) : bools.some(Boolean);
    }

    if (fn === 'SUM' || fn === 'AVERAGE' || fn === 'MAX' || fn === 'MIN' || fn === 'COUNT' || fn === 'COUNTA') {
      const vals = args.flatMap((a) => getRangeFlat(a));
      for (const v of vals) {
        if (isExcelError(v)) return v;
      }
      if (fn === 'COUNTA') {
        return vals.filter((v) => v !== '' && v !== null && v !== undefined).length;
      }
      const nums = vals.filter((v): v is number => typeof v === 'number');
      if (fn === 'COUNT') return nums.length;
      if (fn === 'SUM') return nums.reduce((acc, n) => acc + n, 0);
      if (nums.length === 0) return fn === 'AVERAGE' ? '#DIV/0!' : 0;
      if (fn === 'AVERAGE') return nums.reduce((acc, n) => acc + n, 0) / nums.length;
      if (fn === 'MAX') return Math.max(...nums);
      if (fn === 'MIN') return Math.min(...nums);
    }

    if (fn === 'SUMIF') {
      if (args.length < 2) return '#VALOR!';
      const critRange = getRangeFlat(args[0]);
      const criteria = evalExpression(args[1]);
      const sumRange = args.length >= 3 ? getRangeFlat(args[2]) : critRange;
      let total = 0;
      for (let i = 0; i < critRange.length; i++) {
        if (matchesCriteria(critRange[i], criteria)) {
          const v = sumRange[i];
          if (typeof v === 'number') total += v;
        }
      }
      return total;
    }

    if (fn === 'COUNTIF') {
      if (args.length < 2) return '#VALOR!';
      const range = getRangeFlat(args[0]);
      const criteria = evalExpression(args[1]);
      let count = 0;
      for (const v of range) {
        if (matchesCriteria(v, criteria)) count++;
      }
      return count;
    }

    if (fn === 'VLOOKUP') {
      if (args.length < 3) return '#VALOR!';
      const lookupVal = evalExpression(args[0]);
      if (isExcelError(lookupVal)) return lookupVal;
      const matrix = getRangeMatrix(args[1]);
      const colIdx = toNumber(evalExpression(args[2]));
      if (Number.isNaN(colIdx) || colIdx < 1) return '#VALOR!';
      if (matrix.length === 0 || colIdx > matrix[0].length) return '#REF!';
      for (const row of matrix) {
        if (String(row[0]).trim().toLowerCase() === String(lookupVal).trim().toLowerCase()) {
          return row[colIdx - 1];
        }
      }
      return '#N/D';
    }

    if (fn === 'XLOOKUP') {
      if (args.length < 3) return '#VALOR!';
      const lookupVal = evalExpression(args[0]);
      if (isExcelError(lookupVal)) return lookupVal;
      const lookupArr = getRangeFlat(args[1]);
      const returnArr = getRangeFlat(args[2]);
      for (let i = 0; i < lookupArr.length; i++) {
        if (String(lookupArr[i]).trim().toLowerCase() === String(lookupVal).trim().toLowerCase()) {
          return i < returnArr.length ? returnArr[i] : '#REF!';
        }
      }
      if (args.length >= 4) return evalExpression(args[3]);
      return '#N/D';
    }

    if (fn === 'MATCH') {
      if (args.length < 2) return '#VALOR!';
      const lookupVal = evalExpression(args[0]);
      const arr = getRangeFlat(args[1]);
      for (let i = 0; i < arr.length; i++) {
        if (String(arr[i]).trim().toLowerCase() === String(lookupVal).trim().toLowerCase()) {
          return i + 1;
        }
      }
      return '#N/D';
    }

    if (fn === 'INDEX') {
      if (args.length < 2) return '#VALOR!';
      const matrix = getRangeMatrix(args[0]);
      const rowNum = toNumber(evalExpression(args[1]));
      const colNum = args.length >= 3 ? toNumber(evalExpression(args[2])) : 1;
      if (Number.isNaN(rowNum) || Number.isNaN(colNum)) return '#VALOR!';
      if (rowNum < 1 || rowNum > matrix.length) return '#REF!';
      const row = matrix[rowNum - 1];
      if (colNum < 1 || colNum > row.length) return '#REF!';
      return row[colNum - 1];
    }

    if (fn === 'LEFT' || fn === 'RIGHT') {
      if (args.length < 1) return '#VALOR!';
      const text = String(evalExpression(args[0]));
      const count = args.length >= 2 ? toNumber(evalExpression(args[1])) : 1;
      if (Number.isNaN(count) || count < 0) return '#VALOR!';
      return fn === 'LEFT' ? text.slice(0, count) : text.slice(Math.max(0, text.length - count));
    }

    if (fn === 'TRIM') {
      if (args.length < 1) return '#VALOR!';
      return String(evalExpression(args[0])).trim().replace(/\s+/g, ' ');
    }

    if (fn === 'CONCAT') {
      return args
        .flatMap((a) => getRangeFlat(a))
        .map((v) => String(v))
        .join('');
    }

    if (fn === 'ROUND') {
      if (args.length < 2) return '#VALOR!';
      const num = toNumber(evalExpression(args[0]));
      const digits = toNumber(evalExpression(args[1]));
      if (Number.isNaN(num) || Number.isNaN(digits)) return '#VALOR!';
      const factor = Math.pow(10, digits);
      return Math.round(num * factor) / factor;
    }

    return '#NOME?';
  }

  function findTopLevelOperator(expr: string, ops: string[]): {index: number; op: string} | null {
    let depth = 0;
    let inQuotes = false;
    // Scan right-to-left for left-associative binary ops
    for (let i = expr.length - 1; i >= 0; i--) {
      const ch = expr[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (!inQuotes) {
        if (ch === ')') depth++;
        else if (ch === '(') depth--;
        else if (depth === 0) {
          for (const op of ops) {
            if (op.length === 2 && i >= 1 && expr.slice(i - 1, i + 1) === op) {
              return {index: i - 1, op};
            }
            if (op.length === 1 && ch === op) {
              // Avoid matching unary +/- or part of >=, <=, <>
              if (op === '+' || op === '-') {
                const prev = expr.slice(0, i).trim();
                if (prev === '' || /[+\-*/(&=<>]$/.test(prev)) continue;
              }
              if ((op === '=' || op === '>' || op === '<') && i > 0 && (expr[i - 1] === '>' || expr[i - 1] === '<')) {
                continue;
              }
              return {index: i, op};
            }
          }
        }
      }
    }
    return null;
  }

  function evalExpression(rawExpr: string): EvalValue {
    const expr = rawExpr.trim();
    if (expr === '') return '';

    // Strip outer balanced parentheses
    if (expr.startsWith('(') && expr.endsWith(')')) {
      let depth = 0;
      let inQuotes = false;
      let wrapsAll = true;
      for (let i = 0; i < expr.length - 1; i++) {
        const ch = expr[i];
        if (ch === '"') inQuotes = !inQuotes;
        else if (!inQuotes) {
          if (ch === '(') depth++;
          else if (ch === ')') {
            depth--;
            if (depth === 0) {
              wrapsAll = false;
              break;
            }
          }
        }
      }
      if (wrapsAll) return evalExpression(expr.slice(1, -1));
    }

    // String literal
    if (expr.startsWith('"') && expr.endsWith('"') && !expr.slice(1, -1).includes('"')) {
      return expr.slice(1, -1);
    }

    // Comparison operators (lowest precedence)
    const comp = findTopLevelOperator(expr, ['>=', '<=', '<>', '=', '>', '<']);
    if (comp) {
      const left = evalExpression(expr.slice(0, comp.index));
      const right = evalExpression(expr.slice(comp.index + comp.op.length));
      if (isExcelError(left)) return left;
      if (isExcelError(right)) return right;
      const lNum = toNumber(left);
      const rNum = toNumber(right);
      const bothNum = typeof left === 'number' && typeof right === 'number';
      if (bothNum || (!Number.isNaN(lNum) && !Number.isNaN(rNum) && left !== '' && right !== '')) {
        if (comp.op === '=') return Math.abs(lNum - rNum) < 1e-9;
        if (comp.op === '<>') return Math.abs(lNum - rNum) >= 1e-9;
        if (comp.op === '>=') return lNum >= rNum;
        if (comp.op === '<=') return lNum <= rNum;
        if (comp.op === '>') return lNum > rNum;
        if (comp.op === '<') return lNum < rNum;
      }
      const ls = String(left).toLowerCase();
      const rs = String(right).toLowerCase();
      if (comp.op === '=') return ls === rs;
      if (comp.op === '<>') return ls !== rs;
      if (comp.op === '>') return ls > rs;
      if (comp.op === '<') return ls < rs;
      if (comp.op === '>=') return ls >= rs;
      if (comp.op === '<=') return ls <= rs;
    }

    // Concatenation &
    const concatOp = findTopLevelOperator(expr, ['&']);
    if (concatOp) {
      const left = evalExpression(expr.slice(0, concatOp.index));
      const right = evalExpression(expr.slice(concatOp.index + 1));
      if (isExcelError(left)) return left;
      if (isExcelError(right)) return right;
      return String(left) + String(right);
    }

    // Addition / Subtraction
    const addOp = findTopLevelOperator(expr, ['+', '-']);
    if (addOp) {
      const left = evalExpression(expr.slice(0, addOp.index));
      const right = evalExpression(expr.slice(addOp.index + 1));
      if (isExcelError(left)) return left;
      if (isExcelError(right)) return right;
      const a = toNumber(left);
      const b = toNumber(right);
      if (Number.isNaN(a) || Number.isNaN(b)) return '#VALOR!';
      return addOp.op === '+' ? a + b : a - b;
    }

    // Multiplication / Division
    const mulOp = findTopLevelOperator(expr, ['*', '/']);
    if (mulOp) {
      const left = evalExpression(expr.slice(0, mulOp.index));
      const right = evalExpression(expr.slice(mulOp.index + 1));
      if (isExcelError(left)) return left;
      if (isExcelError(right)) return right;
      const a = toNumber(left);
      const b = toNumber(right);
      if (Number.isNaN(a) || Number.isNaN(b)) return '#VALOR!';
      if (mulOp.op === '/') {
        if (b === 0) return '#DIV/0!';
        return a / b;
      }
      return a * b;
    }

    // Unary minus / plus
    if (expr.startsWith('-')) {
      const v = evalExpression(expr.slice(1));
      if (isExcelError(v)) return v;
      const n = toNumber(v);
      return Number.isNaN(n) ? '#VALOR!' : -n;
    }

    // Function call NAME(...)
    const fnMatch = expr.match(/^([A-Za-zÀ-ÿ.]+)\(([\s\S]*)\)$/);
    if (fnMatch) {
      return evalFunction(fnMatch[1], fnMatch[2]);
    }

    // Booleans
    const upper = expr.toUpperCase();
    if (upper === 'VERDADEIRO' || upper === 'TRUE') return true;
    if (upper === 'FALSO' || upper === 'FALSE') return false;

    // Cell reference
    if (/^\$?[A-Za-z]+\$?\d+$/.test(expr)) {
      return evalCell(expr).value;
    }

    // Numeric literal (including PT-BR comma decimals and percentages)
    if (/^[-+]?\d+([.,]\d+)?%?$/.test(expr)) {
      return toNumber(expr);
    }

    return '#NOME?';
  }

  for (const key of Object.keys(cells)) {
    evalCell(key);
  }
  return cache;
}

export function formatCellDisplay(val: EvalValue, format?: CellData['format']): string {
  if (val === '' || val === null || val === undefined) return '';
  if (isExcelError(val)) return String(val);
  if (typeof val === 'boolean') return val ? 'VERDADEIRO' : 'FALSO';
  if (typeof val === 'number') {
    if (format === 'currency') {
      return val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    }
    if (format === 'percent') {
      return `${(val * 100).toLocaleString('pt-BR', {maximumFractionDigits: 1})}%`;
    }
    return val.toLocaleString('pt-BR', {maximumFractionDigits: 2});
  }
  return String(val);
}
