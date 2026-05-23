import ExcelJS from 'exceljs';
import type { KpsMonthRecord } from '../types/pnl';
import { computeKpsScores, KPS_MONTHS_SEED } from './kps';

const HEADER_BG  = 'FF1E2A3A';
const HEADER_FG  = 'FFFFFFFF';
const SUBHDR_BG  = 'FF2D3E50';
const COMPUTED_BG = 'FFE8EEF8';
const ALT_BG     = 'FFF7F9FC';
const SECTION_BG = 'FFDDE6F5';

type PlKind = 'ratio' | 'percent' | 'currency' | 'boolean' | 'integer';

interface ParamRowDef {
  kind: 'param';
  label: string;
  standard: string;
  maxScore: number;
  plKind: PlKind;
  getPl: (m: KpsMonthRecord) => number | string;
  getScore: (m: KpsMonthRecord) => number;
}
interface ComputedRowDef { kind: 'computed'; label: string; getScore: (m: KpsMonthRecord) => number; }
interface SectionRowDef  { kind: 'section';  label: string; }
type RowDef = ParamRowDef | ComputedRowDef | SectionRowDef;

const ROWS: RowDef[] = [
  { kind: 'section', label: '1. Leverage' },
  { kind: 'param', label: 'Debt Ratio', standard: 'Up to 0.60', maxScore: 2, plKind: 'ratio',
    getPl: (m) => m.inputs.debtRatio, getScore: (m) => m.inputs.debtRatioScore },

  { kind: 'section', label: '2. Liquidity' },
  { kind: 'param', label: 'Working Capital Ratio', standard: 'At least 1.00', maxScore: 2, plKind: 'ratio',
    getPl: (m) => m.inputs.workingCapitalRatio, getScore: (m) => m.inputs.workingCapitalRatioScore },

  { kind: 'section', label: '3. Efficiency' },
  { kind: 'param', label: 'Payment to GENCO', standard: 'Current', maxScore: 10, plKind: 'boolean',
    getPl: (m) => m.inputs.paymentGenco ? 'Current' : 'Not Current', getScore: (m) => m.inputs.paymentGenco ? 10 : 0 },
  { kind: 'param', label: 'Payment to Transmission', standard: 'Current', maxScore: 3, plKind: 'boolean',
    getPl: (m) => m.inputs.paymentTransmission ? 'Current' : 'Not Current', getScore: (m) => m.inputs.paymentTransmission ? 3 : 0 },
  { kind: 'param', label: 'Payment to NEA', standard: 'Current', maxScore: 3, plKind: 'boolean',
    getPl: (m) => m.inputs.paymentNea ? 'Current' : 'Not Current', getScore: (m) => m.inputs.paymentNea ? 3 : 0 },
  { kind: 'param', label: 'Payment to Banks', standard: 'Current', maxScore: 3, plKind: 'boolean',
    getPl: (m) => m.inputs.paymentBanks ? 'Current' : 'Not Current', getScore: (m) => m.inputs.paymentBanks ? 3 : 0 },
  { kind: 'param', label: 'Collection – Average Method', standard: '97% and above', maxScore: 5, plKind: 'percent',
    getPl: (m) => m.inputs.collectionAvg, getScore: (m) => m.inputs.collectionAvgScore },
  { kind: 'param', label: 'Collection – Current to Current', standard: '99% and above', maxScore: 4, plKind: 'percent',
    getPl: (m) => m.inputs.collectionC2C, getScore: (m) => m.inputs.collectionC2CScore },

  { kind: 'section', label: '4. Financial Operation – Profitability' },
  { kind: 'param', label: 'Financial Profitability', standard: 'Positive', maxScore: 3, plKind: 'currency',
    getPl: (m) => m.inputs.profitability, getScore: (m) => m.inputs.profitabilityScore },

  { kind: 'section', label: '5. NEA Audit Rating' },
  { kind: 'param', label: 'NEA Audit Rating', standard: 'Not less than 90%', maxScore: 5, plKind: 'percent',
    getPl: (m) => m.inputs.neaAuditRating, getScore: (m) => m.inputs.neaAuditRatingScore },

  { kind: 'param', label: 'Incentive Points', standard: 'Advance 2 Qtrs Amortization (0 or 2)', maxScore: 2, plKind: 'integer',
    getPl: (m) => m.inputs.incentivePoints, getScore: (m) => m.inputs.incentivePoints },

  { kind: 'computed', label: 'Base Score',    getScore: (m) => computeKpsScores(m.inputs).baseTotal },
  { kind: 'computed', label: 'Incentive',     getScore: (m) => computeKpsScores(m.inputs).incentivePoints },
  { kind: 'computed', label: 'Total Points',  getScore: (m) => computeKpsScores(m.inputs).totalPoints },
];

function numFmtForKind(kind: PlKind): string {
  switch (kind) {
    case 'ratio':    return '0.00';
    case 'percent':  return '0.00"%"';
    case 'currency': return '#,##0.00';
    case 'integer':  return '0';
    default:         return '@';
  }
}

const FIXED = 3; // col 1: param, col 2: standard, col 3: max

function plCol(i: number) { return FIXED + 1 + i * 2; }
function scCol(i: number) { return FIXED + 2 + i * 2; }

function buildSheet(ws: ExcelJS.Worksheet, months: KpsMonthRecord[]) {
  const N = months.length;
  const totalCols = FIXED + N * 2;

  // ── Row 1: main headers ──────────────────────────────────────────────────
  const r1 = ws.addRow(['Financial Parameter', 'Standard', 'Max']);
  r1.height = 28;

  for (let c = 1; c <= FIXED; c++) {
    const cell = r1.getCell(c);
    cell.font      = { bold: true, color: { argb: HEADER_FG }, size: 11, name: 'Calibri' };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
    cell.border    = { bottom: { style: 'medium', color: { argb: 'FF4A6080' } } };
  }

  for (let i = 0; i < N; i++) {
    const pc = plCol(i);
    const sc = scCol(i);
    const cell = r1.getCell(pc);
    cell.value     = months[i].label;
    cell.font      = { bold: true, color: { argb: HEADER_FG }, size: 11, name: 'Calibri' };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border    = { bottom: { style: 'medium', color: { argb: 'FF4A6080' } } };
    ws.mergeCells(r1.number, pc, r1.number, sc);
    const scCell = r1.getCell(sc);
    scCell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    scCell.border = { bottom: { style: 'medium', color: { argb: 'FF4A6080' } } };
  }

  // ── Row 2: PL / Score sub-headers ────────────────────────────────────────
  const r2 = ws.addRow([]);
  r2.height = 16;

  for (let c = 1; c <= FIXED; c++) {
    const cell = r2.getCell(c);
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBHDR_BG } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF4A6080' } } };
  }

  for (let i = 0; i < N; i++) {
    for (const [lbl, col] of [['PL', plCol(i)], ['Score', scCol(i)]] as [string, number][]) {
      const cell     = r2.getCell(col);
      cell.value     = lbl;
      cell.font      = { bold: true, color: { argb: HEADER_FG }, size: 9.5, name: 'Calibri' };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBHDR_BG } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border    = { bottom: { style: 'thin', color: { argb: 'FF4A6080' } } };
    }
  }

  // ── Data rows ─────────────────────────────────────────────────────────────
  let paramIdx = 0;
  for (const row of ROWS) {
    if (row.kind === 'section') {
      const wsRow = ws.addRow([row.label]);
      wsRow.height = 15;
      ws.mergeCells(wsRow.number, 1, wsRow.number, totalCols);
      const cell = wsRow.getCell(1);
      cell.font      = { bold: true, color: { argb: 'FF1E3A6E' }, size: 10, name: 'Calibri' };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_BG } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      continue;
    }

    if (row.kind === 'computed') {
      const vals: (string | number)[] = [row.label, '', ''];
      for (let i = 0; i < N; i++) vals.push('', row.getScore(months[i]));
      const wsRow = ws.addRow(vals);
      wsRow.height = 18;
      wsRow.eachCell((cell, c) => {
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COMPUTED_BG } };
        cell.font   = { bold: true, size: 10.5, name: 'Calibri' };
        cell.border = { top: { style: 'thin', color: { argb: 'FF9AAEC8' } }, bottom: { style: 'thin', color: { argb: 'FF9AAEC8' } } };
        if (c === 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } else if (c > FIXED) {
          cell.numFmt    = '0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });
      continue;
    }

    const pr = row as ParamRowDef;
    const bg = paramIdx % 2 === 0 ? ALT_BG : 'FFFFFFFF';
    const vals: (string | number)[] = [pr.label, pr.standard, pr.maxScore];
    for (let i = 0; i < N; i++) {
      vals.push(pr.getPl(months[i]) as string | number, pr.getScore(months[i]));
    }

    const wsRow = ws.addRow(vals);
    wsRow.height = 18;
    wsRow.eachCell((cell, c) => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font   = { size: 10.5, name: 'Calibri' };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD0D8E8' } } };
      if (c === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      } else if (c === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 3) {
        cell.numFmt = '0'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        const offset = c - FIXED - 1;
        const isPl   = offset % 2 === 0;
        if (isPl) {
          if (pr.plKind !== 'boolean') cell.numFmt = numFmtForKind(pr.plKind);
          cell.alignment = { horizontal: pr.plKind === 'boolean' ? 'center' : 'right', vertical: 'middle' };
        } else {
          cell.numFmt    = '0';
          cell.font      = { bold: true, size: 10.5, name: 'Calibri' };
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }
    });
    paramIdx++;
  }

  // ── Column widths ─────────────────────────────────────────────────────────
  ws.getColumn(1).width = 32;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 6;
  for (let i = 0; i < N; i++) {
    ws.getColumn(plCol(i)).width = 14;
    ws.getColumn(scCol(i)).width = 7;
  }

  ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 2, activeCell: 'D3' }];
}

export async function exportKpsToExcel(months: KpsMonthRecord[], filename?: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ledger Console';
  wb.created = new Date();

  const byYear = new Map<number, KpsMonthRecord[]>();
  for (const m of months) {
    if (!byYear.has(m.year)) byYear.set(m.year, []);
    byYear.get(m.year)!.push(m);
  }
  for (const year of [...byYear.keys()].sort()) {
    buildSheet(wb.addWorksheet(String(year)), byYear.get(year)!.sort((a, b) => a.month - b.month));
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = filename ?? 'ledger-console-kps.xlsx'; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadKpsTemplate(): Promise<void> {
  const blank = KPS_MONTHS_SEED.map((m) => ({
    ...m,
    inputs: {
      debtRatio: 0, debtRatioScore: 0,
      workingCapitalRatio: 0, workingCapitalRatioScore: 0,
      paymentGenco: false, paymentTransmission: false,
      paymentNea: false, paymentBanks: false,
      collectionAvg: 0, collectionAvgScore: 0,
      collectionC2C: 0, collectionC2CScore: 0,
      profitability: 0, profitabilityScore: 0,
      neaAuditRating: 0, neaAuditRatingScore: 0,
      incentivePoints: 0,
    },
  }));
  await exportKpsToExcel(blank, 'ledger-console-kps-template.xlsx');
}
