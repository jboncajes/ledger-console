import type { KpsInputs, KpsMonthRecord, KpsScores } from '../types/pnl';

export const KPS_ZERO: KpsInputs = {
  debtRatio: 0, debtRatioScore: 0,
  workingCapitalRatio: 0, workingCapitalRatioScore: 0,
  paymentGenco: false, paymentTransmission: false,
  paymentNea: false, paymentBanks: false,
  collectionAvg: 0, collectionAvgScore: 0,
  collectionC2C: 0, collectionC2CScore: 0,
  profitability: 0, profitabilityScore: 0,
  neaAuditRating: 0, neaAuditRatingScore: 0,
  incentivePoints: 0,
};

export function computeKpsScores(inputs: KpsInputs): KpsScores {
  const debtRatio           = Math.min(Math.max(Math.round(inputs.debtRatioScore), 0), 2);
  const workingCapitalRatio = Math.min(Math.max(Math.round(inputs.workingCapitalRatioScore), 0), 2);
  const paymentGenco        = inputs.paymentGenco ? 10 : 0;
  const paymentTransmission = inputs.paymentTransmission ? 3 : 0;
  const paymentNea          = inputs.paymentNea ? 3 : 0;
  const paymentBanks        = inputs.paymentBanks ? 3 : 0;
  const collectionAvg       = Math.min(Math.max(Math.round(inputs.collectionAvgScore), 0), 5);
  const collectionC2C       = Math.min(Math.max(Math.round(inputs.collectionC2CScore), 0), 4);
  const profitability       = Math.min(Math.max(Math.round(inputs.profitabilityScore), 0), 3);
  const neaAuditRating      = Math.min(Math.max(Math.round(inputs.neaAuditRatingScore), 0), 5);

  const baseTotal   = debtRatio + workingCapitalRatio + paymentGenco + paymentTransmission
    + paymentNea + paymentBanks + collectionAvg + collectionC2C + profitability + neaAuditRating;
  const totalPoints = baseTotal + inputs.incentivePoints;

  return {
    debtRatio, workingCapitalRatio, paymentGenco, paymentTransmission,
    paymentNea, paymentBanks, collectionAvg, collectionC2C,
    profitability, neaAuditRating,
    baseTotal, incentivePoints: inputs.incentivePoints, totalPoints,
  };
}

const LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function kpsCutoffId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear()}-01`;
  return `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
}

export function generateKpsSeed(): KpsMonthRecord[] {
  const cutoff = kpsCutoffId();
  const records: KpsMonthRecord[] = [];
  let y = 2025, m = 1;
  while (true) {
    const id = `${y}-${String(m).padStart(2, '0')}`;
    if (id >= cutoff) break;
    records.push({ id, label: `${LONG[m - 1]} ${y}`, year: y, month: m, inputs: { ...KPS_ZERO } });
    m++; if (m > 12) { m = 1; y++; }
  }
  return records;
}

export const KPS_MONTHS_SEED: KpsMonthRecord[] = generateKpsSeed();
