/**
 * OmniGuard — Jest Custom Reporter
 * ==================================
 * Collects per-test results and generates an Excel report
 * in tests/selenium/reports/ after the full run completes.
 *
 * onRunComplete() returns the Promise so Jest awaits file writing
 * before exiting (works because --forceExit is removed).
 */

'use strict';

const { generateExcelReport } = require('./utils/reportGenerator');

class ExcelReporter {
  constructor(globalConfig, reporterOptions) {
    this._globalConfig = globalConfig;
    this._options      = reporterOptions || {};
    this._results      = [];
  }

  /**
   * Called after each test FILE completes.
   */
  onTestResult(test, suiteResult) {
    const filePath  = test.path || test.testFilePath || (suiteResult && suiteResult.testFilePath) || '';
    const suiteName = require('path')
      .basename(filePath, '.test.js')
      .replace(/^test_\d+_/, '');   // e.g. "login"

    for (const r of suiteResult.testResults) {
      let outcome;
      if (r.status === 'passed')       outcome = 'PASSED';
      else if (r.status === 'failed')  outcome = 'FAILED';
      else                             outcome = 'SKIPPED';

      this._results.push({
        nodeid:   `${suiteName}::${r.fullName}`,
        outcome,
        duration: r.duration != null ? Number((r.duration / 1000).toFixed(3)) : 0,
        longrepr: r.failureMessages ? r.failureMessages.join('\n').slice(0, 500) : '',
      });
    }
  }

  onRunComplete(_contexts, _results) {
    if (this._results.length > 0) {
      const fs = require('fs');
      const path = require('path');
      const outPath = path.join(__dirname, 'reports', 'selenium_results.json');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(this._results, null, 2));
      console.log(`\n✅ Selenium results saved to ${outPath}`);
    }
    return Promise.resolve();
  }
}

module.exports = ExcelReporter;
