/**
 * Driver Factory — builds a Chrome WebDriver instance and provides auth helpers.
 * Used by every test file via beforeAll / afterAll.
 *
 * KEY: loginWithTestAccount() uses a JS injection bypass instead of the UI
 *      so it works 100% reliably without depending on Supabase availability.
 */

'use strict';

const { Builder, By, until } = require('selenium-webdriver');
const chrome                 = require('selenium-webdriver/chrome');
const config                 = require('../config');

/**
 * Build and return a configured Chrome WebDriver instance.
 * @returns {Promise<import('selenium-webdriver').WebDriver>}
 */
async function buildDriver() {
  const chromeOpts = new chrome.Options();

  if (config.HEADLESS) {
    chromeOpts.addArguments('--headless=new');
  }
  chromeOpts.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    `--window-size=${config.WINDOW_WIDTH},${config.WINDOW_HEIGHT}`,
  );

  const driver = await new Builder()
    .forBrowser(config.BROWSER)
    .setChromeOptions(chromeOpts)
    .build();

  await driver.manage().setTimeouts({ implicit: config.IMPLICIT_WAIT });
  await driver.manage().window().setRect({
    width:  config.WINDOW_WIDTH,
    height: config.WINDOW_HEIGHT,
  });

  return driver;
}

/**
 * Inject the bypassAuth flag into sessionStorage, then navigate to the home page.
 * This is instant and 100% reliable — it does NOT depend on the Supabase network call.
 *
 * @param {import('selenium-webdriver').WebDriver} driver
 */
async function loginWithTestAccount(driver) {
  // Step 1 – land on the app so sessionStorage is in the right origin
  await driver.get(config.WEB_URL);
  await driver.sleep(2000);

  // Step 2 – set the bypass flag via JS injection
  await driver.executeScript("window.sessionStorage.setItem('bypassAuth', 'true');");

  // Step 3 – navigate to home (/) so the app reads the bypass flag
  await driver.get(config.WEB_URL + '/');
  await driver.sleep(3000); // give Expo time to bundle & hydrate React tree

  // Step 4 – verify home dashboard is visible (allow up to 40s for slow bundler)
  await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="Cloud Scans"]')),
    40_000,
  );
}

/**
 * Navigate back to home and ensure the dashboard is ready.
 * Call after tests that change the route (e.g. chat, vault).
 *
 * @param {import('selenium-webdriver').WebDriver} driver
 */
async function returnHome(driver) {
  await driver.get(config.WEB_URL + '/');
  await driver.sleep(300);
  await driver.wait(
    until.elementLocated(By.xpath('//*[normalize-space(text())="Cloud Scans"]')),
    config.EXPLICIT_WAIT,
  );
}

module.exports = { buildDriver, loginWithTestAccount, returnHome };
