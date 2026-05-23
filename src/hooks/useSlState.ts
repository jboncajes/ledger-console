import { useCallback, useEffect, useState } from 'react';
import type { SlInputs, SlMonthRecord } from '../types/pnl';
import { SL_MONTHS_SEED, SL_ZERO } from '../utils/sl';

function cutoffId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear() - 1}-12`;
  return `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
}

function strip(months: SlMonthRecord[]): SlMonthRecord[] {
  const cutoff = cutoffId();
  return months.filter((m) => m.id < cutoff);
}

function migrateInputs(inp: Partial<SlInputs> & Record<string, unknown>): SlInputs {
  return {
    kwhPurchased: (inp.kwhPurchased as number) ?? 0,
    slPerMfsrPct: (inp.slPerMfsrPct as number) ?? 0,
    systemsRate:  (inp.systemsRate  as number) ?? 0,
    powerRate:    (inp.powerRate    as number) ?? 0,
  };
}

function load(key: string): SlMonthRecord[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return SL_MONTHS_SEED;
    const parsed = JSON.parse(raw) as SlMonthRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SL_MONTHS_SEED;
    return strip(parsed.map((m) => ({ ...m, inputs: migrateInputs(m.inputs as Partial<SlInputs> & Record<string, unknown>) })));
  } catch {
    return SL_MONTHS_SEED;
  }
}

export function useSlState(namespace = 'sl') {
  const storageKey = `ledger-console:sl:v1:${namespace}`;
  const [months, setMonths] = useState<SlMonthRecord[]>(() => load(storageKey));

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(months)); } catch { /* ignore */ }
  }, [months, storageKey]);

  const updateMonthField = useCallback(
    (monthId: string, field: keyof SlInputs, value: number) => {
      setMonths((prev) => prev.map((m) =>
        m.id === monthId ? { ...m, inputs: { ...m.inputs, [field]: value } } : m,
      ));
    },
    [],
  );

  const resetMonth = useCallback((monthId: string) => {
    setMonths((prev) => prev.map((m) =>
      m.id === monthId ? { ...m, inputs: { ...SL_ZERO } } : m,
    ));
  }, []);

  const importMonths = useCallback((imported: SlMonthRecord[]) => {
    setMonths((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of imported) map.set(m.id, m);
      return strip([...map.values()].sort((a, b) => a.id.localeCompare(b.id)));
    });
  }, []);

  return { months, updateMonthField, resetMonth, importMonths };
}
