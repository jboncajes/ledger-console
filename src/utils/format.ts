export const PESO = '\u20B1';

export function parseNum(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  const cleaned = input.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

export function fmtFull(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-PH');
}

export function fmtMillions(n: number): string {
  if (n === null || isNaN(n)) return '0.0';
  return (n / 1_000_000).toFixed(1);
}

export function fmtPeso(n: number): string {
  return `${PESO}${fmtMillions(n)}M`;
}

export function fmtPesoFull(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}${PESO}${fmtFull(Math.abs(n))}`;
}

export function fmtPctDelta(curr: number, prior: number): string {
  if (prior === 0 || !prior) return curr > 0 ? '+∞' : '0%';
  const pct = ((curr - prior) / Math.abs(prior)) * 100;
  const arrow = pct >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(pct).toFixed(1)}%`;
}

export function fmtAbsDelta(curr: number, prior: number): string {
  const d = curr - prior;
  const sign = d >= 0 ? '+' : '−';
  return `${sign}${PESO}${fmtMillions(Math.abs(d))}M`;
}

export type DeltaState = 'up' | 'down' | 'flat';

export function deltaState(curr: number, prior: number, inverse = false): DeltaState {
  const d = curr - prior;
  if (d === 0) return 'flat';
  const positive = inverse ? d < 0 : d > 0;
  return positive ? 'up' : 'down';
}
