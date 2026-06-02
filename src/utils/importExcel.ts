import ExcelJS from 'exceljs';
import type { MonthRecord, PnlInputs } from '../types/pnl';

const MONTH_INDEX: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const LABEL_TO_FIELD: Record<string, keyof PnlInputs> = {
  'Operating Revenue':                         'opRev',
  'Total Operating Revenue':                   'opRev',
  'Other Revenue':                             'othRev',
  'Total Power Purchased':                     'power',
  'Distribution Expenses':                     'distrib',
  'Supply Expenses':                           'supply',
  'Metering Expenses':                         'meter',
  'Administrative And General Expenses':       'adg',
  'Depreciation':                              'deprec',
  'Interest Expense':                          'interest',
  'Non-Operating Revenue':                     'nonOpRev',
  'Non-Total Operating Revenue':               'nonOpRev',
  'Non-Operating Expense':                     'nonOpExp',
  'RFSC':                                      'rfsc',
};

function parseMonthLabel(raw: string): { id: string; year: number; month: number; label: string } | null {
  const parts = raw.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const month = MONTH_INDEX[parts[0].toLowerCase()];
  const year = parseInt(parts[1], 10);
  if (!month || isNaN(year)) return null;
  const LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return { id: `${year}-${String(month).padStart(2, '0')}`, year, month, label: `${LONG[month - 1]} ${year}` };
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

export async function importFromExcel(file: File): Promise<MonthRecord[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const results: MonthRecord[] = [];

  wb.worksheets.forEach((ws) => {
    // Row 1: headers — col A = "Line Item", B+ = month labels
    const headerRow = ws.getRow(1);
    const cols: Array<{ col: number } & ReturnType<typeof parseMonthLabel> & { label: string }> = [];

    headerRow.eachCell((cell, colNum) => {
      if (colNum === 1) return;
      const parsed = parseMonthLabel(String(cell.value ?? ''));
      if (parsed) cols.push({ col: colNum, ...parsed });
    });

    if (cols.length === 0) return;

    // Accumulate inputs per month
    const acc: Record<string, Partial<PnlInputs>> = {};
    for (const c of cols) acc[c.id] = {};

    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const lineLabel = String(row.getCell(1).value ?? '').trim();
      const field = LABEL_TO_FIELD[lineLabel];
      if (!field) return;
      for (const c of cols) {
        acc[c.id][field] = cellNum(row.getCell(c.col).value);
      }
    });

    for (const c of cols) {
      const inp = acc[c.id];
      results.push({
        id: c.id,
        label: c.label,
        year: c.year,
        month: c.month,
        inputs: {
          opRev:    inp.opRev    ?? 0,
          othRev:   inp.othRev   ?? 0,
          power:    inp.power    ?? 0,
          distrib:  inp.distrib  ?? 0,
          supply:   inp.supply   ?? 0,
          meter:    inp.meter    ?? 0,
          adg:      inp.adg      ?? 0,
          deprec:   inp.deprec   ?? 0,
          interest: inp.interest ?? 0,
          nonOpRev: inp.nonOpRev ?? 0,
          nonOpExp: inp.nonOpExp ?? 0,
          rfsc:     inp.rfsc     ?? 0,
        },
      });
    }
  });

  return results.sort((a, b) => a.id.localeCompare(b.id));
}
