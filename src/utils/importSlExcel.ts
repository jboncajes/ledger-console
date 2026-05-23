import ExcelJS from 'exceljs';
import type { SlMonthRecord } from '../types/pnl';

const MONTH_INDEX: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
const MONTH_NAMES: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
  7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December',
};

// Column positions in the exported format (1-indexed):
// 1=Month, 2=KWhPurchased, 3=SLWithinCap(skip), 4=SLPerMfsrPct,
// 5=SLPerMfsrKwh(skip), 6=SLInExcessPct(skip), 7=SLInExcessKwh(skip),
// 8=SystemsRate, 9=ForgoneRevenue(skip), 10=PowerRate, 11=SystemLoss(skip)
const COL_KWH_PURCHASED = 2;
const COL_SL_MFSR_PCT   = 4;
const COL_SYSTEMS_RATE  = 8;
const COL_POWER_RATE    = 10;

function cellNum(value: ExcelJS.CellValue): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace(/[₱]/g, '').replace(/^\((.+)\)$/, '-$1');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  if (value !== null && typeof value === 'object' && 'result' in (value as object)) {
    const r = (value as { result: unknown }).result;
    return typeof r === 'number' ? r : 0;
  }
  return 0;
}

export async function importSlFromExcel(file: File): Promise<SlMonthRecord[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const results: SlMonthRecord[] = [];

  wb.worksheets.forEach((ws) => {
    const yearNum = parseInt(ws.name, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) return;

    ws.eachRow((row, rowNum) => {
      if (rowNum <= 4) return; // skip title + 2 header rows + year row

      const firstCell = String(row.getCell(1).value ?? '').trim();
      const monthKey  = firstCell.toLowerCase();
      if (!MONTH_INDEX[monthKey]) return; // skip To Date, empty, section rows

      const month = MONTH_INDEX[monthKey];
      const id    = `${yearNum}-${String(month).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[month]} ${yearNum}`;

      results.push({
        id, label, year: yearNum, month,
        inputs: {
          kwhPurchased: cellNum(row.getCell(COL_KWH_PURCHASED).value),
          slPerMfsrPct: cellNum(row.getCell(COL_SL_MFSR_PCT).value),
          systemsRate:  cellNum(row.getCell(COL_SYSTEMS_RATE).value),
          powerRate:    cellNum(row.getCell(COL_POWER_RATE).value),
        },
      });
    });
  });

  return results.sort((a, b) => a.id.localeCompare(b.id));
}
