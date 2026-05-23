import type { DsmComputed, DsmInputs, DsmMonthRecord, DsmPeriod } from '../types/pnl';
import type { PeriodView } from '../types/pnl';

export function computeDsmPeriod(p: DsmInputs): DsmComputed {
  const totalRev = p.distribRev + p.supplyRev + p.meterRev + p.otherOpRev + p.otherNonOpRev;
  const totalExp = p.distribExp + p.supplyExp + p.meterExp + p.adgExp;
  const netSavings = totalRev - totalExp;
  return { totalRev, totalExp, netSavings };
}

export function sumDsmInputs(list: DsmInputs[]): DsmInputs {
  return list.reduce(
    (acc, m) => ({
      distribRev:    acc.distribRev    + m.distribRev,
      supplyRev:     acc.supplyRev     + m.supplyRev,
      meterRev:      acc.meterRev      + m.meterRev,
      otherOpRev:    acc.otherOpRev    + m.otherOpRev,
      otherNonOpRev: acc.otherNonOpRev + m.otherNonOpRev,
      distribExp:    acc.distribExp    + m.distribExp,
      supplyExp:     acc.supplyExp     + m.supplyExp,
      meterExp:      acc.meterExp      + m.meterExp,
      adgExp:        acc.adgExp        + m.adgExp,
    }),
    { distribRev: 0, supplyRev: 0, meterRev: 0, otherOpRev: 0, otherNonOpRev: 0,
      distribExp: 0, supplyExp: 0, meterExp: 0, adgExp: 0 },
  );
}

const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const DSM_ZERO: DsmInputs = {
  distribRev: 0, supplyRev: 0, meterRev: 0, otherOpRev: 0, otherNonOpRev: 0,
  distribExp: 0, supplyExp: 0, meterExp: 0, adgExp: 0,
};

const EMPTY: DsmPeriod = {
  current: DSM_ZERO, prior: DSM_ZERO, currentLabel: 'Current', priorLabel: 'Prior',
};

export function getDsmPeriodSlices(months: DsmMonthRecord[], period: PeriodView): DsmPeriod {
  if (months.length === 0) return EMPTY;

  const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
  const n = sorted.length;

  if (period === 'MoM') {
    const curr = sorted[n - 1];
    const prev = sorted[Math.max(0, n - 2)];
    return { current: curr.inputs, prior: prev.inputs, currentLabel: curr.label, priorLabel: prev.label };
  }

  if (period === 'QoQ') {
    const latest = sorted[n - 1];
    const cq = Math.ceil(latest.month / 3);
    const cy = latest.year;
    let pq = cq - 1, py = cy;
    if (pq === 0) { pq = 4; py = cy - 1; }
    const currSlice  = sorted.filter((m) => m.year === cy && Math.ceil(m.month / 3) === cq);
    const priorSlice = sorted.filter((m) => m.year === py && Math.ceil(m.month / 3) === pq);
    return {
      current: sumDsmInputs(currSlice.map((m) => m.inputs)),
      prior:   sumDsmInputs(priorSlice.map((m) => m.inputs)),
      currentLabel: `Q${cq} ${cy}`, priorLabel: `Q${pq} ${py}`,
    };
  }

  if (period === 'YoY') {
    const latest = sorted[n - 1];
    const curr  = sorted.find((m) => m.year === latest.year     && m.month === latest.month);
    const prior = sorted.find((m) => m.year === latest.year - 1 && m.month === latest.month);
    return {
      current: curr?.inputs  ?? DSM_ZERO,
      prior:   prior?.inputs ?? DSM_ZERO,
      currentLabel: curr?.label  ?? 'Current',
      priorLabel:   prior?.label ?? 'Prior',
    };
  }

  // YTD
  const latest = sorted[n - 1];
  const currYTD  = sorted.filter((m) => m.year === latest.year     && m.month <= latest.month);
  const priorYTD = sorted.filter((m) => m.year === latest.year - 1 && m.month <= latest.month);
  return {
    current: sumDsmInputs(currYTD.map((m) => m.inputs)),
    prior:   sumDsmInputs(priorYTD.map((m) => m.inputs)),
    currentLabel: `YTD ${SHORT[0]}–${SHORT[latest.month - 1]} ${latest.year}`,
    priorLabel:   `YTD ${SHORT[0]}–${SHORT[latest.month - 1]} ${latest.year - 1}`,
  };
}

function dsmCutoffId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear() - 1}-12`;
  return `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
}

export function generateDsmSeed(): DsmMonthRecord[] {
  const cutoff = dsmCutoffId();
  const records: DsmMonthRecord[] = [];
  let y = 2025, m = 1;
  while (true) {
    const id = `${y}-${String(m).padStart(2, '0')}`;
    if (id >= cutoff) break;
    records.push({ id, label: `${LONG[m - 1]} ${y}`, year: y, month: m, inputs: { ...DSM_ZERO } });
    m++; if (m > 12) { m = 1; y++; }
  }
  return records;
}

export const DSM_MONTHS_SEED: DsmMonthRecord[] = generateDsmSeed();
