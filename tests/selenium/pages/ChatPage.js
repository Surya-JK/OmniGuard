/**
 * ChatPage — Page Object Model (Node.js / selenium-webdriver)
 */

'use strict';

const { By, until } = require('selenium-webdriver');
const config = require('../config');

class ChatPage {
  /** @param {import('selenium-webdriver').WebDriver} driver */
  constructor(driver) {
    this.driver = driver;
  }

  loc = {
    title:           By.xpath('//*[contains(text(),"OmniGuard AI")]'),
    initialMessage:  By.xpath('//*[contains(text(),"Hello! I am the OmniGuard")]'),
    // Textarea is the multiline input in React Native Web
    messageInput:    By.xpath('//textarea'),
    typingIndicator: By.xpath('//*[contains(text(),"Analyzing threat")]'),
    // Back button — on the chat page it is rendered as a chevron-back Ionicon.
    // React Native Web renders Ionicons as <span> with a unicode glyph.
    // We locate the parent pressable by its position in the header (first pressable sibling).
    backBtn:         By.xpath('//button[1] | //div[@role="button"][1]'),
    // Send button — last pressable inside the input row
    sendBtn:         By.xpath('//button[last()] | //div[@role="button"][last()]'),
    newChatBtn:      By.xpath('//*[@aria-label="create-outline"]'),
    deleteBtn:       By.xpath('//*[@aria-label="trash-outline"]'),
    omniguardLabel:  By.xpath('//*[contains(text(),"OMNIGUARD CORE")]'),
    historyNewPill:  By.xpath('//*[contains(text(),"New")]'),
  };

  // ── JS Click helper ──
  async jsClick(locator) {
    const el = await this.driver.wait(until.elementLocated(locator), config.EXPLICIT_WAIT);
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"}); arguments[0].click();', el);
  }

  // ── Actions ───────────────────────────────────────────────
  async waitForChat() {
    await this.driver.wait(until.elementLocated(this.loc.title), config.EXPLICIT_WAIT);
  }

  async goBack() {
    // Use browser history — more reliable than clicking the SVG back button
    await this.driver.executeScript('window.history.back();');
    await this.driver.wait(
      until.elementLocated(By.xpath('//*[contains(text(),"Cloud Scans")]')),
      config.EXPLICIT_WAIT,
    );
  }

  async sendMessage(text) {
    // Use JS to focus and set value on the textarea (avoids ElementNotInteractableError)
    const field = await this.driver.wait(until.elementLocated(this.loc.messageInput), config.EXPLICIT_WAIT);
    await this.driver.executeScript(
      `arguments[0].focus();
       const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
       nativeInputValueSetter.call(arguments[0], arguments[1]);
       arguments[0].dispatchEvent(new Event('input', { bubbles: true }));`,
      field,
      text,
    );
    // Click send button — it's the last focusable sibling of the textarea
    await this.driver.executeScript(`
      const textarea = arguments[0];
      // Walk up to the input pill container, then find the send button
      let container = textarea.parentElement;
      while (container && !container.querySelector('[style*="40px"][style*="40px"]')) {
        container = container.parentElement;
        if (!container) break;
      }
      // Fallback: find last div/button sibling of textarea
      const siblings = Array.from(textarea.parentElement ? textarea.parentElement.children : []);
      const sendBtn = siblings.filter(el => el !== textarea).pop();
      if (sendBtn) sendBtn.click();
    `, field);
  }

  async waitForAIResponse(timeout = config.LONG_WAIT) {
    try {
      await this.driver.wait(until.elementLocated(this.loc.typingIndicator), config.SHORT_WAIT);
    } catch (_) {}
    try {
      await this.driver.wait(
        until.stalenessOf(await this.driver.findElement(this.loc.typingIndicator)),
        timeout,
      );
    } catch (_) {}
    const labels = await this.driver.findElements(this.loc.omniguardLabel);
    if (labels.length > 0) {
      const last = labels[labels.length - 1];
      try {
        const sibling = await last.findElement(By.xpath('following-sibling::*[1]'));
        return sibling.getText();
      } catch (_) {}
    }
    return '';
  }

  async tapNewChat() {
    // The new-chat (pencil) icon button is the last button in the chat header
    // Ionicons SVGs don't carry aria-label on web, so we use JS DOM traversal
    const clicked = await this.driver.executeScript(`
      const allText = Array.from(document.querySelectorAll('*'));
      const titleEl = allText.find(el =>
        el.childNodes.length === 1 &&
        el.childNodes[0].nodeType === Node.TEXT_NODE &&
        el.textContent.trim() === 'OmniGuard AI'
      );
      if (!titleEl) return false;
      // The header row is a flex container with 3 children: back | title | buttons
      const header = titleEl.parentElement;
      if (!header) return false;
      // Last child of the header contains icon buttons
      const btnContainer = header.lastElementChild;
      if (!btnContainer) return false;
      // Click the last clickable child (new chat button)
      const btns = Array.from(btnContainer.querySelectorAll('*')).filter(el => {
        const cs = window.getComputedStyle(el);
        return cs.cursor === 'pointer' || el.tagName === 'BUTTON';
      });
      const btn = btns[btns.length - 1];
      if (btn) { btn.click(); return true; }
      return false;
    `);
    if (!clicked) {
      // Fallback: click any element with create or plus icon text
      try { await this.jsClick(By.xpath('//*[@aria-label="create-outline"]')); } catch (_) {}
    }
  }

  async tapDeleteSession() {
    await this.jsClick(this.loc.deleteBtn);
  }

  async confirmDeleteDialog() {
    // delete() in chat.tsx uses window.confirm on web — accept it
    try {
      await this.driver.wait(until.alertIsPresent(), config.SHORT_WAIT);
      const alert = await this.driver.switchTo().alert();
      await alert.accept();
    } catch (_) {
      // window.confirm may have been intercepted; try accepting JS dialog
      try {
        await this.driver.executeScript('window.confirm = () => true;');
      } catch (_2) {}
    }
  }

  // ── Assertions ────────────────────────────────────────────
  async isChatVisible() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.title), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }

  async isInitialMessageVisible() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.initialMessage), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }

  async isHistoryBarVisible() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.historyNewPill), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }

  async isTypingIndicatorVisible() {
    try {
      await this.driver.wait(until.elementLocated(this.loc.typingIndicator), config.SHORT_WAIT);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = ChatPage;
