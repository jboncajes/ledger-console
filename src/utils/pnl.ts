import type { ComputedPnl, MonthRecord, PeriodView, PnlInputs, PnlPeriod } from '../types/pnl';

export function computePeriod(p: PnlInputs): ComputedPnl {
  const totalRev = p.opRev + p.othRev;
  const om = p.distrib + p.supply + p.meter + p.adg;
  const opMargin = totalRev - p.power - om;
  const netOpMargin = opMargin - p.deprec - p.interest;
  const netMargin = netOpMargin + p.nonOpRev - p.nonOpExp;
  const totalMargin = netMargin + p.rfsc;
  return { om, totalRev, opMargin, netOpMargin, netMargin, totalMargin };
}

export function sumInputs(list: PnlInputs[]): PnlInputs {
  return list.reduce(
    (acc, m) => ({
      opRev:    acc.opRev    + m.opRev,
      othRev:   acc.othRev   + m.othRev,
      power:    acc.power    + m.power,
      distrib:  acc.distrib  + m.distrib,
      supply:   acc.supply   + m.supply,
      meter:    acc.meter    + m.meter,
      adg:      acc.adg      + m.adg,
      deprec:   acc.deprec   + m.deprec,
      interest: acc.interest + m.interest,
      nonOpRev: acc.nonOpRev + m.nonOpRev,
      nonOpExp: acc.nonOpExp + m.nonOpExp,
      rfsc:     acc.rfsc     + m.rfsc,
    }),
    { opRev: 0, othRev: 0, power: 0, distrib: 0, supply: 0, meter: 0, adg: 0, deprec: 0, interest: 0, nonOpRev: 0, nonOpExp: 0, rfsc: 0 },
  );
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG  = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EMPTY_INPUTS: PnlInputs = {
  opRev: 0, othRev: 0, power: 0, distrib: 0, supply: 0, meter: 0, adg: 0, deprec: 0, interest: 0, nonOpRev: 0, nonOpExp: 0, rfsc: 0,
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

  if (period === 'YoY') {
    const latest = sorted[n - 1];

    const current = sorted.find(
        (m) => m.year === latest.year && m.month === latest.month,
    );

    const prior = sorted.find(
        (m) => m.year === latest.year - 1 && m.month === latest.month,
    );

    return {
        current: current?.inputs ?? EMPTY_INPUTS,
        prior: prior?.inputs ?? EMPTY_INPUTS,
        currentLabel: current?.label ?? 'Current',
        priorLabel: prior?.label ?? 'Prior',
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

const SEED_START = { year: 2025, month: 1 };
const ZERO_INPUTS: PnlInputs = { opRev: 0, othRev: 0, power: 0, distrib: 0, supply: 0, meter: 0, adg: 0, deprec: 0, interest: 0, nonOpRev: 0, nonOpExp: 0, rfsc: 0 };

function generateMonthsSeed(): MonthRecord[] {
  const now = new Date();
  let endMonth = now.getMonth(); // 0-indexed → 1-indexed previous month
  let endYear = now.getFullYear();
  if (endMonth <= 0) { endMonth += 12; endYear -= 1; }

  const months: MonthRecord[] = [];
  let y = SEED_START.year;
  let m = SEED_START.month;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push({
      id: `${y}-${String(m).padStart(2, '0')}`,
      label: `${LONG[m - 1]} ${y}`,
      year: y,
      month: m,
      inputs: { ...ZERO_INPUTS },
    });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

export const MONTHS_SEED: MonthRecord[] = generateMonthsSeed();
