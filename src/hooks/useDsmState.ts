import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DsmInputs, DsmMonthRecord, PeriodView } from '../types/pnl';
import { computeDsmPeriod, getDsmPeriodSlices, DSM_MONTHS_SEED } from '../utils/dsm';

function cutoffId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear() - 1}-12`;
  return `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
}

function strip(months: DsmMonthRecord[]): DsmMonthRecord[] {
  const cutoff = cutoffId();
  return months.filter((m) => m.id < cutoff);
}

function load(key: string): DsmMonthRecord[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return DSM_MONTHS_SEED;
    const parsed = JSON.parse(raw) as DsmMonthRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DSM_MONTHS_SEED;
    return strip(parsed);
  } catch {
    return DSM_MONTHS_SEED;
  }
}

export function useDsmState(namespace = 'dsm', activePeriod: PeriodView = 'MoM') {
  const storageKey = `ledger-console:dsm:v1:${namespace}`;
  const [months, setMonths] = useState<DsmMonthRecord[]>(() => load(storageKey));

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(months)); } catch { /* ignore */ }
  }, [months, storageKey]);

  const displayData = useMemo(() => getDsmPeriodSlices(months, activePeriod), [months, activePeriod]);

  const computed = useMemo(() => ({
    prior:   computeDsmPeriod(displayData.prior),
    current: computeDsmPeriod(displayData.current),
  }), [displayData]);

  const updateMonthField = useCallback((monthId: string, field: keyof DsmInputs, value: number) => {
    setMonths((prev) => prev.map((m) =>
      m.id === monthId ? { ...m, inputs: { ...m.inputs, [field]: value } } : m,
    ));
  }, []);

  const resetMonth = useCallback((monthId: string) => {
    const seed = DSM_MONTHS_SEED.find((m) => m.id === monthId);
    if (!seed) return;
    setMonths((prev) => prev.map((m) => m.id === monthId ? { ...m, inputs: { ...seed.inputs } } : m));
  }, []);

  const importMonths = useCallback((imported: DsmMonthRecord[]) => {
    setMonths((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of imported) map.set(m.id, m);
      return strip([...map.values()].sort((a, b) => a.id.localeCompare(b.id)));
    });
  }, []);

  return { months, activePeriod, updateMonthField, resetMonth, importMonths, displayData, computed };
}
