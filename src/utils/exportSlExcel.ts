import ExcelJS from 'exceljs';
import type { SlMonthRecord } from '../types/pnl';
import { computeSlValues, SL_CAP_PCT, SL_MONTHS_SEED } from './sl';

// Same palette as DSM/KPS exports
const HEADER_BG   = 'FF1E2A3A';
const HEADER_FG   = 'FFFFFFFF';
const COMPUTED_BG = 'FFE8EEF8';
const ALT_BG      = 'FFF7F9FC';
const SECTION_BG  = 'FFEEF4FF';

// Column layout (1-indexed):
// 1=Month, 2=KWhPurchased, 3=SLWithinCapKwh, 4=SLPerMfsrPct, 5=SLPerMfsrKwh,
// 6=SLInExcessPct, 7=SLInExcessKwh, 8=SystemsRate, 9=ForgoneRevenue, 10=PowerRate, 11=SystemLoss
const COLS = {
  month:           1,
  kwhPurchased:    2,
  slWithinCapKwh:  3,
  slPerMfsrPct:    4,
  slPerMfsrKwh:    5,
  slInExcessPct:   6,
  slInExcessKwh:   7,
  systemsRate:     8,
  foregoneRevenue: 9,
  powerRate:       10,
  systemLoss:      11,
};
const TOTAL_COLS = 11;

function hdr(ws: ExcelJS.Worksheet, rowNum: number, col: number, txt: string, span = 1, opts: { size?: number; italic?: boolean } = {}) {
  const cell = ws.getCell(rowNum, col);
  cell.value     = txt;
  cell.font      = { bold: !opts.italic, italic: opts.italic, color: { argb: HEADER_FG }, size: opts.size ?? 10.5, name: 'Calibri' };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border    = { bottom: { style: 'thin', color: { argb: 'FF4A6080' } }, right: { style: 'hair', color: { argb: 'FF4A6080' } } };
  if (span > 1) ws.mergeCells(rowNum, col, rowNum, col + span - 1);
}

function buildSheet(ws: ExcelJS.Worksheet, months: SlMonthRecord[]) {
  const sorted = [...months].sort((a, b) => a.month - b.month);
  const year   = sorted[0]?.year ?? new Date().getFullYear();

  // Row 1 – Title
  ws.addRow([`SUMMARY OF SYSTEMS LOSSES — ${year}`]);
  ws.mergeCells(1, 1, 1, TOTAL_COLS);
  const titleCell = ws.getCell(1, 1);
  titleCell.font      = { bold: true, color: { argb: HEADER_FG }, size: 12, name: 'Calibri' };
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  titleCell.border    = { bottom: { style: 'medium', color: { argb: 'FF4A6080' } } };
  ws.getRow(1).height = 22;

  // Row 2 – Group headers
  ws.addRow([]);
  ws.getRow(2).height = 32;
  hdr(ws, 2, COLS.month,           '',                          1, { size: 10 });
  hdr(ws, 2, COLS.kwhPurchased,    'Kwh Purchased',             1, { size: 10 });
  hdr(ws, 2, COLS.slWithinCapKwh,  `SL within cap\n${SL_CAP_PCT}%`, 1, { size: 10 });
  hdr(ws, 2, COLS.slPerMfsrPct,    'SL per MFSR',               2, { size: 10 });
  hdr(ws, 2, COLS.slInExcessPct,   `SL in EXCESS\n${SL_CAP_PCT}% cap`, 2, { size: 10 });
  hdr(ws, 2, COLS.systemsRate,     'Systems Rate',              1, { size: 10 });
  hdr(ws, 2, COLS.foregoneRevenue, 'Foregone Revenue\nin Pesos', 1, { size: 10 });
  hdr(ws, 2, COLS.powerRate,       'Power Rate',                1, { size: 10 });
  hdr(ws, 2, COLS.systemLoss,      'System Loss\nin Pesos',     1, { size: 10 });

  // Row 3 – Unit sub-headers
  ws.addRow([]);
  ws.getRow(3).height = 16;
  const units: Record<number, string> = {
    [COLS.kwhPurchased]:   '(kwh)',
    [COLS.slWithinCapKwh]: '(kwh)',
    [COLS.slPerMfsrPct]:   '(%)',
    [COLS.slPerMfsrKwh]:   '(kwh)',
    [COLS.slInExcessPct]:  '(%)',
    [COLS.slInExcessKwh]:  '(kwh)',
  };
  for (let c = 1; c <= TOTAL_COLS; c++) {
    const cell = ws.getCell(3, c);
    cell.value     = units[c] ?? '';
    cell.font      = { italic: true, color: { argb: 'FFAABCCC' }, size: 9, name: 'Calibri' };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border    = { bottom: { style: 'medium', color: { argb: 'FF4A6080' } } };
  }

  // Row 4 – Year label
  ws.addRow([String(year)]);
  ws.mergeCells(4, 1, 4, TOTAL_COLS);
  const yearCell = ws.getCell(4, 1);
  yearCell.font      = { bold: true, size: 10.5, name: 'Calibri', color: { argb: 'FF2D4A8A' } };
  yearCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_BG } };
  yearCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  yearCell.border    = { bottom: { style: 'hair', color: { argb: 'FFD0D8E8' } } };
  ws.getRow(4).height = 18;

  // Month rows
  let totKwh = 0, totWithin = 0, totMfsrKwh = 0, totExcessKwh = 0;
  let totForgone = 0, totSysLoss = 0, totSysRate = 0, totPwrRate = 0, cnt = 0;

  sorted.forEach((m, idx) => {
    const c       = computeSlValues(m.inputs);
    const hasData = m.inputs.kwhPurchased > 0;
    const isAlt   = idx % 2 !== 0;
    const bgColor = isAlt ? ALT_BG : 'FFFFFFFF';

    const monthName = m.label.split(' ')[0]; // "January"
    const row = ws.addRow([
      monthName,
      hasData ? m.inputs.kwhPurchased      : null,
      hasData ? c.slWithinCapKwh           : null,
      hasData ? m.inputs.slPerMfsrPct      : null,
      hasData ? c.slPerMfsrKwh             : null,
      hasData ? c.slInExcessPct            : null,
      hasData ? c.slInExcessKwh            : null,
      hasData ? m.inputs.systemsRate       : null,
      hasData ? c.foregoneRevenuePesos     : null,
      hasData ? m.inputs.powerRate         : null,
      hasData ? c.systemLossPesos          : null,
    ]);
    row.height = 17;

    row.eachCell((cell, col) => {
      const isComputed = col === COLS.slWithinCapKwh || col === COLS.slPerMfsrKwh ||
                         col === COLS.slInExcessPct  || col === COLS.slInExcessKwh ||
                         col === COLS.foregoneRevenue || col === COLS.systemLoss;
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: isComputed ? COMPUTED_BG : bgColor } };
      cell.font   = { size: 10.5, name: 'Calibri', bold: isComputed };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD0D8E8' } }, right: { style: 'hair', color: { argb: 'FFD0D8E8' } } };
      if (col === COLS.month) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      } else if (col === COLS.slPerMfsrPct || col === COLS.slInExcessPct) {
        cell.numFmt    = '0.00"%"';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (col === COLS.systemsRate || col === COLS.powerRate) {
        cell.numFmt    = '0.0000';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (col === COLS.foregoneRevenue || col === COLS.systemLoss) {
        cell.numFmt    = '"₱"#,##0.00_);("₱"#,##0.00)';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.numFmt    = '#,##0_);(#,##0)';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    if (hasData) {
      totKwh       += m.inputs.kwhPurchased;
      totWithin    += c.slWithinCapKwh;
      totMfsrKwh   += c.slPerMfsrKwh;
      totExcessKwh += c.slInExcessKwh;
      totForgone   += c.foregoneRevenuePesos;
      totSysLoss   += c.systemLossPesos;
      totSysRate   += m.inputs.systemsRate;
      totPwrRate   += m.inputs.powerRate;
      cnt++;
    }
  });

  // To Date row
  const totMfsrPct   = totKwh > 0 ? (totMfsrKwh  / totKwh) * 100 : 0;
  const totExcessPct = totKwh > 0 ? (totExcessKwh / totKwh) * 100 : 0;
  const avgSysRate   = cnt > 0 ? totSysRate / cnt : 0;
  const avgPwrRate   = cnt > 0 ? totPwrRate / cnt : 0;

  const tdRow = ws.addRow([
    'To Date',
    cnt > 0 ? totKwh       : null,
    cnt > 0 ? totWithin    : null,
    cnt > 0 ? totMfsrPct   : null,
    cnt > 0 ? totMfsrKwh   : null,
    cnt > 0 ? totExcessPct : null,
    cnt > 0 ? totExcessKwh : null,
    cnt > 0 ? avgSysRate   : null,
    cnt > 0 ? totForgone   : null,
    cnt > 0 ? avgPwrRate   : null,
    cnt > 0 ? totSysLoss   : null,
  ]);
  tdRow.height = 18;
  tdRow.eachCell((cell, col) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_BG } };
    cell.font   = { bold: true, size: 10.5, name: 'Calibri' };
    cell.border = {
      top:    { style: 'medium', color: { argb: 'FF4A6080' } },
      bottom: { style: 'medium', color: { argb: 'FF4A6080' } },
    };
    if (col === COLS.month) {
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    } else if (col === COLS.slPerMfsrPct || col === COLS.slInExcessPct) {
      cell.numFmt    = '0.00"%"';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else if (col === COLS.systemsRate || col === COLS.powerRate) {
      cell.numFmt    = '0.0000';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else if (col === COLS.foregoneRevenue || col === COLS.systemLoss) {
      cell.numFmt    = '"₱"#,##0.00_);("₱"#,##0.00)';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else {
      cell.numFmt    = '#,##0_);(#,##0)';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
  });

  // Column widths
  ws.getColumn(COLS.month).width           = 13;
  ws.getColumn(COLS.kwhPurchased).width    = 15;
  ws.getColumn(COLS.slWithinCapKwh).width  = 14;
  ws.getColumn(COLS.slPerMfsrPct).width    = 11;
  ws.getColumn(COLS.slPerMfsrKwh).width    = 14;
  ws.getColumn(COLS.slInExcessPct).width   = 11;
  ws.getColumn(COLS.slInExcessKwh).width   = 14;
  ws.getColumn(COLS.systemsRate).width     = 13;
  ws.getColumn(COLS.foregoneRevenue).width = 22;
  ws.getColumn(COLS.powerRate).width       = 12;
  ws.getColumn(COLS.systemLoss).width      = 20;

  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 4, activeCell: 'B5' }];
}

export async function exportSlToExcel(months: SlMonthRecord[], filename?: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ledger Console';
  wb.created = new Date();

  const byYear = new Map<number, SlMonthRecord[]>();
  for (const m of months) {
    if (!byYear.has(m.year)) byYear.set(m.year, []);
    byYear.get(m.year)!.push(m);
  }
  for (const year of [...byYear.keys()].sort()) {
    buildSheet(wb.addWorksheet(String(year)), byYear.get(year)!);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = filename ?? 'ledger-console-sl.xlsx'; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadSlTemplate(): Promise<void> {
  const blank = SL_MONTHS_SEED.map((m) => ({ ...m, inputs: { kwhPurchased: 0, slPerMfsrPct: 0, systemsRate: 0, powerRate: 0 } }));
  await exportSlToExcel(blank, 'ledger-console-sl-template.xlsx');
}
