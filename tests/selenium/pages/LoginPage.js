/**
 * LoginPage — Page Object Model (Node.js / selenium-webdriver)
 */

'use strict';

const { By, until, Key } = require('selenium-webdriver');
const config = require('../config');

class LoginPage {
  /** @param {import('selenium-webdriver').WebDriver} driver */
  constructor(driver) {
    this.driver = driver;
  }

  // ── Locators ──────────────────────────────────────────────
  loc = {
    emailInput:   By.css('input[placeholder*="Email"]'),
    passwordInput:By.css('input[type="password"]'),
    authBtn:      By.xpath('//*[contains(text(),"AUTHENTICATE")]'),
    registerBtn:  By.xpath('//*[contains(text(),"REGISTER")]'),
    googleBtn:    By.xpath('//*[contains(text(),"Continue with Google")]'),
    signupLink:   By.xpath('//*[contains(text(),"Sign up here")]'),
    loginLink:    By.xpath('//*[contains(text(),"Login here")]'),
    memberHeader: By.xpath('//*[contains(text(),"MEMBER LOGIN")]'),
    createHeader: By.xpath('//*[contains(text(),"CREATE ACCOUNT")]'),
    forgotPwd:    By.xpath('//*[contains(text(),"Forgot Password?")]'),
    title:        By.xpath('//*[contains(text(),"OmniGuard")]'),
    subtitle:     By.xpath('//*[contains(text(),"Decentralized Threat")]'),
  };

  // ── Actions ───────────────────────────────────────────────
  async waitForPage() {
    await this.driver.wait(until.elementLocated(this.loc.emailInput), config.EXPLICIT_WAIT);
  }

  async enterEmail(email) {
    const el = await this.driver.wait(until.elementLocated(this.loc.emailInput), config.EXPLICIT_WAIT);
    await el.clear();
    await el.sendKeys(email);
  }

  async enterPassword(password) {
    const el = await this.driver.findElement(this.loc.passwordInput);
    await el.clear();
    await el.sendKeys(password);
  }

  async clickAuthenticate() {
    const btn = await this.driver.wait(until.elementLocated(this.loc.authBtn), config.EXPLICIT_WAIT);
    await this.driver.wait(until.elementIsEnabled(btn), config.SHORT_WAIT);
    await btn.click();
  }

  async clickGoogleLogin() {
    const btn = await this.driver.wait(until.elementLocated(this.loc.googleBtn), config.EXPLICIT_WAIT);
    await btn.click();
  }

  async clickSignupLink() {
    const el = await this.driver.wait(until.elementLocated(this.loc.signupLink), config.EXPLICIT_WAIT);
    await el.click();
  }

  async clickLoginLink() {
    const el = await this.driver.wait(until.elementLocated(this.loc.loginLink), config.EXPLICIT_WAIT);
    await el.click();
  }

  async login(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickAuthenticate();
  }

  /** Handle a JS window.alert() and return its text. */
  async getAlertText() {
    try {
      await this.driver.wait(until.alertIsPresent(), config.SHORT_WAIT);
      const alert = await this.driver.switchTo().alert();
      const text  = await alert.getText();
      await alert.accept();
      return text;
    } catch (_) {
      return null;
    }
  }

  // ── Assertions ────────────────────────────────────────────
  async isLoginPageVisible() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.emailInput), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }

  async isSignupModeVisible() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.createHeader), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }

  async getPageTitle() {
    try {
      const el = await this.driver.findElement(this.loc.title);
      return await el.getText();
    } catch (_) {
      return this.driver.getTitle();
    }
  }

  async isGoogleButtonVisible() {
    try {
      const el = await this.driver.findElement(this.loc.googleBtn);
      return el.isDisplayed();
    } catch (_) {
      return false;
    }
  }
}

module.exports = LoginPage;
