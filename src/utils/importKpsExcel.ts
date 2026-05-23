import ExcelJS from 'exceljs';
import type { KpsInputs, KpsMonthRecord } from '../types/pnl';

const MONTH_INDEX: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

type FieldMapping =
  | { type: 'boolean'; boolField: keyof KpsInputs }
  | { type: 'numeric'; plField: keyof KpsInputs; scoreField: keyof KpsInputs };

const LABEL_MAPPING: Record<string, FieldMapping> = {
  'Debt Ratio':                      { type: 'numeric', plField: 'debtRatio',           scoreField: 'debtRatioScore' },
  'Working Capital Ratio':           { type: 'numeric', plField: 'workingCapitalRatio',  scoreField: 'workingCapitalRatioScore' },
  'Payment to GENCO':                { type: 'boolean', boolField: 'paymentGenco' },
  'Payment to Transmission':         { type: 'boolean', boolField: 'paymentTransmission' },
  'Payment to NEA':                  { type: 'boolean', boolField: 'paymentNea' },
  'Payment to Banks':                { type: 'boolean', boolField: 'paymentBanks' },
  'Collection – Average Method':     { type: 'numeric', plField: 'collectionAvg',        scoreField: 'collectionAvgScore' },
  'Collection – Current to Current': { type: 'numeric', plField: 'collectionC2C',        scoreField: 'collectionC2CScore' },
  'Financial Profitability':         { type: 'numeric', plField: 'profitability',        scoreField: 'profitabilityScore' },
  'NEA Audit Rating':                { type: 'numeric', plField: 'neaAuditRating',       scoreField: 'neaAuditRatingScore' },
  'Incentive Points':                { type: 'numeric', plField: 'incentivePoints',      scoreField: 'incentivePoints' },
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

function cellBool(value: ExcelJS.CellValue): boolean {
  return String(value ?? '').trim().toLowerCase() === 'current';
}

const FIXED = 3;

export async function importKpsFromExcel(file: File): Promise<KpsMonthRecord[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const results: KpsMonthRecord[] = [];

  wb.worksheets.forEach((ws) => {
    // Row 1: month labels at cols 4, 6, 8, ... (PL columns)
    const row1 = ws.getRow(1);
    const monthCols: Array<{ plCol: number; scCol: number } & ReturnType<typeof parseMonthLabel> & { label: string }> = [];

    row1.eachCell((cell, colNum) => {
      if (colNum <= FIXED) return;
      const offset = colNum - FIXED - 1;
      if (offset % 2 !== 0) return; // only PL columns
      const parsed = parseMonthLabel(String(cell.value ?? ''));
      if (parsed) monthCols.push({ plCol: colNum, scCol: colNum + 1, ...parsed });
    });
    if (monthCols.length === 0) return;

    const acc: Record<string, Partial<KpsInputs>> = {};
    for (const c of monthCols) acc[c.id] = {};

    ws.eachRow((row, rowNum) => {
      if (rowNum <= 2) return; // skip both header rows
      const lineLabel = String(row.getCell(1).value ?? '').trim();
      const mapping   = LABEL_MAPPING[lineLabel];
      if (!mapping) return;

      for (const c of monthCols) {
        const plValue = row.getCell(c.plCol).value;
        const scValue = row.getCell(c.scCol).value;

        if (mapping.type === 'boolean') {
          (acc[c.id] as Record<string, boolean>)[mapping.boolField as string] = cellBool(plValue);
        } else {
          (acc[c.id] as Record<string, number>)[mapping.plField    as string] = cellNum(plValue);
          (acc[c.id] as Record<string, number>)[mapping.scoreField as string] = cellNum(scValue);
        }
      }
    });

    for (const c of monthCols) {
      const inp = acc[c.id];
      results.push({
        id: c.id, label: c.label, year: c.year, month: c.month,
        inputs: {
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
        },
      });
    }
  });

  return results.sort((a, b) => a.id.localeCompare(b.id));
}
