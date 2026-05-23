import ExcelJS from 'exceljs';
import type { DsmMonthRecord } from '../types/pnl';
import { computeDsmPeriod, DSM_MONTHS_SEED } from './dsm';

const HEADER_BG   = 'FF1E2A3A';
const HEADER_FG   = 'FFFFFFFF';
const COMPUTED_BG = 'FFE8EEF8';
const ALT_BG      = 'FFF7F9FC';
const SECTION_BG  = 'FFEEF4FF';

interface LineItem {
  label: string;
  get: (m: DsmMonthRecord) => number;
  computed: boolean;
  section?: boolean;
}

const LINE_ITEMS: LineItem[] = [
  // Revenue
  { label: 'Distribution Revenue',         get: (m) => m.inputs.distribRev,                         computed: false },
  { label: 'Supply Revenue',               get: (m) => m.inputs.supplyRev,                          computed: false },
  { label: 'Metering Revenue',             get: (m) => m.inputs.meterRev,                           computed: false },
  { label: 'Other Operating Revenue',      get: (m) => m.inputs.otherOpRev,                         computed: false },
  { label: 'Other Non-Operating Revenue',  get: (m) => m.inputs.otherNonOpRev,                      computed: false },
  { label: 'Total DSM Revenue',            get: (m) => computeDsmPeriod(m.inputs).totalRev,         computed: true  },
  // Expenses
  { label: 'Distribution Expenses',        get: (m) => m.inputs.distribExp,                         computed: false },
  { label: 'Supply Expenses',              get: (m) => m.inputs.supplyExp,                          computed: false },
  { label: 'Metering Expenses',            get: (m) => m.inputs.meterExp,                           computed: false },
  { label: 'Administrative and General Expenses', get: (m) => m.inputs.adgExp,                      computed: false },
  { label: 'Total DSM Expenses',           get: (m) => computeDsmPeriod(m.inputs).totalExp,         computed: true  },
  // Bottom line
  { label: 'Net Savings',                  get: (m) => computeDsmPeriod(m.inputs).netSavings,       computed: true  },
];

function buildSheet(ws: ExcelJS.Worksheet, months: DsmMonthRecord[]) {
  const headerRow = ws.addRow(['Line Item', ...months.map((m) => m.label)]);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: HEADER_FG }, size: 11, name: 'Calibri' };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border    = { bottom: { style: 'medium', color: { argb: 'FF4A6080' } } };
  });
  headerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  // Section header rows (visual separators)
  const addSection = (title: string) => {
    const row = ws.addRow([title]);
    row.height = 20;
    row.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_BG } };
      cell.font      = { bold: true, size: 10.5, name: 'Calibri', color: { argb: 'FF2D4A8A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });
  };

  LINE_ITEMS.forEach((item, idx) => {
    if (idx === 6) addSection('EXPENSES');

    const values = months.map((m) => item.get(m));
    const row = ws.addRow([item.label, ...values]);
    row.height = 18;

    const isAlt = !item.computed && idx % 2 === 0;
    const bgColor = item.computed ? COMPUTED_BG : isAlt ? ALT_BG : 'FFFFFFFF';

    row.eachCell((cell, colNum) => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font   = { bold: item.computed, size: 10.5, name: 'Calibri' };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD0D8E8' } } };
      if (colNum === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: item.computed ? 0 : 1 };
      } else {
        cell.numFmt    = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    if (item.computed) {
      row.eachCell((cell) => {
        cell.border = { ...cell.border,
          top:    { style: 'thin', color: { argb: 'FF9AAEC8' } },
          bottom: { style: 'thin', color: { argb: 'FF9AAEC8' } },
        };
      });
    }
  });

  ws.getColumn(1).width = 32;
  for (let c = 2; c <= months.length + 1; c++) ws.getColumn(c).width = 18;
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, activeCell: 'B2' }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: months.length + 1 } };
}

export async function exportDsmToExcel(months: DsmMonthRecord[], filename?: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ledger Console';
  wb.created = new Date();

  const byYear = new Map<number, DsmMonthRecord[]>();
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
  a.href = url; a.download = filename ?? 'ledger-console-dsm.xlsx'; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadDsmTemplate(): Promise<void> {
  const blank = DSM_MONTHS_SEED.map((m) => ({ ...m, inputs: { distribRev: 0, supplyRev: 0, meterRev: 0, otherOpRev: 0, otherNonOpRev: 0, distribExp: 0, supplyExp: 0, meterExp: 0, adgExp: 0 } }));
  await exportDsmToExcel(blank, 'ledger-console-dsm-template.xlsx');
}
