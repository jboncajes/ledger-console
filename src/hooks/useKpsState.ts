import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KpsInputs, KpsMonthRecord } from '../types/pnl';
import { computeKpsScores, KPS_MONTHS_SEED } from '../utils/kps';
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

function stripToAllowed(months: KpsMonthRecord[]): KpsMonthRecord[] {
  const cutoff = looseCutoffId();
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

export function useKpsState(namespace = 'kps', showPrevMonth = false) {
  const [allMonths, setAllMonths] = useState<KpsMonthRecord[]>(KPS_MONTHS_SEED);
  const [synced, setSynced] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    fetchRecords('kps', namespace).then((rows) => {
      if (cancelled) return;
      if (rows.length > 0) {
        const seedMap = new Map(KPS_MONTHS_SEED.map((m) => [m.id, m]));
        for (const r of rows) seedMap.set(r.id, { id: r.id, label: r.label, year: r.year, month: r.month, inputs: migrateInputs(r.inputs as Partial<KpsInputs> & Record<string, unknown>) });
        const loaded = stripToAllowed([...seedMap.values()].sort((a, b) => a.id.localeCompare(b.id)));
        setAllMonths(loaded);
        const cutoff = strictCutoffId();
        const visible = loaded.filter((m) => m.id < cutoff);
        setSelectedId(defaultSelectedId(visible.length > 0 ? visible : loaded));
      } else {
        setSelectedId(defaultSelectedId(KPS_MONTHS_SEED.filter((m) => m.id < strictCutoffId())));
      }
      setSynced(true);
    });
    return () => { cancelled = true; };
  }, [namespace]);

  useEffect(() => {
    if (!synced) return;
    upsertRecords('kps', namespace, allMonths);
  }, [allMonths, namespace, synced]);

  const months = useMemo(() => {
    if (showPrevMonth) return allMonths;
    const cutoff = strictCutoffId();
    return allMonths.filter((m) => m.id < cutoff);
  }, [allMonths, showPrevMonth]);

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
      setAllMonths((prev) => prev.map((m) =>
        m.id === monthId ? { ...m, inputs: { ...m.inputs, [field]: value } } : m,
      ));
    }, [],
  );

  const resetMonth = useCallback((monthId: string) => {
    const seed = KPS_MONTHS_SEED.find((m) => m.id === monthId);
    if (!seed) return;
    setAllMonths((prev) => prev.map((m) => m.id === monthId ? { ...m, inputs: { ...seed.inputs } } : m));
  }, []);

  const importMonths = useCallback((imported: KpsMonthRecord[]) => {
    setAllMonths((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of imported) map.set(m.id, m);
      return stripToAllowed([...map.values()].sort((a, b) => a.id.localeCompare(b.id)));
    });
  }, []);

  return { months, selectedId, setSelectedId, selectedMonth, scores, updateMonthField, resetMonth, importMonths };
}
