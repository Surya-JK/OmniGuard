/**
 * Test Suite 03 — Text Scan / Threat Analysis (Web)
 * OmniGuard Selenium E2E — Node.js / Jest
 *
 * TC-041  Paste Links card opens text input modal
 * TC-042  Modal shows "Inspect Payload" title
 * TC-043  Modal input has placeholder text
 * TC-044  Cancel button closes the modal
 * TC-045  Analyze button is present in modal
 * TC-046  Safe text → SYSTEM CLEAR result
 * TC-047  Scam message → THREAT INTERCEPTED result
 * TC-048  Phishing URL → THREAT INTERCEPTED result
 * TC-049  Safe text result shows green colour badge
 * TC-050  Threat result shows red colour badge
 * TC-051  Clear Terminal button dismisses result
 * TC-052  Electricity scam text → THREAT INTERCEPTED
 * TC-053  UPI impersonation text → THREAT INTERCEPTED
 * TC-054  Normal greeting text → SYSTEM CLEAR
 * TC-055  Long safe text → SYSTEM CLEAR
 * TC-056  SYSTEM CLEAR text appears in result
 * TC-057  THREAT INTERCEPTED text appears in result
 * TC-058  Result badge is visible after analysis
 * TC-059  Analyzing Forensics indicator appears briefly
 * TC-060  Dashboard returns cleanly after clearing result
 */

'use strict';

const { By, until } = require('selenium-webdriver');
const { buildDriver, loginWithTestAccount, returnHome } = require('../helpers/driverFactory');
const HomePage = require('../pages/HomePage');
const config   = require('../config');

let driver;
let home;

beforeAll(async () => {
  driver = await buildDriver();
  await loginWithTestAccount(driver);
  home = new HomePage(driver);
}, 120_000);

afterAll(async () => {
  if (driver) await driver.quit();
});

afterEach(async () => {
  // Always clear result and return to dashboard between tests
  await home.clickClear().catch(() => {});
  // Close modal if it was left open
  try {
    const cancelEl = await driver.findElement(
      By.xpath('//*[normalize-space(text())="Cancel"]'),
    );
    if (await cancelEl.isDisplayed()) await cancelEl.click();
  } catch (_) {}
});

// ── Test Cases ────────────────────────────────────────────────────────────────

test('TC-041 | Paste Links card opens text input modal', async () => {
  await home.waitForHome();
  await home.clickTextScan();

  const inputField = await driver.wait(
    until.elementLocated(home.loc.textModalInput),
    config.EXPLICIT_WAIT,
  );
  expect(await inputField.isDisplayed()).toBe(true);
});

test('TC-042 | Modal shows "Inspect Payload" title', async () => {
  await home.waitForHome();
  await home.clickTextScan();

  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[contains(text(),"Inspect Payload")]')),
    config.EXPLICIT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-043 | Modal input has placeholder text', async () => {
  await home.waitForHome();
  await home.clickTextScan();

  const input = await driver.wait(
    until.elementLocated(home.loc.textModalInput),
    config.EXPLICIT_WAIT,
  );
  const ph = await input.getAttribute('placeholder');
  expect(ph).not.toBeNull();
  expect(ph.length).toBeGreaterThan(0);
});

test('TC-044 | Cancel button closes the modal', async () => {
  await home.waitForHome();
  await home.clickTextScan();
  await driver.wait(until.elementLocated(home.loc.textModalInput), config.EXPLICIT_WAIT);

  const cancelBtn = await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="Cancel"]')),
    config.SHORT_WAIT,
  );
  await cancelBtn.click();

  // Modal should disappear; dashboard should be visible
  expect(await home.isHomeVisible()).toBe(true);
});

test('TC-045 | Analyze button is present in modal', async () => {
  await home.waitForHome();
  await home.clickTextScan();
  await driver.wait(until.elementLocated(home.loc.textModalInput), config.EXPLICIT_WAIT);

  const analyzeEl = await driver.wait(
    until.elementLocated(home.loc.analyzeBtn),
    config.SHORT_WAIT,
  );
  expect(await analyzeEl.isDisplayed()).toBe(true);
});

test('TC-046 | Safe text analysis shows SYSTEM CLEAR', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SAFE_TEXT);
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('SAFE');
}, 60_000);

test('TC-047 | Scam message shows THREAT INTERCEPTED', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SCAM_TEXT);
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('DANGER');
}, 60_000);

test('TC-048 | Phishing URL shows THREAT INTERCEPTED', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.PHISHING_URL_TEXT);
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('DANGER');
}, 60_000);

test('TC-049 | SYSTEM CLEAR badge is visible for safe text', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SAFE_TEXT);
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('SAFE');
  const el = await driver.findElement(home.loc.resultSafe);
  expect(await el.isDisplayed()).toBe(true);
}, 60_000);

test('TC-050 | THREAT INTERCEPTED badge is visible for scam text', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SCAM_TEXT);
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('DANGER');
  const el = await driver.findElement(home.loc.resultDanger);
  expect(await el.isDisplayed()).toBe(true);
}, 60_000);

test('TC-051 | Clear Terminal button dismisses the result', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SAFE_TEXT);
  await home.waitForResult(config.LONG_WAIT);
  await home.clickClear();
  // After clearing, the result badge should be gone
  const dangers = await driver.findElements(home.loc.resultDanger);
  const safes   = await driver.findElements(home.loc.resultSafe);
  expect(dangers.length + safes.length).toBe(0);
}, 60_000);

test('TC-052 | Electricity disconnect scam → THREAT INTERCEPTED', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(
    'Your electricity connection will be disconnected. Pay immediately at http://electricity-pay.com',
  );
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('DANGER');
}, 60_000);

test('TC-053 | UPI impersonation text → THREAT INTERCEPTED', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(
    'Send ₹5000 urgently to UPI: scammer@ybl for KYC verification or your account will be blocked.',
  );
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('DANGER');
}, 60_000);

test('TC-054 | Normal greeting text → SYSTEM CLEAR', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze("Hi! How are you doing? Let's catch up soon.");
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('SAFE');
}, 60_000);

test('TC-055 | Long safe paragraph text → SYSTEM CLEAR', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(
    'The weather today is quite pleasant. I went for a walk in the park and saw many people enjoying the sunshine. The flowers were blooming and the air smelled fresh.',
  );
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('SAFE');
}, 60_000);

test('TC-056 | SYSTEM CLEAR text appears inside result badge', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SAFE_TEXT);
  await home.waitForResult(config.LONG_WAIT);
  const el   = await driver.findElement(home.loc.resultSafe);
  const text = await el.getText();
  expect(text).toContain('SYSTEM CLEAR');
}, 60_000);

test('TC-057 | THREAT INTERCEPTED text appears inside result badge', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SCAM_TEXT);
  await home.waitForResult(config.LONG_WAIT);
  const el   = await driver.findElement(home.loc.resultDanger);
  const text = await el.getText();
  expect(text).toContain('THREAT INTERCEPTED');
}, 60_000);

test('TC-058 | Result badge is displayed after analysis completes', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SAFE_TEXT);
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(['SAFE', 'DANGER']).toContain(result);
}, 60_000);

test('TC-059 | Modal input accepts multi-line text', async () => {
  await home.waitForHome();
  await home.clickTextScan();
  const input = await driver.wait(
    until.elementLocated(home.loc.textModalInput),
    config.EXPLICIT_WAIT,
  );
  const testText = 'Line one\nLine two\nLine three';
  await input.clear();
  await input.sendKeys(testText);
  const value = await input.getAttribute('value');
  expect(value.length).toBeGreaterThan(0);
});

test('TC-060 | Dashboard returns cleanly after clearing result', async () => {
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SAFE_TEXT);
  await home.waitForResult(config.LONG_WAIT);
  await home.clickClear();
  expect(await home.isHomeVisible()).toBe(true);
}, 60_000);
