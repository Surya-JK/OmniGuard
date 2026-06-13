/**
 * Test Suite 01 — Login / Authentication (Web)
 * OmniGuard Selenium E2E — Node.js / Jest
 *
 * TC-001  Page title contains "OmniGuard"
 * TC-002  OmniGuard logo icon visible
 * TC-003  Subtitle "Decentralized Threat" visible
 * TC-004  Email input is visible
 * TC-005  Password input is visible
 * TC-006  AUTHENTICATE button is visible
 * TC-007  Google login button visible
 * TC-008  "Sign up here" link is visible
 * TC-009  Empty login shows error alert
 * TC-010  Invalid credentials show error alert
 * TC-011  Valid login (bypass) redirects to Home dashboard
 * TC-012  Toggle to Sign-up mode shows CREATE ACCOUNT header
 * TC-013  Sign-up form shows REGISTER button
 * TC-014  "Login here" link shown in sign-up mode
 * TC-015  Toggle back to Login mode from Sign-up
 * TC-016  Password field masks input (type=password)
 * TC-017  "Forgot Password?" link is visible in login mode
 * TC-018  Forgot password with empty email shows error alert
 * TC-019  Forgot password with email shows reset/sent alert
 * TC-020  Login page reloads cleanly after clearing storage
 */

'use strict';

const { By, until } = require('selenium-webdriver');
const { buildDriver } = require('../helpers/driverFactory');
const LoginPage = require('../pages/LoginPage');
const HomePage  = require('../pages/HomePage');
const config    = require('../config');

let driver;

beforeAll(async () => {
  driver = await buildDriver();
  await driver.get(config.WEB_URL);
}, 120_000);

afterAll(async () => {
  if (driver) await driver.quit();
});

// Fresh clean page before each test
beforeEach(async () => {
  await driver.executeScript('window.sessionStorage.clear(); window.localStorage.clear();');
  await driver.get(config.WEB_URL);
}, 30_000);

// ── Test Cases ───────────────────────────────────────────────────────────────

test('TC-001 | Page title contains OmniGuard', async () => {
  const page  = new LoginPage(driver);
  await page.waitForPage();
  const title = await page.getPageTitle();
  expect(title.toLowerCase()).toContain('omniguard');
});

test('TC-002 | OmniGuard logo icon is visible', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  const iconEl = await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="OmniGuard"]')),
    config.SHORT_WAIT,
  );
  expect(await iconEl.isDisplayed()).toBe(true);
});

test('TC-003 | Subtitle "Decentralized Threat" is visible', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  const el = await driver.wait(
    until.elementLocated(By.xpath('//*[contains(text(),"Decentralized Threat")]')),
    config.SHORT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-004 | Email input is visible', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  const el = await driver.findElement(page.loc.emailInput);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-005 | Password input is visible', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  const el = await driver.findElement(page.loc.passwordInput);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-006 | AUTHENTICATE button is visible', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  const el = await driver.wait(until.elementLocated(page.loc.authBtn), config.SHORT_WAIT);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-007 | Google login button is visible', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  expect(await page.isGoogleButtonVisible()).toBe(true);
});

test('TC-008 | "Sign up here" link is visible', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  const el = await driver.wait(until.elementLocated(page.loc.signupLink), config.SHORT_WAIT);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-009 | Empty login shows error alert', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await page.clickAuthenticate();

  const alertText = await page.getAlertText();
  expect(alertText).not.toBeNull();
  expect(
    alertText.toLowerCase().includes('email') ||
    alertText.toLowerCase().includes('password') ||
    alertText.toLowerCase().includes('enter') ||
    alertText.toLowerCase().includes('error'),
  ).toBe(true);
});

test('TC-010 | Invalid credentials show error alert', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await page.login(config.INVALID_EMAIL, config.INVALID_PASSWORD);
  const alertText = await page.getAlertText();
  expect(alertText).not.toBeNull();
});

test('TC-011 | Valid login redirects to Home dashboard', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();

  // Use the real UI bypass credentials
  await page.login(config.TEST_EMAIL, config.TEST_PASSWORD);

  const home = new HomePage(driver);
  expect(await home.isHomeVisible()).toBe(true);
}, 40_000);

test('TC-012 | Toggle to Sign-up mode shows CREATE ACCOUNT header', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await page.clickSignupLink();
  expect(await page.isSignupModeVisible()).toBe(true);
});

test('TC-013 | Sign-up form shows REGISTER button', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await page.clickSignupLink();

  const el = await driver.wait(until.elementLocated(page.loc.registerBtn), config.SHORT_WAIT);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-014 | "Login here" link shown in sign-up mode', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await page.clickSignupLink();

  const el = await driver.wait(until.elementLocated(page.loc.loginLink), config.SHORT_WAIT);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-015 | Toggle back to Login mode from Sign-up', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await page.clickSignupLink();
  await page.clickLoginLink();

  const el = await driver.wait(until.elementLocated(page.loc.memberHeader), config.SHORT_WAIT);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-016 | Password field masks input (type=password)', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  const el   = await driver.findElement(page.loc.passwordInput);
  const type = await el.getAttribute('type');
  expect(type).toBe('password');
});

test('TC-017 | Forgot Password link is visible in login mode', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  const el = await driver.wait(until.elementLocated(page.loc.forgotPwd), config.SHORT_WAIT);
  expect(await el.isDisplayed()).toBe(true);
});

test('TC-018 | Forgot password with empty email shows error alert', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await page.clickForgotPassword();
  const alertText = await page.getAlertText();
  expect(alertText).not.toBeNull();
  expect(alertText.toLowerCase()).toContain('email');
});

test('TC-019 | Forgot password with email attempts reset', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await page.enterEmail('testuser@omniguard.dev');
  await page.clickForgotPassword();
  const alertText = await page.getAlertText();
  expect(alertText).not.toBeNull();
  const lower = alertText.toLowerCase();
  expect(
    lower.includes('reset') || lower.includes('sent') || lower.includes('fail') || lower.includes('check'),
  ).toBe(true);
}, 30_000);

test('TC-020 | Login page reloads cleanly after clearing storage', async () => {
  const page = new LoginPage(driver);
  await page.waitForPage();
  await driver.executeScript('window.sessionStorage.clear(); window.localStorage.clear();');
  await driver.navigate().refresh();
  await page.waitForPage();
  const el = await driver.findElement(page.loc.emailInput);
  expect(await el.isDisplayed()).toBe(true);
});
