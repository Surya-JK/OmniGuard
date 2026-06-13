/**
 * OmniGuard — Excel Report Generator (Node.js / exceljs)
 * ========================================================
 * Produces a two-sheet styled .xlsx workbook after every Selenium run.
 *
 * Sheet 1 — Summary  : KPI boxes + colour bar chart
 * Sheet 2 — Details  : per-test row with status colour coding
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const ExcelJS = require('exceljs');

// ── Colour palette ────────────────────────────────────────────
const CLR = {
  PASS:    'FF22C55E',
  FAIL:    'FFEF4444',
  SKIP:    'FFF97316',
  HEADER:  'FF0B1120',
  ACCENT:  'FF00F0FF',
  ROW_A:   'FF0F172A',
  ROW_B:   'FF1E293B',
  WHITE:   'FFFFFFFF',
  MUTED:   'FF94A3B8',
  SLATE:   'FF1E293B',
  BORDER:  'FF334155',
  BLUE:    'FF3B82F6',
  GREEN:   'FF22C55E',
  RED:     'FFEF4444',
  ORANGE:  'FFF97316',
  PURPLE:  'FF8B5CF6',
  CYAN:    'FF06B6D4',
};

// ── Helpers ───────────────────────────────────────────────────
function solidFill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function thinBorder() {
  const s = { style: 'thin', color: { argb: CLR.BORDER } };
  return { top: s, left: s, bottom: s, right: s };
}

function hFont(size = 11, bold = true) {
  return { name: 'Calibri', size, bold, color: { argb: CLR.WHITE } };
}

function cFont(size = 10, bold = false, argb = CLR.WHITE) {
  return { name: 'Calibri', size, bold, color: { argb } };
}

function parseNodeid(nodeid) {
  const parts  = nodeid.split('::');
  const module = parts.length >= 2 ? parts[parts.length - 2] : 'unknown';
  const name   = (parts[parts.length - 1] || nodeid).replace(/\[.*\]/, '');
  return { module, name };
}

// ── Summary Sheet ─────────────────────────────────────────────
function writeSummary(wb, results, suiteName) {
  const ws = wb.addWorksheet('Summary');
  ws.views = [{ showGridLines: false }];

  const total    = results.length;
  const passed   = results.filter(r => r.outcome === 'PASSED').length;
  const failed   = results.filter(r => r.outcome === 'FAILED').length;
  const skipped  = results.filter(r => r.outcome === 'SKIPPED').length;
  const passRate = total ? ((passed / total) * 100).toFixed(1) : '0.0';
  const totalDur = results.reduce((s, r) => s + r.duration, 0).toFixed(2);

  // ── Title row ──
  ws.mergeCells('A1:F1');
  const titleCell = ws.getCell('A1');
  titleCell.value     = `OmniGuard — ${suiteName} Test Report`;
  titleCell.font      = { name: 'Calibri', size: 16, bold: true, color: { argb: CLR.ACCENT } };
  titleCell.fill      = solidFill(CLR.HEADER);
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  ws.mergeCells('A2:F2');
  const subCell = ws.getCell('A2');
  subCell.value     = `Generated: ${new Date().toLocaleString()}  |  Suite: ${suiteName}`;
  subCell.font      = { name: 'Calibri', size: 9, color: { argb: CLR.MUTED } };
  subCell.fill      = solidFill(CLR.HEADER);
  subCell.alignment = { horizontal: 'center' };

  // ── KPI boxes ──
  const kpis = [
    ['Total Tests', total,           CLR.BLUE],
    ['Passed',      passed,          CLR.GREEN],
    ['Failed',      failed,          CLR.RED],
    ['Skipped',     skipped,         CLR.ORANGE],
    ['Pass Rate',   `${passRate}%`,  CLR.PURPLE],
    ['Duration',    `${totalDur}s`,  CLR.CYAN],
  ];
  const cols = ['A','B','C','D','E','F'];

  kpis.forEach(([label, value, color], idx) => {
    const col = cols[idx];
    ws.mergeCells(`${col}4:${col}5`);
    ws.mergeCells(`${col}6:${col}7`);

    const lc = ws.getCell(`${col}4`);
    lc.value     = label;
    lc.fill      = solidFill(CLR.SLATE);
    lc.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: CLR.MUTED } };
    lc.alignment = { horizontal: 'center', vertical: 'middle' };

    const vc = ws.getCell(`${col}6`);
    vc.value     = value;
    vc.fill      = solidFill(CLR.HEADER);
    vc.font      = { name: 'Calibri', size: 20, bold: true, color: { argb: color } };
    vc.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getColumn(idx + 1).width = 18;
  });

  // Chart data or other summary elements can be added here in the future
}

// ── Details Sheet ─────────────────────────────────────────────
function writeDetails(wb, results) {
  const ws = wb.addWorksheet('Test Details');
  ws.views = [{ showGridLines: false, state: 'frozen', ySplit: 1 }];

  const headers    = ['#','Test ID','Module','Test Name','Status','Duration (s)','Error / Notes'];
  const colWidths  = [5,  14,        28,      42,         10,       14,            60];

  // Header row
  headers.forEach((h, i) => {
    const cell = ws.getCell(1, i + 1);
    cell.value     = h;
    cell.font      = hFont();
    cell.fill      = solidFill(CLR.HEADER);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border    = thinBorder();
    ws.getColumn(i + 1).width = colWidths[i];
  });
  ws.getRow(1).height = 28;

  // Auto-filter
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: results.length + 1, column: headers.length },
  };

  const statusFill = {
    PASSED:  CLR.PASS,
    FAILED:  CLR.FAIL,
    SKIPPED: CLR.SKIP,
    ERROR:   CLR.FAIL,
  };

  const rowFills = [CLR.ROW_A, CLR.ROW_B];

  results.forEach((result, idx) => {
    const rowNum  = idx + 2;
    const { module, name } = parseNodeid(result.nodeid);
    const rf = rowFills[idx % 2];

    const row = [
      idx + 1,
      `TC-${String(idx + 1).padStart(3, '0')}`,
      module,
      name,
      result.outcome,
      result.duration,
      (result.longrepr || '').slice(0, 500),
    ];

    row.forEach((val, ci) => {
      const cell = ws.getCell(rowNum, ci + 1);
      cell.value     = val;
      cell.fill      = solidFill(rf);
      cell.font      = cFont();
      cell.alignment = {
        horizontal: [0, 1, 4, 5].includes(ci) ? 'center' : 'left',
        vertical:   'middle',
        wrapText:   true,
      };
      cell.border = thinBorder();

      // Status cell
      if (ci === 4) {
        cell.fill = solidFill(statusFill[result.outcome] || rf);
        cell.font = cFont(10, true);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    ws.getRow(rowNum).height = 22;
  });
}

// ── Public API ────────────────────────────────────────────────
/**
 * Build and save the Excel report.
 *
 * @param {Array<{nodeid:string, outcome:string, duration:number, longrepr:string}>} results
 * @param {string} suiteName   - used in the filename and title
 * @param {string} [outputDir] - defaults to ./reports/
 * @returns {string} absolute path to the saved .xlsx file
 */
async function generateExcelReport(results, suiteName = 'OmniGuard', outputDir) {
  const dir = outputDir || path.join(__dirname, '..', 'reports');
  fs.mkdirSync(dir, { recursive: true });

  const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `OmniGuard_${suiteName}_Report_${ts}.xlsx`;
  const outPath  = path.join(dir, filename);

  const wb = new ExcelJS.Workbook();
  wb.creator   = 'OmniGuard Test Suite';
  wb.created   = new Date();
  wb.modified  = new Date();

  writeSummary(wb, results, suiteName);
  writeDetails(wb, results);

  await wb.xlsx.writeFile(outPath);
  console.log(`\n📊 Excel report saved → ${outPath}`);
  return outPath;
}

module.exports = { generateExcelReport };
