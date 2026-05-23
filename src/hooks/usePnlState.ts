import { useCallback, useEffect, useMemo, useState } from 'react';
// activePeriod is now passed in as a parameter — managed by Redux in App.tsx
import type { MonthRecord, PeriodView, PnlInputs } from '../types/pnl';
import { MONTHS_SEED, computePeriod, getPeriodSlices } from '../utils/pnl';

function cutoffMonthId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear() - 1}-12`;
  return `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
}

function stripRecentMonths(months: MonthRecord[]): MonthRecord[] {
  const cutoff = cutoffMonthId();
  return months.filter((m) => m.id < cutoff);
}

function loadFromStorage(storageKey: string): MonthRecord[] {
  if (typeof window === 'undefined') return MONTHS_SEED;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return MONTHS_SEED;
    const parsed = JSON.parse(raw) as MonthRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MONTHS_SEED;
    return stripRecentMonths(parsed);
  } catch {
    return MONTHS_SEED;
  }
}

export function usePnlState(namespace: string = 'soo', activePeriod: PeriodView = 'MoM') {
  const storageKey = `ledger-console:months:v2:${namespace}`;
  const [months, setMonths] = useState<MonthRecord[]>(() => loadFromStorage(storageKey));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(months));
    } catch {
      // ignore quota errors
    }
  }, [months, storageKey]);

  const displayData = useMemo(
    () => getPeriodSlices(months, activePeriod),
    [months, activePeriod],
  );

  const computed = useMemo(
    () => ({
      prior: computePeriod(displayData.prior),
      current: computePeriod(displayData.current),
    }),
    [displayData],
  );

  const updateMonthField = useCallback(
    (monthId: string, field: keyof PnlInputs, value: number) => {
      setMonths((prev) =>
        prev.map((m) =>
          m.id === monthId ? { ...m, inputs: { ...m.inputs, [field]: value } } : m,
        ),
      );
    },
    [],
  );

  const resetMonth = useCallback((monthId: string) => {
    const seed = MONTHS_SEED.find((m) => m.id === monthId);
    if (!seed) return;
    setMonths((prev) =>
      prev.map((m) => (m.id === monthId ? { ...m, inputs: { ...seed.inputs } } : m)),
    );
  }, []);

  const importMonths = useCallback((imported: MonthRecord[]) => {
    setMonths((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of imported) map.set(m.id, m);
      return stripRecentMonths(
        [...map.values()].sort((a, b) => a.id.localeCompare(b.id)),
      );
    });
  }, []);

  const resetAll = useCallback(() => {
    setMonths(MONTHS_SEED);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return {
    months,
    activePeriod,
    updateMonthField,
    resetMonth,
    resetAll,
    importMonths,
    displayData,
    computed,
  };
}
