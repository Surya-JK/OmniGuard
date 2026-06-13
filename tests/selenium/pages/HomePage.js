/**
 * HomePage — Page Object Model (Node.js / selenium-webdriver)
 */

'use strict';

const { By, until } = require('selenium-webdriver');
const config = require('../config');

class HomePage {
  /** @param {import('selenium-webdriver').WebDriver} driver */
  constructor(driver) {
    this.driver = driver;
  }

  loc = {
    cloudScansLabel:  By.xpath('//*[contains(text(),"Cloud Scans")]'),
    liveThreatsLabel: By.xpath('//*[contains(text(),"Live Threats")]'),
    scanTrendsLabel:  By.xpath('//*[contains(text(),"SCAN TRENDS")]'),
    vaultBadge:       By.xpath('//*[contains(text(),"Vault")]'),
    omniguardTitle:   By.xpath('//*[contains(text(),"OmniGuard")]'),
    // Paste Links button: text node inside nested React Native View
    textScanBtn:      By.xpath('//*[contains(text(),"Paste Links")]'),
    // Chat portal: the row container that holds the chat button text
    chatBtn:          By.xpath('//*[contains(text(),"AI SECURITY ASSISTANT")]'),
    resultDanger:     By.xpath('//*[contains(text(),"THREAT INTERCEPTED")]'),
    resultSafe:       By.xpath('//*[contains(text(),"SYSTEM CLEAR")]'),
    // React Native Web renders textarea for multiline inputs
    textModalInput:   By.xpath('//textarea'),
    analyzeBtn:       By.xpath('//*[contains(text(),"Initiate Scan")]'),
    clearBtn:         By.xpath('//*[contains(text(),"Clear Terminal")]'),

    // ── Vault / Threat History Locators ──
    vaultTitle:       By.xpath('//*[contains(text(),"Local Threat Vault")]'),
    vaultRecordTitle: By.xpath('//*[contains(text(),"Vault Record")]'),
    vaultEmptyText:   By.xpath('//*[contains(text(),"0 THREATS LOGGED")]'),
    exitVaultBtn:     By.xpath('//*[contains(text(),"Exit Vault")]'),
    backToVaultBtn:   By.xpath('//*[contains(text(),"Back to Vault")]'),
    // Logout — the power icon button left of the vault badge in the header
    logoutBtn:        By.xpath('//*[@aria-label="log-out-outline"] | //*[@aria-label="power-outline"]'),
  };

  // ── JS Click helper (bypasses React Native Web interactability issues) ──
  async jsClick(locator) {
    const el = await this.driver.wait(until.elementLocated(locator), config.EXPLICIT_WAIT);
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"}); arguments[0].click();', el);
  }

  // ── Actions ───────────────────────────────────────────────
  async waitForHome() {
    await this.driver.wait(until.elementLocated(this.loc.cloudScansLabel), config.EXPLICIT_WAIT);
  }

  async clickVaultBadge() {
    await this.jsClick(this.loc.vaultBadge);
  }

  async clickLogout() {
    // The logout button is to the left of the Vault badge in the header
    const vaultEl = await this.driver.wait(until.elementLocated(this.loc.vaultBadge), config.EXPLICIT_WAIT);
    // Execute JS to find the parent and click the sibling button
    await this.driver.executeScript(`
      const vaultEl = arguments[0];
      const parent = vaultEl.parentElement;
      if (parent && parent.previousElementSibling) {
        parent.previousElementSibling.click();
      }
    `, vaultEl);
  }

  async clickTextScan() {
    await this.jsClick(this.loc.textScanBtn);
  }

  async clickChat() {
    await this.jsClick(this.loc.chatBtn);
  }

  async clickPremium() {
    await this.driver.get(config.WEB_URL + '/premium');
  }

  /**
   * Open text modal, type text, submit for analysis.
   * @param {string} text
   */
  async enterTextAndAnalyze(text) {
    await this.clickTextScan();
    const inputField = await this.driver.wait(until.elementLocated(this.loc.textModalInput), config.EXPLICIT_WAIT);
    await this.driver.sleep(600); // Wait for modal slide animation
    await this.driver.executeScript('arguments[0].value = ""; arguments[0].dispatchEvent(new Event("input", {bubbles:true}));', inputField);
    await inputField.sendKeys(text);
    await this.jsClick(this.loc.analyzeBtn);
  }

  /** Wait for THREAT INTERCEPTED or SYSTEM CLEAR — returns 'DANGER' | 'SAFE'. */
  async waitForResult(timeout = config.LONG_WAIT) {
    await this.driver.wait(async () => {
      const danger = await this.driver.findElements(this.loc.resultDanger);
      const safe   = await this.driver.findElements(this.loc.resultSafe);
      return danger.length > 0 || safe.length > 0;
    }, timeout);

    const danger = await this.driver.findElements(this.loc.resultDanger);
    return danger.length > 0 ? 'DANGER' : 'SAFE';
  }

  async clickClear() {
    try {
      await this.jsClick(this.loc.clearBtn);
    } catch (_) {}
  }

  async openVault() {
    await this.clickVaultBadge();
    await this.driver.wait(until.elementLocated(this.loc.vaultTitle), config.EXPLICIT_WAIT);
  }

  async closeVault() {
    await this.jsClick(this.loc.exitVaultBtn);
  }

  async isVaultEmpty() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.vaultEmptyText), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }

  async clickBackToVault() {
    await this.jsClick(this.loc.backToVaultBtn);
  }

  // ── Assertions ────────────────────────────────────────────
  async isHomeVisible() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.cloudScansLabel), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }

  async isVaultBadgeVisible() {
    try {
      const el = await this.driver.wait(until.elementLocated(this.loc.vaultBadge), config.SHORT_WAIT);
      return el.isDisplayed();
    } catch (_) {
      return false;
    }
  }

  async isScanTrendsVisible() {
    try {
      const el = await this.driver.wait(until.elementLocated(this.loc.scanTrendsLabel), config.SHORT_WAIT);
      return el.isDisplayed();
    } catch (_) {
      return false;
    }
  }

  async isCloudScansVisible() {
    try {
      const el = await this.driver.wait(until.elementLocated(this.loc.cloudScansLabel), config.SHORT_WAIT);
      return el.isDisplayed();
    } catch (_) {
      return false;
    }
  }

  async isLiveThreatsVisible() {
    try {
      const el = await this.driver.wait(until.elementLocated(this.loc.liveThreatsLabel), config.SHORT_WAIT);
      return el.isDisplayed();
    } catch (_) {
      return false;
    }
  }
}

module.exports = HomePage;
