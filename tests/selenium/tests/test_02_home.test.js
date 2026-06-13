/**
 * Test Suite 02 — Home / Dashboard (Web)
 * OmniGuard Selenium E2E — Node.js / Jest
 *
 * TC-021  OmniGuard header title visible
 * TC-022  Cloud Scans counter visible
 * TC-023  Live Threats counter visible
 * TC-024  SCAN TRENDS banner visible
 * TC-025  Vault badge visible in header
 * TC-026  Logout button visible in header
 * TC-027  Logout returns to Login page
 * TC-028  AI SECURITY ASSISTANT portal card visible
 * TC-029  LIVE CAMERA CHECK hero card visible
 * TC-030  Scam Msg Check grid card visible
 * TC-031  Receipt Scan grid card visible
 * TC-032  Paste Links grid card visible
 * TC-033  Cloud Scans counter shows a number
 * TC-034  Live Threats counter shows a number
 * TC-035  Dashboard header does not show Login button
 * TC-036  Vault badge text contains "Vault"
 * TC-037  SCAN TRENDS label is present and uppercase
 * TC-038  Page title still contains OmniGuard on home
 * TC-039  All four quick-action grid cards are present
 * TC-040  Dashboard body scrolls and Paste Links remains reachable
 */

'use strict';

const { By, until } = require('selenium-webdriver');
const { buildDriver, loginWithTestAccount } = require('../helpers/driverFactory');
const HomePage  = require('../pages/HomePage');
const LoginPage = require('../pages/LoginPage');
const config    = require('../config');

let driver;

beforeAll(async () => {
  driver = await buildDriver();
  await loginWithTestAccount(driver);
}, 120_000);

afterAll(async () => {
  if (driver) await driver.quit();
});

// ── Test Cases ────────────────────────────────────────────────────────────────

test('TC-021 | OmniGuard header title is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="OmniGuard"]')),
    config.SHORT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-022 | Cloud Scans counter is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  expect(await home.isCloudScansVisible()).toBe(true);
});

test('TC-023 | Live Threats counter is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  expect(await home.isLiveThreatsVisible()).toBe(true);
});

test('TC-024 | SCAN TRENDS banner is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  expect(await home.isScanTrendsVisible()).toBe(true);
});

test('TC-025 | Vault badge is visible in header', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  expect(await home.isVaultBadgeVisible()).toBe(true);
});

test('TC-026 | Logout button is visible in header', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const els = await driver.findElements(home.loc.logoutBtn);
  expect(els.length).toBeGreaterThan(0);
});

test('TC-027 | Logout returns to Login page', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  await home.clickLogout();

  const loginPage = new LoginPage(driver);
  expect(await loginPage.isLoginPageVisible()).toBe(true);

  // Re-authenticate for subsequent tests
  await loginWithTestAccount(driver);
}, 30_000);

test('TC-028 | AI SECURITY ASSISTANT portal card is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="AI SECURITY ASSISTANT"]')),
    config.SHORT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-029 | LIVE CAMERA CHECK hero card is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="LIVE CAMERA CHECK"]')),
    config.EXPLICIT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-030 | Scam Msg Check grid card is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="Scam Msg Check"]')),
    config.EXPLICIT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-031 | Receipt Scan grid card is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="Receipt Scan"]')),
    config.EXPLICIT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-032 | Paste Links grid card is visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="Paste Links"]')),
    config.EXPLICIT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-033 | Cloud Scans label text is "Cloud Scans"', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.findElement(home.loc.cloudScansLabel);
  expect((await el.getText()).trim()).toBe('Cloud Scans');
});

test('TC-034 | Live Threats label text is "Live Threats"', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.findElement(home.loc.liveThreatsLabel);
  expect((await el.getText()).trim()).toBe('Live Threats');
});

test('TC-035 | Dashboard does not show the AUTHENTICATE button', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const els = await driver.findElements(
    By.xpath('//*[normalize-space(text())="AUTHENTICATE"]'),
  );
  expect(els.length).toBe(0);
});

test('TC-036 | Vault badge text contains "Vault"', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el   = await driver.findElement(home.loc.vaultBadge);
  const text = await el.getText();
  expect(text.toLowerCase()).toContain('vault');
});

test('TC-037 | SCAN TRENDS label is all-uppercase', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el   = await driver.findElement(home.loc.scanTrendsLabel);
  const text = await el.getText();
  expect(text).toBe(text.toUpperCase());
});

test('TC-038 | Browser page title still contains OmniGuard on home', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const title = await driver.getTitle();
  expect(title.toLowerCase()).toContain('omniguard');
});

test('TC-039 | All four quick-action grid cards are present', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();

  const cards = [
    'Scam Msg Check',
    'Receipt Scan',
    'Paste Links',
    'LIVE CAMERA CHECK',
  ];
  for (const label of cards) {
    const els = await driver.findElements(
      By.xpath(`//*[normalize-space(text())="${label}"]`),
    );
    expect(els.length).toBeGreaterThan(0);
  }
});

test('TC-040 | "Chat with the OmniGuard Intelligence" subtitle visible', async () => {
  const home = new HomePage(driver);
  await home.waitForHome();
  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[contains(text(),"OmniGuard Intelligence")]')),
    config.EXPLICIT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});
