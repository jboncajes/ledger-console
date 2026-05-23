import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KpsInputs, KpsMonthRecord } from '../types/pnl';
import { computeKpsScores, KPS_MONTHS_SEED } from '../utils/kps';

function cutoffId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear() - 1}-12`;
  return `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
}

function strip(months: KpsMonthRecord[]): KpsMonthRecord[] {
  const cutoff = cutoffId();
  return months.filter((m) => m.id < cutoff);
}

function defaultSelectedId(months: KpsMonthRecord[]): string {
  if (months.length === 0) return '';
  return months[months.length - 1].id;
}

function migrateInputs(inp: Partial<KpsInputs> & Record<string, unknown>): KpsInputs {
  return {
    debtRatio:                (inp.debtRatio                as number)  ?? 0,
    debtRatioScore:           (inp.debtRatioScore           as number)  ?? 0,
    workingCapitalRatio:      (inp.workingCapitalRatio      as number)  ?? 0,
    workingCapitalRatioScore: (inp.workingCapitalRatioScore as number)  ?? 0,
    paymentGenco:             (inp.paymentGenco             as boolean) ?? false,
    paymentTransmission:      (inp.paymentTransmission      as boolean) ?? false,
    paymentNea:               (inp.paymentNea               as boolean) ?? false,
    paymentBanks:             (inp.paymentBanks             as boolean) ?? false,
    collectionAvg:            (inp.collectionAvg            as number)  ?? 0,
    collectionAvgScore:       (inp.collectionAvgScore       as number)  ?? 0,
    collectionC2C:            (inp.collectionC2C            as number)  ?? 0,
    collectionC2CScore:       (inp.collectionC2CScore       as number)  ?? 0,
    profitability:            (inp.profitability            as number)  ?? 0,
    profitabilityScore:       (inp.profitabilityScore       as number)  ?? 0,
    neaAuditRating:           (inp.neaAuditRating           as number)  ?? 0,
    neaAuditRatingScore:      (inp.neaAuditRatingScore      as number)  ?? 0,
    incentivePoints:          (inp.incentivePoints          as number)  ?? 0,
  };
}

function load(key: string): KpsMonthRecord[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return KPS_MONTHS_SEED;
    const parsed = JSON.parse(raw) as KpsMonthRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return KPS_MONTHS_SEED;
    return strip(parsed.map((m) => ({ ...m, inputs: migrateInputs(m.inputs as Partial<KpsInputs> & Record<string, unknown>) })));
  } catch {
    return KPS_MONTHS_SEED;
  }
}

export function useKpsState(namespace = 'kps') {
  const storageKey = `ledger-console:kps:v1:${namespace}`;
  const [months, setMonths] = useState<KpsMonthRecord[]>(() => load(storageKey));
  const [selectedId, setSelectedId] = useState<string>(() => defaultSelectedId(load(storageKey)));

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(months)); } catch { /* ignore */ }
  }, [months, storageKey]);

  // Keep selectedId valid if months list changes
  useEffect(() => {
    if (months.length === 0) { setSelectedId(''); return; }
    const exists = months.some((m) => m.id === selectedId);
    if (!exists) setSelectedId(defaultSelectedId(months));
  }, [months, selectedId]);

  const selectedMonth = useMemo(
    () => months.find((m) => m.id === selectedId) ?? months[months.length - 1] ?? null,
    [months, selectedId],
  );

  const scores = useMemo(
    () => selectedMonth ? computeKpsScores(selectedMonth.inputs) : null,
    [selectedMonth],
  );

  const updateMonthField = useCallback(
    (monthId: string, field: keyof KpsInputs, value: number | boolean) => {
      setMonths((prev) => prev.map((m) =>
        m.id === monthId ? { ...m, inputs: { ...m.inputs, [field]: value } } : m,
      ));
    },
    [],
  );

  const resetMonth = useCallback((monthId: string) => {
    const seed = KPS_MONTHS_SEED.find((m) => m.id === monthId);
    if (!seed) return;
    setMonths((prev) => prev.map((m) => m.id === monthId ? { ...m, inputs: { ...seed.inputs } } : m));
  }, []);

  const importMonths = useCallback((imported: KpsMonthRecord[]) => {
    setMonths((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of imported) map.set(m.id, m);
      return strip([...map.values()].sort((a, b) => a.id.localeCompare(b.id)));
    });
  }, []);

  return { months, selectedId, setSelectedId, selectedMonth, scores, updateMonthField, resetMonth, importMonths };
}
