import type { ComputedPnl, MonthRecord, PeriodView, PnlInputs, PnlPeriod } from '../types/pnl';

export function computePeriod(p: PnlInputs): ComputedPnl {
  const totalRev = p.opRev + p.othRev;
  const opMargin = totalRev - p.power - p.om;
  const netOpMargin = opMargin - p.deprec - p.interest;
  const netMargin = netOpMargin + p.nonOpRev - p.nonOpExp;
  const totalMargin = netMargin + p.rfsc;
  return { totalRev, opMargin, netOpMargin, netMargin, totalMargin };
}

export function sumInputs(list: PnlInputs[]): PnlInputs {
  return list.reduce(
    (acc, m) => ({
      opRev: acc.opRev + m.opRev,
      othRev: acc.othRev + m.othRev,
      power: acc.power + m.power,
      om: acc.om + m.om,
      deprec: acc.deprec + m.deprec,
      interest: acc.interest + m.interest,
      nonOpRev: acc.nonOpRev + m.nonOpRev,
      nonOpExp: acc.nonOpExp + m.nonOpExp,
      rfsc: acc.rfsc + m.rfsc,
    }),
    { opRev: 0, othRev: 0, power: 0, om: 0, deprec: 0, interest: 0, nonOpRev: 0, nonOpExp: 0, rfsc: 0 },
  );
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EMPTY_INPUTS: PnlInputs = {
  opRev: 0, othRev: 0, power: 0, om: 0, deprec: 0, interest: 0, nonOpRev: 0, nonOpExp: 0, rfsc: 0,
};

export function getPeriodSlices(months: MonthRecord[], period: PeriodView): PnlPeriod {
  if (months.length === 0) {
    return { current: EMPTY_INPUTS, prior: EMPTY_INPUTS, currentLabel: 'Current', priorLabel: 'Prior' };
  }

  const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
  const n = sorted.length;

  if (period === 'MoM') {
    const curr = sorted[n - 1];
    const prev = sorted[Math.max(0, n - 2)];
    return { current: curr.inputs, prior: prev.inputs, currentLabel: curr.label, priorLabel: prev.label };
  }

  if (period === 'QoQ') {
    const latest = sorted[n - 1];
    const cq = Math.ceil(latest.month / 3); // 1–4
    const cy = latest.year;

    let pq = cq - 1;
    let py = cy;
    if (pq === 0) { pq = 4; py = cy - 1; }

    const currSlice = sorted.filter((m) => m.year === cy && Math.ceil(m.month / 3) === cq);
    const priorSlice = sorted.filter((m) => m.year === py && Math.ceil(m.month / 3) === pq);

    return {
      current: sumInputs(currSlice.map((m) => m.inputs)),
      prior: sumInputs(priorSlice.map((m) => m.inputs)),
      currentLabel: `Q${cq} ${cy}`,
      priorLabel: `Q${pq} ${py}`,
    };
  }

  // YTD
  const latest = sorted[n - 1];
  const currYTD = sorted.filter((m) => m.year === latest.year && m.month <= latest.month);
  const prevYTD = sorted.filter((m) => m.year === latest.year - 1 && m.month <= latest.month);
  return {
    current: sumInputs(currYTD.map((m) => m.inputs)),
    prior: sumInputs(prevYTD.map((m) => m.inputs)),
    currentLabel: `YTD ${SHORT[0]}–${SHORT[latest.month - 1]} ${latest.year}`,
    priorLabel: `YTD ${SHORT[0]}–${SHORT[latest.month - 1]} ${latest.year - 1}`,
  };
}

export const MONTHS_SEED: MonthRecord[] = [
  {
    id: '2025-01', label: 'January 2025', year: 2025, month: 1,
    inputs: { opRev: 168_400_000, othRev: 2_800_000, power: 138_600_000, om: 27_500_000, deprec: 7_500_000, interest: 6_800_000, nonOpRev: 1_200_000, nonOpExp: 200_000, rfsc: 5_100_000 },
  },
  {
    id: '2025-02', label: 'February 2025', year: 2025, month: 2,
    inputs: { opRev: 172_100_000, othRev: 2_500_000, power: 141_200_000, om: 27_800_000, deprec: 7_500_000, interest: 6_600_000, nonOpRev: 1_300_000, nonOpExp: 100_000, rfsc: 5_200_000 },
  },
  {
    id: '2025-03', label: 'March 2025', year: 2025, month: 3,
    inputs: { opRev: 179_300_000, othRev: 3_100_000, power: 148_500_000, om: 29_200_000, deprec: 7_400_000, interest: 6_400_000, nonOpRev: 1_500_000, nonOpExp: 0, rfsc: 5_500_000 },
  },
  {
    id: '2025-04', label: 'April 2025', year: 2025, month: 4,
    inputs: { opRev: 192_600_000, othRev: 2_900_000, power: 158_200_000, om: 31_000_000, deprec: 7_400_000, interest: 6_200_000, nonOpRev: 1_600_000, nonOpExp: 0, rfsc: 5_800_000 },
  },
  {
    id: '2025-05', label: 'May 2025', year: 2025, month: 5,
    inputs: { opRev: 214_800_000, othRev: 3_200_000, power: 172_400_000, om: 33_500_000, deprec: 7_400_000, interest: 5_900_000, nonOpRev: 1_700_000, nonOpExp: 0, rfsc: 6_100_000 },
  },
  {
    id: '2025-06', label: 'June 2025', year: 2025, month: 6,
    inputs: { opRev: 208_500_000, othRev: 2_800_000, power: 167_800_000, om: 32_200_000, deprec: 7_350_000, interest: 5_700_000, nonOpRev: 1_800_000, nonOpExp: 0, rfsc: 6_000_000 },
  },
  {
    id: '2025-07', label: 'July 2025', year: 2025, month: 7,
    inputs: { opRev: 204_200_000, othRev: 2_600_000, power: 165_100_000, om: 31_800_000, deprec: 7_350_000, interest: 5_500_000, nonOpRev: 1_750_000, nonOpExp: 100_000, rfsc: 5_900_000 },
  },
  {
    id: '2025-08', label: 'August 2025', year: 2025, month: 8,
    inputs: { opRev: 201_300_000, othRev: 2_400_000, power: 162_800_000, om: 31_200_000, deprec: 7_300_000, interest: 5_300_000, nonOpRev: 1_700_000, nonOpExp: 200_000, rfsc: 5_800_000 },
  },
  {
    id: '2025-09', label: 'September 2025', year: 2025, month: 9,
    inputs: { opRev: 197_600_000, othRev: 2_200_000, power: 159_400_000, om: 30_500_000, deprec: 7_300_000, interest: 5_100_000, nonOpRev: 1_650_000, nonOpExp: 0, rfsc: 5_700_000 },
  },
  {
    id: '2025-10', label: 'October 2025', year: 2025, month: 10,
    inputs: { opRev: 191_400_000, othRev: 2_700_000, power: 155_200_000, om: 30_100_000, deprec: 7_300_000, interest: 4_900_000, nonOpRev: 1_600_000, nonOpExp: 0, rfsc: 5_600_000 },
  },
  {
    id: '2025-11', label: 'November 2025', year: 2025, month: 11,
    inputs: { opRev: 184_700_000, othRev: 3_000_000, power: 150_800_000, om: 29_600_000, deprec: 7_250_000, interest: 4_700_000, nonOpRev: 1_550_000, nonOpExp: 0, rfsc: 5_500_000 },
  },
  {
    id: '2025-12', label: 'December 2025', year: 2025, month: 12,
    inputs: { opRev: 187_800_000, othRev: 3_500_000, power: 153_600_000, om: 30_000_000, deprec: 7_250_000, interest: 4_500_000, nonOpRev: 1_800_000, nonOpExp: 300_000, rfsc: 5_700_000 },
  },
  {
    id: '2026-01', label: 'January 2026', year: 2026, month: 1,
    inputs: { opRev: 175_600_000, othRev: 2_900_000, power: 143_800_000, om: 28_500_000, deprec: 7_300_000, interest: 6_200_000, nonOpRev: 1_500_000, nonOpExp: 0, rfsc: 5_400_000 },
  },
  {
    id: '2026-02', label: 'February 2026', year: 2026, month: 2,
    inputs: { opRev: 180_200_000, othRev: 2_700_000, power: 148_100_000, om: 29_100_000, deprec: 7_250_000, interest: 5_900_000, nonOpRev: 1_600_000, nonOpExp: 0, rfsc: 5_600_000 },
  },
  {
    id: '2026-03', label: 'March 2026', year: 2026, month: 3,
    inputs: { opRev: 188_500_000, othRev: 3_400_000, power: 158_700_000, om: 30_800_000, deprec: 7_300_000, interest: 5_700_000, nonOpRev: 1_900_000, nonOpExp: 0, rfsc: 6_200_000 },
  },
  {
    id: '2026-04', label: 'April 2026', year: 2026, month: 4,
    inputs: { opRev: 0, othRev: 0, power: 0, om: 0, deprec: 0, interest: 0, nonOpRev: 0, nonOpExp: 0, rfsc: 0 },
  },
];
