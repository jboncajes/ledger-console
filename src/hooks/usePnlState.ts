import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MonthRecord, PeriodView, PnlInputs } from '../types/pnl';
import { MONTHS_SEED, computePeriod, getPeriodSlices } from '../utils/pnl';

const STORAGE_KEY = 'ledger-console:months:v2';

function loadFromStorage(): MonthRecord[] {
  if (typeof window === 'undefined') return MONTHS_SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return MONTHS_SEED;
    const parsed = JSON.parse(raw) as MonthRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MONTHS_SEED;
    return parsed;
  } catch {
    return MONTHS_SEED;
  }
}

export function usePnlState() {
  const [months, setMonths] = useState<MonthRecord[]>(() => loadFromStorage());
  const [activePeriod, setActivePeriod] = useState<PeriodView>('MoM');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(months));
    } catch {
      // ignore quota errors
    }
  }, [months]);

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

  const resetAll = useCallback(() => {
    setMonths(MONTHS_SEED);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    months,
    activePeriod,
    setActivePeriod,
    updateMonthField,
    resetMonth,
    resetAll,
    displayData,
    computed,
  };
}
