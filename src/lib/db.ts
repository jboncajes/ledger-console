import { supabase } from './supabase';

export type TabType = 'pnl' | 'dsm' | 'kps' | 'sl';

export interface DbRow {
  id: string;
  tab: TabType;
  namespace: string;
  label: string;
  year: number;
  month: number;
  inputs: unknown;
}

export async function fetchRecords(tab: TabType, namespace: string): Promise<DbRow[]> {
  const { data, error } = await supabase
    .from('month_records')
    .select('*')
    .eq('tab', tab)
    .eq('namespace', namespace)
    .order('id');
  if (error) { console.error('fetchRecords:', error.message); return []; }
  return (data ?? []) as DbRow[];
}

export async function upsertRecords(
  tab: TabType,
  namespace: string,
  months: { id: string; label: string; year: number; month: number; inputs: unknown }[],
): Promise<void> {
  if (months.length === 0) return;
  const rows: DbRow[] = months.map((m) => ({ ...m, tab, namespace }));
  const { error } = await supabase
    .from('month_records')
    .upsert(rows, { onConflict: 'id,tab,namespace' });
  if (error) console.error('upsertRecords:', error.message);
}
