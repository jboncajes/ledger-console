import ExcelJS from 'exceljs';
import type { DsmInputs, DsmMonthRecord } from '../types/pnl';

const MONTH_INDEX: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const LABEL_TO_FIELD: Record<string, keyof DsmInputs> = {
  'Distribution Revenue':                  'distribRev',
  'Supply Revenue':                        'supplyRev',
  'Metering Revenue':                      'meterRev',
  'Other Operating Revenue':               'otherOpRev',
  'Other Non-Operating Revenue':           'otherNonOpRev',
  'Distribution Expenses':                 'distribExp',
  'Supply Expenses':                       'supplyExp',
  'Metering Expenses':                     'meterExp',
  'Administrative and General Expenses':   'adgExp',
};

function parseMonthLabel(raw: string): { id: string; year: number; month: number; label: string } | null {
  const parts = raw.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const month = MONTH_INDEX[parts[0].toLowerCase()];
  const year  = parseInt(parts[1], 10);
  if (!month || isNaN(year)) return null;
  return { id: `${year}-${String(month).padStart(2, '0')}`, year, month, label: raw.trim() };
}

function cellNum(value: ExcelJS.CellValue): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }
  if (value !== null && typeof value === 'object' && 'result' in (value as object)) {
    const r = (value as { result: unknown }).result;
    return typeof r === 'number' ? r : 0;
  }
  return 0;
}

export async function importDsmFromExcel(file: File): Promise<DsmMonthRecord[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const results: DsmMonthRecord[] = [];

  wb.worksheets.forEach((ws) => {
    const headerRow = ws.getRow(1);
    const cols: Array<{ col: number } & ReturnType<typeof parseMonthLabel> & { label: string }> = [];

    headerRow.eachCell((cell, colNum) => {
      if (colNum === 1) return;
      const parsed = parseMonthLabel(String(cell.value ?? ''));
      if (parsed) cols.push({ col: colNum, ...parsed });
    });
    if (cols.length === 0) return;

    const acc: Record<string, Partial<DsmInputs>> = {};
    for (const c of cols) acc[c.id] = {};

    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const lineLabel = String(row.getCell(1).value ?? '').trim();
      const field = LABEL_TO_FIELD[lineLabel];
      if (!field) return;
      for (const c of cols) acc[c.id][field] = cellNum(row.getCell(c.col).value);
    });

    for (const c of cols) {
      const inp = acc[c.id];
      results.push({
        id: c.id, label: c.label, year: c.year, month: c.month,
        inputs: {
          distribRev:    inp.distribRev    ?? 0,
          supplyRev:     inp.supplyRev     ?? 0,
          meterRev:      inp.meterRev      ?? 0,
          otherOpRev:    inp.otherOpRev    ?? 0,
          otherNonOpRev: inp.otherNonOpRev ?? 0,
          distribExp:    inp.distribExp    ?? 0,
          supplyExp:     inp.supplyExp     ?? 0,
          meterExp:      inp.meterExp      ?? 0,
          adgExp:        inp.adgExp        ?? 0,
        },
      });
    }
  });

  return results.sort((a, b) => a.id.localeCompare(b.id));
}
