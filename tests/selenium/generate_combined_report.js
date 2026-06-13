const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const SELENIUM_JSON = path.join(__dirname, 'reports/selenium_results.json');
const APPIUM_JSON = path.join(__dirname, '../appium/reports/appium_results.json');
const OUTPUT_DIR = path.join(__dirname, '../../reports');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'OmniGuard_Combined_Test_Report.xlsx');

async function generateReport() {
    console.log("Generating Combined Excel Report...");
    
    let seleniumData = [];
    let appiumData = [];
    
    if (fs.existsSync(SELENIUM_JSON)) {
        seleniumData = JSON.parse(fs.readFileSync(SELENIUM_JSON, 'utf8'));
    } else {
        console.warn("Selenium JSON not found at", SELENIUM_JSON);
    }
    
    if (fs.existsSync(APPIUM_JSON)) {
        appiumData = JSON.parse(fs.readFileSync(APPIUM_JSON, 'utf8'));
    } else {
        console.warn("Appium JSON not found at", APPIUM_JSON);
    }
    
    // Add platform flag
    seleniumData = seleniumData.map(d => ({ ...d, platform: 'Web (Selenium)' }));
    appiumData = appiumData.map(d => ({ ...d, platform: 'Android (Appium)' }));
    
    const allResults = [...seleniumData, ...appiumData];
    
    if (allResults.length === 0) {
        console.error("No test results found!");
        return;
    }
    
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    const wb = new ExcelJS.Workbook();
    
    // ── Summary Sheet ──
    const wsSummary = wb.addWorksheet('Summary');
    wsSummary.properties.defaultRowHeight = 20;
    
    const total = allResults.length;
    const passed = allResults.filter(r => r.outcome === 'PASSED').length;
    const failed = allResults.filter(r => r.outcome === 'FAILED').length;
    const skipped = allResults.filter(r => r.outcome === 'SKIPPED').length;
    const passRate = total ? ((passed / total) * 100).toFixed(1) : 0;
    
    wsSummary.mergeCells('A1:F1');
    wsSummary.getCell('A1').value = 'OmniGuard — Combined Web & Android Test Report';
    wsSummary.getCell('A1').font = { name: 'Calibri', bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    wsSummary.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1120' } };
    wsSummary.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    wsSummary.getRow(1).height = 36;
    
    const kpis = [
        ['Total Tests', total],
        ['Passed', passed],
        ['Failed', failed],
        ['Skipped', skipped],
        ['Pass Rate', passRate + '%'],
    ];
    
    kpis.forEach((kpi, idx) => {
        wsSummary.getCell(`A${3 + idx}`).value = kpi[0];
        wsSummary.getCell(`A${3 + idx}`).font = { bold: true };
        wsSummary.getCell(`B${3 + idx}`).value = kpi[1];
    });
    
    wsSummary.getColumn('A').width = 20;
    wsSummary.getColumn('B').width = 20;
    
    // ── Details Sheet ──
    const wsDetails = wb.addWorksheet('Test Details');
    
    wsDetails.columns = [
        { header: '#', key: 'id', width: 6 },
        { header: 'Platform', key: 'platform', width: 20 },
        { header: 'Test ID / Node', key: 'nodeid', width: 50 },
        { header: 'Status', key: 'outcome', width: 15 },
        { header: 'Duration (s)', key: 'duration', width: 15 },
        { header: 'Error', key: 'error', width: 50 },
    ];
    
    // Style Header
    wsDetails.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsDetails.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1120' } };
    
    allResults.forEach((result, idx) => {
        const row = wsDetails.addRow({
            id: idx + 1,
            platform: result.platform,
            nodeid: result.nodeid,
            outcome: result.outcome,
            duration: result.duration,
            error: result.longrepr || ''
        });
        
        // Color status
        const statusCell = row.getCell('outcome');
        statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        statusCell.alignment = { horizontal: 'center' };
        if (result.outcome === 'PASSED') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
        } else if (result.outcome === 'FAILED') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
        } else {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
        }
    });
    
    wsDetails.autoFilter = 'A1:F1';
    
    await wb.xlsx.writeFile(OUTPUT_FILE);
    console.log(`\n✅ Combined Excel report saved to ${OUTPUT_FILE}`);
}

generateReport().catch(console.error);
