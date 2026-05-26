import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DsmInputs, DsmMonthRecord, PeriodView } from '../types/pnl';
import { computeDsmPeriod, getDsmPeriodSlices, DSM_MONTHS_SEED } from '../utils/dsm';
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

function stripToAllowed(months: DsmMonthRecord[]): DsmMonthRecord[] {
  const cutoff = looseCutoffId();
  return months.filter((m) => m.id < cutoff);
}

export function useDsmState(namespace = 'dsm', activePeriod: PeriodView = 'MoM', showPrevMonth = false) {
  const [allMonths, setAllMonths] = useState<DsmMonthRecord[]>(DSM_MONTHS_SEED);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchRecords('dsm', namespace).then((rows) => {
      if (cancelled) return;
      if (rows.length > 0) {
        const seedMap = new Map(DSM_MONTHS_SEED.map((m) => [m.id, m]));
        for (const r of rows) seedMap.set(r.id, { id: r.id, label: r.label, year: r.year, month: r.month, inputs: r.inputs as DsmInputs });
        setAllMonths(stripToAllowed([...seedMap.values()].sort((a, b) => a.id.localeCompare(b.id))));
      }
      setSynced(true);
    });
    return () => { cancelled = true; };
  }, [namespace]);

  useEffect(() => {
    if (!synced) return;
    upsertRecords('dsm', namespace, allMonths);
  }, [allMonths, namespace, synced]);

  const months = useMemo(() => {
    if (showPrevMonth) return allMonths;
    const cutoff = strictCutoffId();
    return allMonths.filter((m) => m.id < cutoff);
  }, [allMonths, showPrevMonth]);

  const displayData = useMemo(() => getDsmPeriodSlices(months, activePeriod), [months, activePeriod]);

  const computed = useMemo(() => ({
    prior: computeDsmPeriod(displayData.prior),
    current: computeDsmPeriod(displayData.current),
  }), [displayData]);

  const updateMonthField = useCallback((monthId: string, field: keyof DsmInputs, value: number) => {
    setAllMonths((prev) => prev.map((m) =>
      m.id === monthId ? { ...m, inputs: { ...m.inputs, [field]: value } } : m,
    ));
  }, []);

  const resetMonth = useCallback((monthId: string) => {
    const seed = DSM_MONTHS_SEED.find((m) => m.id === monthId);
    if (!seed) return;
    setAllMonths((prev) => prev.map((m) => m.id === monthId ? { ...m, inputs: { ...seed.inputs } } : m));
  }, []);

  const importMonths = useCallback((imported: DsmMonthRecord[]) => {
    setAllMonths((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of imported) map.set(m.id, m);
      return stripToAllowed([...map.values()].sort((a, b) => a.id.localeCompare(b.id)));
    });
  }, []);

  return { months, activePeriod, updateMonthField, resetMonth, importMonths, displayData, computed };
}
