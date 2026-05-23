export interface PnlInputs {
  opRev: number;
  othRev: number;
  power: number;
  distrib: number;
  supply: number;
  meter: number;
  adg: number;
  deprec: number;
  interest: number;
  nonOpRev: number;
  nonOpExp: number;
  rfsc: number;
}

export interface MonthRecord {
  id: string;     // "YYYY-MM"
  label: string;  // "April 2026"
  year: number;
  month: number;  // 1–12
  inputs: PnlInputs;
}

export type PeriodView = 'MoM' | 'QoQ' | 'YTD' | 'YoY';

export interface PnlPeriod {
  prior: PnlInputs;
  current: PnlInputs;
  priorLabel: string;
  currentLabel: string;
}

export interface ComputedPnl {
  om: number;
  totalRev: number;
  opMargin: number;
  netOpMargin: number;
  netMargin: number;
  totalMargin: number;
}

export interface PnlComputed {
  prior: ComputedPnl;
  current: ComputedPnl;
  inputs: PnlPeriod;
}

// ── DSM entity ───────────────────────────────────────────────────────────────

export interface DsmInputs {
  distribRev: number;
  supplyRev: number;
  meterRev: number;
  otherOpRev: number;
  otherNonOpRev: number;
  distribExp: number;
  supplyExp: number;
  meterExp: number;
  adgExp: number;
}

export interface DsmComputed {
  totalRev: number;
  totalExp: number;
  netSavings: number;
}

export interface DsmMonthRecord {
  id: string;
  label: string;
  year: number;
  month: number;
  inputs: DsmInputs;
}

export interface DsmPeriod {
  prior: DsmInputs;
  current: DsmInputs;
  priorLabel: string;
  currentLabel: string;
}

export interface DsmPeriodComputed {
  prior: DsmComputed;
  current: DsmComputed;
  inputs: DsmPeriod;
}

export type DeltaTone = 'up' | 'down' | 'warn' | 'neutral';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

// ── KPS entity ───────────────────────────────────────────────────────────────

export interface KpsInputs {
  debtRatio: number;           // actual ratio
  debtRatioScore: number;      // score 0–2
  workingCapitalRatio: number; // actual ratio
  workingCapitalRatioScore: number; // score 0–2
  paymentGenco: boolean;
  paymentTransmission: boolean;
  paymentNea: boolean;
  paymentBanks: boolean;
  collectionAvg: number;       // actual %, e.g. 97.49
  collectionAvgScore: number;  // score 0–5
  collectionC2C: number;       // actual %, e.g. 99.04
  collectionC2CScore: number;  // score 0–4
  profitability: number;       // peso value
  profitabilityScore: number;  // score 0–3
  neaAuditRating: number;      // actual %, e.g. 78
  neaAuditRatingScore: number; // score 0–5
  incentivePoints: number;     // 0, 1, or 2
}

export interface KpsScores {
  debtRatio: number;
  workingCapitalRatio: number;
  paymentGenco: number;
  paymentTransmission: number;
  paymentNea: number;
  paymentBanks: number;
  collectionAvg: number;
  collectionC2C: number;
  profitability: number;
  neaAuditRating: number;
  baseTotal: number;
  incentivePoints: number;
  totalPoints: number;
}

export interface KpsMonthRecord {
  id: string;
  label: string;
  year: number;
  month: number;
  inputs: KpsInputs;
}

// ── SL (System Losses) entity ─────────────────────────────────────────────────

export interface SlInputs {
  kwhPurchased: number;
  slPerMfsrPct: number;  // e.g. 13.76 (not fractional)
  systemsRate: number;
  powerRate: number;
}

export interface SlComputed {
  slWithinCapKwh: number;
  slPerMfsrKwh: number;
  slInExcessPct: number;
  slInExcessKwh: number;
  foregoneRevenuePesos: number;
  systemLossPesos: number;
}

export interface SlMonthRecord {
  id: string;
  label: string;
  year: number;
  month: number;
  inputs: SlInputs;
}
