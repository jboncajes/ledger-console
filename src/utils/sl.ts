import type { SlInputs, SlComputed, SlMonthRecord } from '../types/pnl';

export const SL_CAP_PCT = 10.25;

export const SL_ZERO: SlInputs = {
  kwhPurchased: 0,
  slPerMfsrPct: 0,
  systemsRate: 0,
  powerRate: 0,
};

export function computeSlValues(inputs: SlInputs): SlComputed {
  const slWithinCapKwh = inputs.kwhPurchased * (SL_CAP_PCT / 100);
  const slPerMfsrKwh = inputs.kwhPurchased * (inputs.slPerMfsrPct / 100);
  const slInExcessKwh = slPerMfsrKwh - slWithinCapKwh;
  const slInExcessPct = inputs.slPerMfsrPct - SL_CAP_PCT;
  const foregoneRevenuePesos = slInExcessKwh * inputs.systemsRate;
  const systemLossPesos = slInExcessKwh * inputs.powerRate;
  return { slWithinCapKwh, slPerMfsrKwh, slInExcessPct, slInExcessKwh, foregoneRevenuePesos, systemLossPesos };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function cutoffId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear()}-01`;
  return `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
}

export function generateSlSeed(): SlMonthRecord[] {
  const records: SlMonthRecord[] = [];
  const cutoff = cutoffId();
  let y = 2025, m = 1;
  while (true) {
    const id = `${y}-${String(m).padStart(2, '0')}`;
    if (id >= cutoff) break;
    records.push({ id, label: `${MONTH_NAMES[m - 1]} ${y}`, year: y, month: m, inputs: { ...SL_ZERO } });
    m++; if (m > 12) { m = 1; y++; }
  }
  return records;
}

export const SL_MONTHS_SEED: SlMonthRecord[] = generateSlSeed();
