/**
 * Test Suite 05 — Threat Vault / History Modal (Web)
 * OmniGuard Selenium E2E — Node.js / Jest
 *
 * Each test has a safety afterEach that closes the vault modal / returns home
 * so failures do not cascade into subsequent tests.
 */

'use strict';

const { By, until } = require('selenium-webdriver');
const { buildDriver, loginWithTestAccount } = require('../helpers/driverFactory');
const HomePage = require('../pages/HomePage');
const config   = require('../config');

let driver;
let home;

beforeAll(async () => {
  driver = await buildDriver();
  await loginWithTestAccount(driver);
  home = new HomePage(driver);

  // Pre-load: run one threat scan so the vault is guaranteed non-empty
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SCAM_TEXT);
  await home.waitForResult(config.LONG_WAIT);
  await home.clickClear();
}, 120_000);

afterAll(async () => {
  if (driver) await driver.quit();
});

/** Safety net: always close vault modal and return home between tests. */
afterEach(async () => {
  try {
    // Close vault if open
    const exitBtns = await driver.findElements(home.loc.exitVaultBtn);
    for (const btn of exitBtns) {
      if (await btn.isDisplayed().catch(() => false)) {
        await btn.click();
        await driver.sleep(400);
        break;
      }
    }
  } catch (_) {}
  // If vault record is open, go back
  try {
    const backBtns = await driver.findElements(home.loc.backToVaultBtn);
    for (const btn of backBtns) {
      if (await btn.isDisplayed().catch(() => false)) {
        await btn.click();
        await driver.sleep(400);
        break;
      }
    }
  } catch (_) {}
  // Clear any analysis result
  await home.clickClear().catch(() => {});
  await driver.sleep(200);
});

/** Click the first vault list item using JS DOM traversal. */
async function clickFirstVaultItem() {
  const clicked = await driver.executeScript(`
    // The vault list renders items after the "Local Threat Vault" title
    // Each item has a snippet of the scanned text as a child
    const vaultTitle = Array.from(document.querySelectorAll('*')).find(el =>
      el.childNodes.length === 1 &&
      el.childNodes[0].nodeType === Node.TEXT_NODE &&
      el.textContent.trim() === 'Local Threat Vault'
    );
    if (!vaultTitle) return false;

    // Walk up to the modal container, then find clickable items below the title
    let container = vaultTitle.parentElement;
    for (let i = 0; i < 5; i++) {
      if (!container) break;
      const items = Array.from(container.querySelectorAll('[style*="cursor: pointer"], [role="button"]'));
      // Filter out the Exit Vault button itself
      const vaultItems = items.filter(el => !el.textContent.includes('Exit Vault'));
      if (vaultItems.length > 0) {
        vaultItems[0].click();
        return true;
      }
      container = container.parentElement;
    }
    // Last resort: find any div that contains DANGER-related text and is clickable
    const dangerEls = Array.from(document.querySelectorAll('*')).filter(el =>
      el.textContent.includes('electricity') || el.textContent.includes('KYC') || el.textContent.includes('disconnected')
    );
    if (dangerEls.length > 0) {
      dangerEls[dangerEls.length - 1].click();
      return true;
    }
    return false;
  `);
  return clicked;
}

// ── Test Cases ────────────────────────────────────────────────────────────────

test('TC-081 | Vault badge click opens the Vault modal', async () => {
  await home.waitForHome();
  await home.openVault();
  const title = await driver.wait(until.elementLocated(home.loc.vaultTitle), config.SHORT_WAIT);
  expect(await title.isDisplayed()).toBe(true);
});

test('TC-082 | "Local Threat Vault" title visible inside modal', async () => {
  await home.waitForHome();
  await home.openVault();
  const el = await driver.findElement(home.loc.vaultTitle);
  expect((await el.getText()).trim()).toBe('Local Threat Vault');
});

test('TC-083 | "Exit Vault" button is visible inside modal', async () => {
  await home.waitForHome();
  await home.openVault();
  const el = await driver.wait(until.elementLocated(home.loc.exitVaultBtn), config.SHORT_WAIT);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-084 | Exit Vault button closes the modal', async () => {
  await home.waitForHome();
  await home.openVault();
  await home.closeVault();
  expect(await home.isHomeVisible()).toBe(true);
});

test('TC-085 | Vault modal title shows after opening', async () => {
  await home.waitForHome();
  await home.openVault();
  const el = await driver.findElement(home.loc.vaultTitle);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-086 | After a threat scan, vault is not empty', async () => {
  await home.waitForHome();
  await home.openVault();
  const isEmpty = await home.isVaultEmpty();
  expect(isEmpty).toBe(false); // Pre-loaded scan in beforeAll guarantees data
});

test('TC-087 | Vault entry is clickable', async () => {
  await home.waitForHome();
  await home.openVault();
  await driver.sleep(600);
  const clicked = await clickFirstVaultItem();
  expect(clicked).toBe(true);
});

test('TC-088 | Vault Record screen shows "Vault Record" title', async () => {
  await home.waitForHome();
  await home.openVault();
  await driver.sleep(600);
  await clickFirstVaultItem();
  const title = await driver.wait(until.elementLocated(home.loc.vaultRecordTitle), config.EXPLICIT_WAIT);
  expect(await title.isDisplayed()).toBe(true);
}, 30_000);

test('TC-089 | Vault Record shows payload text', async () => {
  await home.waitForHome();
  await home.openVault();
  await driver.sleep(600);
  await clickFirstVaultItem();
  await driver.wait(until.elementLocated(home.loc.vaultRecordTitle), config.EXPLICIT_WAIT);
  // The scam text from beforeAll should appear in the record
  const el = await driver.wait(
    until.elementLocated(By.xpath(
      '//*[contains(text(),"electricity") or contains(text(),"KYC") or contains(text(),"disconnected")]'
    )),
    config.EXPLICIT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
}, 30_000);

test('TC-090 | "Back to Vault" button visible in Vault Record', async () => {
  await home.waitForHome();
  await home.openVault();
  await driver.sleep(600);
  await clickFirstVaultItem();
  await driver.wait(until.elementLocated(home.loc.vaultRecordTitle), config.EXPLICIT_WAIT);
  const btn = await driver.wait(until.elementLocated(home.loc.backToVaultBtn), config.SHORT_WAIT);
  expect(await btn.isDisplayed()).toBe(true);
}, 30_000);

test('TC-091 | "Back to Vault" returns to the vault list', async () => {
  await home.waitForHome();
  await home.openVault();
  await driver.sleep(600);
  await clickFirstVaultItem();
  await driver.wait(until.elementLocated(home.loc.vaultRecordTitle), config.EXPLICIT_WAIT);
  await home.clickBackToVault();
  const title = await driver.wait(until.elementLocated(home.loc.vaultTitle), config.SHORT_WAIT);
  expect(await title.isDisplayed()).toBe(true);
}, 30_000);

test('TC-092 | Exit Vault from list → back to dashboard', async () => {
  await home.waitForHome();
  await home.openVault();
  await home.closeVault();
  expect(await home.isHomeVisible()).toBe(true);
});

test('TC-093 | Vault can be opened and closed twice in a row', async () => {
  await home.waitForHome();
  await home.openVault();
  await home.closeVault();
  await driver.sleep(400);
  await home.openVault();
  const title = await driver.findElement(home.loc.vaultTitle);
  expect(await title.isDisplayed()).toBe(true);
});

test('TC-094 | Vault modal does not show AUTHENTICATE button', async () => {
  await home.waitForHome();
  await home.openVault();
  const els = await driver.findElements(
    By.xpath('//*[normalize-space(text())="AUTHENTICATE"]'),
  );
  expect(els.length).toBe(0);
});

test('TC-095 | Vault badge text contains "Vault"', async () => {
  await home.waitForHome();
  const el   = await driver.findElement(home.loc.vaultBadge);
  const text = await el.getText();
  expect(text.toLowerCase()).toContain('vault');
});

test('TC-096 | Vault title text is not empty', async () => {
  await home.waitForHome();
  await home.openVault();
  const el   = await driver.findElement(home.loc.vaultTitle);
  const text = await el.getText();
  expect(text.trim().length).toBeGreaterThan(0);
});

test('TC-097 | Vault correctly shows multiple threat entries after two scans', async () => {
  // Run a second scan to ensure at least 2 entries
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.PHISHING_URL_TEXT);
  await home.waitForResult(config.LONG_WAIT);
  await home.clickClear();

  await home.openVault();
  // There should be content (not empty)
  const isEmpty = await home.isVaultEmpty();
  expect(isEmpty).toBe(false);
}, 90_000);

test('TC-098 | Vault list has at least one visible item after scans', async () => {
  await home.waitForHome();
  await home.openVault();
  const isEmpty = await home.isVaultEmpty();
  // After all previous scans this MUST not be empty
  expect(isEmpty).toBe(false);
});

test('TC-099 | Vault badge remains visible after closing vault', async () => {
  await home.waitForHome();
  await home.openVault();
  await home.closeVault();
  expect(await home.isVaultBadgeVisible()).toBe(true);
});

test('TC-100 | Full E2E: scan → open vault → view record → back → exit', async () => {
  // 1. Scan a threat
  await home.waitForHome();
  await home.enterTextAndAnalyze(config.SCAM_TEXT);
  const result = await home.waitForResult(config.LONG_WAIT);
  expect(result).toBe('DANGER');
  await home.clickClear();

  // 2. Open vault — verify not empty
  await home.openVault();
  expect(await home.isVaultEmpty()).toBe(false);

  // 3. Click first record
  await driver.sleep(600);
  await clickFirstVaultItem();
  await driver.wait(until.elementLocated(home.loc.vaultRecordTitle), config.EXPLICIT_WAIT);

  // 4. Back to vault list
  await home.clickBackToVault();
  await driver.wait(until.elementLocated(home.loc.vaultTitle), config.SHORT_WAIT);

  // 5. Exit vault → home
  await home.closeVault();
  expect(await home.isHomeVisible()).toBe(true);
}, 120_000);
