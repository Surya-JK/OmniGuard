/**
 * PremiumPage — Page Object Model (Node.js / selenium-webdriver)
 */

'use strict';

const { By, until } = require('selenium-webdriver');
const config = require('../config');

class PremiumPage {
  /** @param {import('selenium-webdriver').WebDriver} driver */
  constructor(driver) {
    this.driver = driver;
  }

  loc = {
    headerTitle: By.xpath('//*[contains(text(),"Upgrade to PRO")]'),
    priceDisplay:By.xpath('//*[contains(text(),"3.99")]'),
    billingText: By.xpath('//*[contains(text(),"Billed monthly")]'),
    upgradeBtn:  By.xpath('//*[contains(text(),"UPGRADE NOW")]'),
    verifyBtn:   By.xpath('//*[contains(text(),"VERIFY PAYMENT")]'),
    footerText:  By.xpath('//*[contains(text(),"Terms of Service")]'),
  };

  FEATURES = [
    'Unlimited AI Threat Scans',
    'Unlimited Forensic Chat',
    'Priority Cloud Sync',
    'Zero-Day Protection',
  ];

  // ── JS Click helper ──
  async jsClick(locator) {
    const el = await this.driver.wait(until.elementLocated(locator), config.EXPLICIT_WAIT);
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"}); arguments[0].click();', el);
  }

  // ── Actions ───────────────────────────────────────────────
  async waitForPremium() {
    await this.driver.wait(until.elementLocated(this.loc.headerTitle), config.EXPLICIT_WAIT);
  }

  async goBack() {
    await this.driver.executeScript('window.history.back();');
    await this.driver.wait(
      until.elementLocated(By.xpath('//*[contains(text(),"Cloud Scans")]')),
      config.EXPLICIT_WAIT,
    );
  }

  async clickUpgradeNow() {
    await this.jsClick(this.loc.upgradeBtn);
  }

  // ── Assertions ────────────────────────────────────────────
  async isPremiumVisible() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.headerTitle), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }

  async getPriceText() {
    // Retry loop to handle StaleElementReferenceError
    try {
      return await this.driver.wait(async () => {
        try {
          const el = await this.driver.findElement(this.loc.priceDisplay);
          const txt = await el.getText();
          return txt || false;
        } catch (_) {
          return false;
        }
      }, config.EXPLICIT_WAIT);
    } catch (_) {
      return '';
    }
  }

  async isUpgradeBtnVisible() {
    // Retry loop to handle StaleElementReferenceError from React re-renders
    try {
      return await this.driver.wait(async () => {
        try {
          const el = await this.driver.findElement(this.loc.upgradeBtn);
          return await el.isDisplayed();
        } catch (_) {
          return false;
        }
      }, config.SHORT_WAIT);
    } catch (_) {
      return false;
    }
  }

  async areFeaturesListed() {
    for (const feat of this.FEATURES) {
      const els = await this.driver.findElements(
        By.xpath(`//*[contains(text(),"${feat}")]`),
      );
      if (els.length === 0) return false;
    }
    return true;
  }
}

module.exports = PremiumPage;
