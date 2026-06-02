import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SlInputs, SlMonthRecord } from '../types/pnl';
import { SL_MONTHS_SEED, SL_ZERO } from '../utils/sl';
import { fetchRecords, upsertRecords } from '../lib/db';

function strictCutoffId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear() - 1}-12`;
  return `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
}

function looseCutoffId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear()}-01`;
  return `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
}

function stripToAllowed(months: SlMonthRecord[]): SlMonthRecord[] {
  const cutoff = looseCutoffId();
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

export function useSlState(namespace = 'sl', showPrevMonth = false) {
  const [allMonths, setAllMonths] = useState<SlMonthRecord[]>(SL_MONTHS_SEED);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchRecords('sl', namespace).then((rows) => {
      if (cancelled) return;
      if (rows.length > 0) {
        const seedMap = new Map(SL_MONTHS_SEED.map((m) => [m.id, m]));
        for (const r of rows) seedMap.set(r.id, { id: r.id, label: `${['January','February','March','April','May','June','July','August','September','October','November','December'][r.month-1]} ${r.year}`, year: r.year, month: r.month, inputs: migrateInputs(r.inputs as Partial<SlInputs> & Record<string, unknown>) });
        setAllMonths(stripToAllowed([...seedMap.values()].sort((a, b) => a.id.localeCompare(b.id))));
      }
      setSynced(true);
    });
    return () => { cancelled = true; };
  }, [namespace]);

  useEffect(() => {
    if (!synced) return;
    upsertRecords('sl', namespace, allMonths);
  }, [allMonths, namespace, synced]);

  const months = useMemo(() => {
    if (showPrevMonth) return allMonths;
    const cutoff = strictCutoffId();
    return allMonths.filter((m) => m.id < cutoff);
  }, [allMonths, showPrevMonth]);

  const updateMonthField = useCallback(
    (monthId: string, field: keyof SlInputs, value: number) => {
      setAllMonths((prev) => prev.map((m) =>
        m.id === monthId ? { ...m, inputs: { ...m.inputs, [field]: value } } : m,
      ));
    }, [],
  );

  const resetMonth = useCallback((monthId: string) => {
    setAllMonths((prev) => prev.map((m) =>
      m.id === monthId ? { ...m, inputs: { ...SL_ZERO } } : m,
    ));
  }, []);

  const importMonths = useCallback((imported: SlMonthRecord[]) => {
    setAllMonths((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of imported) map.set(m.id, m);
      return stripToAllowed([...map.values()].sort((a, b) => a.id.localeCompare(b.id)));
    });
  }, []);

  return { months, updateMonthField, resetMonth, importMonths };
}
