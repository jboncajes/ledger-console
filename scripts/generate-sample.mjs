import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'ledger-console-sample.xlsx');

// Monthly inputs (actual peso values, not millions)
// Designed to look like a real Philippine distribution utility
const months2025 = [
  { label: 'January 2025',   opRev: 258_400_000, othRev: 9_200_000,  power: 168_500_000, distrib: 19_800_000, supply: 10_100_000, meter: 4_300_000, adg: 6_900_000, deprec: 12_700_000, interest: 6_400_000, nonOpRev: 2_100_000, nonOpExp: 900_000,   rfsc: 7_800_000 },
  { label: 'February 2025',  opRev: 245_100_000, othRev: 8_700_000,  power: 159_200_000, distrib: 18_600_000, supply: 9_500_000,  meter: 4_100_000, adg: 6_400_000, deprec: 12_700_000, interest: 6_400_000, nonOpRev: 1_900_000, nonOpExp: 800_000,   rfsc: 7_800_000 },
  { label: 'March 2025',     opRev: 271_800_000, othRev: 10_500_000, power: 177_300_000, distrib: 20_900_000, supply: 10_700_000, meter: 4_500_000, adg: 7_200_000, deprec: 12_700_000, interest: 6_400_000, nonOpRev: 2_300_000, nonOpExp: 1_000_000,  rfsc: 7_800_000 },
  { label: 'April 2025',     opRev: 289_600_000, othRev: 11_200_000, power: 191_400_000, distrib: 21_800_000, supply: 11_200_000, meter: 4_700_000, adg: 7_600_000, deprec: 12_700_000, interest: 6_300_000, nonOpRev: 2_500_000, nonOpExp: 1_100_000,  rfsc: 7_800_000 },
  { label: 'May 2025',       opRev: 302_100_000, othRev: 11_900_000, power: 200_700_000, distrib: 22_400_000, supply: 11_500_000, meter: 4_800_000, adg: 7_900_000, deprec: 12_700_000, interest: 6_300_000, nonOpRev: 2_600_000, nonOpExp: 1_200_000,  rfsc: 8_100_000 },
  { label: 'June 2025',      opRev: 284_300_000, othRev: 10_800_000, power: 186_500_000, distrib: 21_300_000, supply: 10_900_000, meter: 4_600_000, adg: 7_400_000, deprec: 12_700_000, interest: 6_300_000, nonOpRev: 2_200_000, nonOpExp: 1_000_000,  rfsc: 8_100_000 },
  { label: 'July 2025',      opRev: 276_900_000, othRev: 10_300_000, power: 181_200_000, distrib: 20_700_000, supply: 10_600_000, meter: 4_500_000, adg: 7_100_000, deprec: 12_800_000, interest: 6_200_000, nonOpRev: 2_100_000, nonOpExp: 950_000,    rfsc: 8_100_000 },
  { label: 'August 2025',    opRev: 279_400_000, othRev: 10_600_000, power: 183_100_000, distrib: 21_000_000, supply: 10_700_000, meter: 4_500_000, adg: 7_200_000, deprec: 12_800_000, interest: 6_200_000, nonOpRev: 2_200_000, nonOpExp: 980_000,    rfsc: 8_100_000 },
  { label: 'September 2025', opRev: 265_700_000, othRev: 9_900_000,  power: 173_400_000, distrib: 20_100_000, supply: 10_300_000, meter: 4_400_000, adg: 6_900_000, deprec: 12_800_000, interest: 6_200_000, nonOpRev: 2_000_000, nonOpExp: 900_000,    rfsc: 8_100_000 },
  { label: 'October 2025',   opRev: 261_200_000, othRev: 9_600_000,  power: 170_200_000, distrib: 19_700_000, supply: 10_100_000, meter: 4_300_000, adg: 6_700_000, deprec: 12_800_000, interest: 6_100_000, nonOpRev: 1_900_000, nonOpExp: 850_000,    rfsc: 8_400_000 },
  { label: 'November 2025',  opRev: 256_800_000, othRev: 9_400_000,  power: 167_100_000, distrib: 19_400_000, supply: 9_900_000,  meter: 4_200_000, adg: 6_600_000, deprec: 12_800_000, interest: 6_100_000, nonOpRev: 1_800_000, nonOpExp: 820_000,    rfsc: 8_400_000 },
  { label: 'December 2025',  opRev: 268_500_000, othRev: 10_100_000, power: 175_800_000, distrib: 20_300_000, supply: 10_400_000, meter: 4_400_000, adg: 7_000_000, deprec: 12_800_000, interest: 6_100_000, nonOpRev: 2_000_000, nonOpExp: 900_000,    rfsc: 8_400_000 },
];

const months2026 = [
  { label: 'January 2026',   opRev: 272_100_000, othRev: 9_800_000,  power: 174_600_000, distrib: 20_500_000, supply: 10_500_000, meter: 4_400_000, adg: 7_100_000, deprec: 13_100_000, interest: 5_900_000, nonOpRev: 2_200_000, nonOpExp: 950_000,    rfsc: 8_600_000 },
  { label: 'February 2026',  opRev: 259_300_000, othRev: 9_300_000,  power: 165_800_000, distrib: 19_300_000, supply: 9_800_000,  meter: 4_200_000, adg: 6_700_000, deprec: 13_100_000, interest: 5_900_000, nonOpRev: 2_000_000, nonOpExp: 880_000,    rfsc: 8_600_000 },
  { label: 'March 2026',     opRev: 285_700_000, othRev: 11_000_000, power: 184_200_000, distrib: 21_600_000, supply: 11_000_000, meter: 4_600_000, adg: 7_500_000, deprec: 13_100_000, interest: 5_900_000, nonOpRev: 2_400_000, nonOpExp: 1_050_000,  rfsc: 8_600_000 },
];

function compute(m) {
  const totalRev = m.opRev + m.othRev;
  const om = m.distrib + m.supply + m.meter + m.adg;
  const opMargin = totalRev - m.power - om;
  const netOpMargin = opMargin - m.deprec - m.interest;
  const netMargin = netOpMargin + m.nonOpRev - m.nonOpExp;
  const totalMargin = netMargin + m.rfsc;
  return { totalRev, om, opMargin, netOpMargin, netMargin, totalMargin };
}

const HEADER_BG = 'FF1E2A3A';
const HEADER_FG = 'FFFFFFFF';
const COMPUTED_BG = 'FFE8EEF8';
const ALT_BG = 'FFF7F9FC';

function buildSheet(ws, months) {
  const headerRow = ws.addRow(['Line Item', ...months.map(m => m.label)]);
  headerRow.height = 24;
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: HEADER_FG }, size: 11, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF4A6080' } } };
  });
  headerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  const rows = [
    { label: 'Operating Revenue',                       values: months.map(m => m.opRev),                         computed: false },
    { label: 'Other Revenue',                           values: months.map(m => m.othRev),                        computed: false },
    { label: 'Total Revenue',                           values: months.map(m => compute(m).totalRev),             computed: true  },
    { label: 'Total Power Purchased',                   values: months.map(m => m.power),                         computed: false },
    { label: 'Distribution Expenses',                   values: months.map(m => m.distrib),                       computed: false },
    { label: 'Supply Expenses',                         values: months.map(m => m.supply),                        computed: false },
    { label: 'Metering Expenses',                       values: months.map(m => m.meter),                         computed: false },
    { label: 'Administrative And General Expenses',     values: months.map(m => m.adg),                           computed: false },
    { label: 'Total Operating and Maintenance Expense', values: months.map(m => compute(m).om),                   computed: true  },
    { label: 'Operating Margin',                        values: months.map(m => compute(m).opMargin),             computed: true  },
    { label: 'Depreciation',                            values: months.map(m => m.deprec),                        computed: false },
    { label: 'Interest Expense',                        values: months.map(m => m.interest),                      computed: false },
    { label: 'Net Operating Margin',                    values: months.map(m => compute(m).netOpMargin),          computed: true  },
    { label: 'Non-Operating Revenue',                   values: months.map(m => m.nonOpRev),                      computed: false },
    { label: 'Non-Operating Expense',                   values: months.map(m => m.nonOpExp),                      computed: false },
    { label: 'Net Margin',                              values: months.map(m => compute(m).netMargin),            computed: true  },
    { label: 'RFSC',                                    values: months.map(m => m.rfsc),                          computed: false },
    { label: 'Total Margin (Gross of RFSC)',             values: months.map(m => compute(m).totalMargin),          computed: true  },
  ];

  rows.forEach((item, idx) => {
    const row = ws.addRow([item.label, ...item.values]);
    row.height = 18;
    const isAlt = !item.computed && idx % 2 === 0;
    const bgColor = item.computed ? COMPUTED_BG : isAlt ? ALT_BG : 'FFFFFFFF';
    row.eachCell((cell, colNum) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font = { bold: item.computed, size: 10.5, name: 'Calibri' };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD0D8E8' } } };
      if (colNum === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: item.computed ? 0 : 1 };
      } else {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
    if (item.computed) {
      row.eachCell(cell => {
        cell.border = {
          ...cell.border,
          top:    { style: 'thin', color: { argb: 'FF9AAEC8' } },
          bottom: { style: 'thin', color: { argb: 'FF9AAEC8' } },
        };
      });
    }
  });

  ws.getColumn(1).width = 36;
  for (let c = 2; c <= months.length + 1; c++) ws.getColumn(c).width = 17;
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, activeCell: 'B2' }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: months.length + 1 } };
}

const wb = new ExcelJS.Workbook();
wb.creator = 'Ledger Console';
wb.created = new Date();

buildSheet(wb.addWorksheet('2025'), months2025);
buildSheet(wb.addWorksheet('2026'), months2026);

await wb.xlsx.writeFile(OUT);
console.log('Sample file written to:', OUT);
