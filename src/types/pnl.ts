export interface PnlInputs {
  opRev: number;
  othRev: number;
  power: number;
  om: number;
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

export type PeriodView = 'MoM' | 'QoQ' | 'YTD';

export interface PnlPeriod {
  prior: PnlInputs;
  current: PnlInputs;
  priorLabel: string;
  currentLabel: string;
}

export interface ComputedPnl {
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

export type DeltaTone = 'up' | 'down' | 'warn' | 'neutral';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}
