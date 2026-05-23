import ExcelJS from 'exceljs';
import type { MonthRecord } from '../types/pnl';
import { computePeriod, MONTHS_SEED } from './pnl';

const HEADER_BG = 'FF1E2A3A';
const HEADER_FG = 'FFFFFFFF';
const COMPUTED_BG = 'FFE8EEF8';
const ALT_BG = 'FFF7F9FC';

interface LineItemDef {
  label: string;
  get: (m: MonthRecord) => number;
  computed: boolean;
}

const LINE_ITEMS: LineItemDef[] = [
  { label: 'Operating Revenue',                        get: (m) => m.inputs.opRev,                              computed: false },
  { label: 'Other Revenue',                            get: (m) => m.inputs.othRev,                             computed: false },
  { label: 'Total Revenue',                            get: (m) => computePeriod(m.inputs).totalRev,            computed: true  },
  { label: 'Total Power Purchased',                    get: (m) => m.inputs.power,                              computed: false },
  { label: 'Distribution Expenses',                    get: (m) => m.inputs.distrib,                            computed: false },
  { label: 'Supply Expenses',                          get: (m) => m.inputs.supply,                             computed: false },
  { label: 'Metering Expenses',                        get: (m) => m.inputs.meter,                              computed: false },
  { label: 'Administrative And General Expenses',      get: (m) => m.inputs.adg,                                computed: false },
  { label: 'Total Operating and Maintenance Expense',  get: (m) => computePeriod(m.inputs).om,                  computed: true  },
  { label: 'Operating Margin',                         get: (m) => computePeriod(m.inputs).opMargin,            computed: true  },
  { label: 'Depreciation',                             get: (m) => m.inputs.deprec,                             computed: false },
  { label: 'Interest Expense',                         get: (m) => m.inputs.interest,                           computed: false },
  { label: 'Net Operating Margin',                     get: (m) => computePeriod(m.inputs).netOpMargin,         computed: true  },
  { label: 'Non-Operating Revenue',                    get: (m) => m.inputs.nonOpRev,                           computed: false },
  { label: 'Non-Operating Expense',                    get: (m) => m.inputs.nonOpExp,                           computed: false },
  { label: 'Net Margin',                               get: (m) => computePeriod(m.inputs).netMargin,           computed: true  },
  { label: 'RFSC',                                     get: (m) => m.inputs.rfsc,                               computed: false },
  { label: 'Total Margin (Gross of RFSC)',              get: (m) => computePeriod(m.inputs).totalMargin,         computed: true  },
];

export async function exportToExcel(months: MonthRecord[], filename?: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ledger Console';
  wb.created = new Date();

  const byYear = new Map<number, MonthRecord[]>();
  for (const m of months) {
    if (!byYear.has(m.year)) byYear.set(m.year, []);
    byYear.get(m.year)!.push(m);
  }

  for (const year of [...byYear.keys()].sort()) {
    const yearMonths = byYear.get(year)!.sort((a, b) => a.month - b.month);
    const ws = wb.addWorksheet(String(year));

    // ── Header row ──────────────────────────────────────────────────────────
    const headerRow = ws.addRow(['Line Item', ...yearMonths.map((m) => m.label)]);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: HEADER_FG }, size: 11, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF4A6080' } },
      };
    });
    headerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    // ── Data rows ────────────────────────────────────────────────────────────
    LINE_ITEMS.forEach((item, idx) => {
      const values = yearMonths.map((m) => item.get(m));
      const row = ws.addRow([item.label, ...values]);
      row.height = 18;

      const isAlt = !item.computed && idx % 2 === 0;
      const bgColor = item.computed ? COMPUTED_BG : isAlt ? ALT_BG : 'FFFFFFFF';

      row.eachCell((cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = {
          bold: item.computed,
          size: 10.5,
          name: 'Calibri',
        };
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFD0D8E8' } },
        };

        if (colNum === 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: item.computed ? 0 : 1 };
        } else {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });

      // Extra top border before every computed row to visually separate sections
      if (item.computed) {
        row.eachCell((cell) => {
          cell.border = {
            ...cell.border,
            top: { style: 'thin', color: { argb: 'FF9AAEC8' } },
            bottom: { style: 'thin', color: { argb: 'FF9AAEC8' } },
          };
        });
      }
    });

    // ── Column widths ────────────────────────────────────────────────────────
    ws.getColumn(1).width = 30;
    for (let c = 2; c <= yearMonths.length + 1; c++) {
      ws.getColumn(c).width = 17;
    }

    // ── Freeze first column and header row ───────────────────────────────────
    ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, activeCell: 'B2' }];

    // ── Auto-filter on header ────────────────────────────────────────────────
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: yearMonths.length + 1 },
    };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `ledger-console-${new Date().getFullYear()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadTemplate(): Promise<void> {
  const blank: MonthRecord[] = MONTHS_SEED.map((m) => ({
    ...m,
    inputs: { opRev: 0, othRev: 0, power: 0, distrib: 0, supply: 0, meter: 0, adg: 0, deprec: 0, interest: 0, nonOpRev: 0, nonOpExp: 0, rfsc: 0 },
  }));
  await exportToExcel(blank, 'ledger-console-template.xlsx');
}
