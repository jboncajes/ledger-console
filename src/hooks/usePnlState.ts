import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MonthRecord, PeriodView, PnlInputs } from '../types/pnl';
import { MONTHS_SEED, computePeriod, getPeriodSlices, monthLabel } from '../utils/pnl';
import { fetchRecords, upsertRecords } from '../lib/db';

function strictCutoffMonthId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear() - 1}-12`;
  return `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
}

function looseCutoffMonthId(): string {
  const now = new Date();
  const m = now.getMonth();
  if (m === 0) return `${now.getFullYear()}-01`;
  return `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
}

function stripToAllowed(months: MonthRecord[]): MonthRecord[] {
  const cutoff = looseCutoffMonthId();
  return months.filter((m) => m.id < cutoff);
}

export function usePnlState(namespace: string = 'soo', activePeriod: PeriodView = 'MoM', showPrevMonth = false) {
  const [allMonths, setAllMonths] = useState<MonthRecord[]>(MONTHS_SEED);
  const [synced, setSynced] = useState(false);
  const [singleMonthId, setSingleMonthIdRaw] = useState<string>(() => {
    try { return localStorage.getItem(`pnl-singleMonthId-${namespace}`) ?? ''; } catch { return ''; }
  });
  const setSingleMonthId = useCallback((id: string) => {
    setSingleMonthIdRaw(id);
    try { localStorage.setItem(`pnl-singleMonthId-${namespace}`, id); } catch { /* ignore */ }
  }, [namespace]);

  useEffect(() => {
    let cancelled = false;
    fetchRecords('pnl', namespace).then((rows) => {
      if (cancelled) return;
      if (rows.length > 0) {
        const seedMap = new Map(MONTHS_SEED.map((m) => [m.id, m]));
        for (const r of rows) seedMap.set(r.id, { id: r.id, label: monthLabel(r.month, r.year), year: r.year, month: r.month, inputs: r.inputs as PnlInputs });
        setAllMonths(stripToAllowed([...seedMap.values()].sort((a, b) => a.id.localeCompare(b.id))));
      }
      setSynced(true);
    });
    return () => { cancelled = true; };
  }, [namespace]);

  useEffect(() => {
    if (!synced) return;
    upsertRecords('pnl', namespace, allMonths);
  }, [allMonths, namespace, synced]);

  const months = useMemo(() => {
    if (showPrevMonth) return allMonths;
    const cutoff = strictCutoffMonthId();
    return allMonths.filter((m) => m.id < cutoff);
  }, [allMonths, showPrevMonth]);

  const resolvedSingleId = useMemo(() => {
    if (activePeriod !== 'Month') return '';
    if (singleMonthId && months.some((m) => m.id === singleMonthId)) return singleMonthId;
    const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
    return sorted[sorted.length - 1]?.id ?? '';
  }, [activePeriod, singleMonthId, months]);

  const displayData = useMemo(() => getPeriodSlices(months, activePeriod, resolvedSingleId), [months, activePeriod, resolvedSingleId]);

  const computed = useMemo(() => ({
    prior: computePeriod(displayData.prior),
    current: computePeriod(displayData.current),
  }), [displayData]);

  const updateMonthField = useCallback(
    (monthId: string, field: keyof PnlInputs, value: number) => {
      setAllMonths((prev) => prev.map((m) =>
        m.id === monthId ? { ...m, inputs: { ...m.inputs, [field]: value } } : m,
      ));
    }, [],
  );

  const resetMonth = useCallback((monthId: string) => {
    const seed = MONTHS_SEED.find((m) => m.id === monthId);
    if (!seed) return;
    setAllMonths((prev) => prev.map((m) => m.id === monthId ? { ...m, inputs: { ...seed.inputs } } : m));
  }, []);

  const importMonths = useCallback((imported: MonthRecord[]) => {
    setAllMonths((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of imported) map.set(m.id, m);
      return stripToAllowed([...map.values()].sort((a, b) => a.id.localeCompare(b.id)));
    });
  }, []);

  const resetAll = useCallback(() => {
    setAllMonths(MONTHS_SEED);
  }, []);

  return { months, activePeriod, singleMonthId: resolvedSingleId, setSingleMonthId, updateMonthField, resetMonth, resetAll, importMonths, displayData, computed };
}
