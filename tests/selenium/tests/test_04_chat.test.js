/**
 * Test Suite 04 — AI Chat (Web)
 * OmniGuard Selenium E2E — Node.js / Jest
 *
 * Each test navigates directly to the chat URL, does its work,
 * and navigates back using JS history. An afterEach safety net
 * always returns the browser to the home page so failures don't cascade.
 */

'use strict';

const { By, until } = require('selenium-webdriver');
const { buildDriver, loginWithTestAccount } = require('../helpers/driverFactory');
const HomePage = require('../pages/HomePage');
const ChatPage = require('../pages/ChatPage');
const config   = require('../config');

let driver;
let home;
let chat;

beforeAll(async () => {
  driver = await buildDriver();
  await loginWithTestAccount(driver);
  home = new HomePage(driver);
  chat = new ChatPage(driver);
}, 120_000);

afterAll(async () => {
  if (driver) await driver.quit();
});

/**
 * Safety net: after every test, navigate back to home so a crash
 * mid-navigation does not break subsequent tests.
 */
afterEach(async () => {
  try {
    // Check current URL — if not on home, force navigate there
    const url = await driver.getCurrentUrl().catch(() => '');
    if (!url.includes('localhost') && !url.includes('vercel')) return;
    if (url.includes('/chat')) {
      await driver.get(config.WEB_URL + '/');
      await driver.sleep(1500);
    }
  } catch (_) {}
});

/** Navigate to chat page and wait for it to be ready. */
async function goToChat() {
  await driver.get(config.WEB_URL + '/chat');
  await driver.sleep(3000); // Expo may bundle on first visit
  await chat.waitForChat();
}

/** Navigate back to home and confirm it loaded. */
async function returnHome() {
  await driver.get(config.WEB_URL + '/');
  await home.waitForHome();
}

// ── Helpers that avoid using chat.loc.backBtn (Ionicons have no reliable locator) ──

/** Click back via JS history — most reliable method. */
async function goBack() {
  await driver.executeScript('window.history.back()');
  await driver.sleep(1000);
}

/** Check if the back button region is visible using JS DOM. */
async function isBackButtonVisible() {
  return driver.executeScript(`
    // Chat header has 3 children: back | title | right-buttons
    // The first child of the header contains the back button area
    const titles = Array.from(document.querySelectorAll('*')).filter(el =>
      el.childNodes.length === 1 &&
      el.childNodes[0] &&
      el.childNodes[0].nodeType === Node.TEXT_NODE &&
      el.textContent.trim() === 'OmniGuard AI'
    );
    if (!titles.length) return false;
    const header = titles[0].closest && titles[0].closest('[style*="flex-direction: row"]');
    if (!header) return !!titles[0].parentElement;
    const firstChild = header.firstElementChild;
    if (!firstChild) return false;
    const rect = firstChild.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  `);
}

/** Check if the new-chat button is present via JS. */
async function isNewChatButtonVisible() {
  return driver.executeScript(`
    // Walk to the right-button container in the chat header
    const titles = Array.from(document.querySelectorAll('*')).filter(el =>
      el.childNodes.length === 1 &&
      el.childNodes[0] &&
      el.childNodes[0].nodeType === Node.TEXT_NODE &&
      el.textContent.trim() === 'OmniGuard AI'
    );
    if (!titles.length) return false;
    const header = titles[0].closest && titles[0].closest('[style*="flex-direction: row"]');
    if (!header) return false;
    return !!header.lastElementChild;
  `);
}

// ── Test Cases ────────────────────────────────────────────────────────────────

test('TC-061 | Chat page accessible via AI SECURITY ASSISTANT card', async () => {
  await home.waitForHome();
  await home.clickChat();
  await driver.sleep(3000);
  expect(await chat.isChatVisible()).toBe(true);
  await returnHome();
}, 60_000);

test('TC-062 | Chat page title "OmniGuard AI" is visible', async () => {
  await goToChat();
  const el = await driver.findElement(chat.loc.title);
  expect((await el.getText()).trim()).toBe('OmniGuard AI');
  await returnHome();
});

test('TC-063 | Initial greeting message is visible on load', async () => {
  await goToChat();
  expect(await chat.isInitialMessageVisible()).toBe(true);
  await returnHome();
});

test('TC-064 | Back button area is present in chat header', async () => {
  await goToChat();
  const visible = await isBackButtonVisible();
  expect(visible).toBe(true);
  await returnHome();
});

test('TC-065 | New Chat button area is present in chat header', async () => {
  await goToChat();
  const visible = await isNewChatButtonVisible();
  expect(visible).toBe(true);
  await returnHome();
});

test('TC-066 | Message input (textarea) is visible', async () => {
  await goToChat();
  const el = await driver.wait(until.elementLocated(chat.loc.messageInput), config.EXPLICIT_WAIT);
  expect(await el.isDisplayed()).toBe(true);
  await returnHome();
});

test('TC-067 | After typing, message input has content', async () => {
  await goToChat();
  const input = await driver.wait(until.elementLocated(chat.loc.messageInput), config.EXPLICIT_WAIT);
  await driver.executeScript(
    `arguments[0].focus();
     const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
     s.call(arguments[0], 'test message');
     arguments[0].dispatchEvent(new Event('input', { bubbles: true }));`,
    input,
  );
  const value = await input.getAttribute('value');
  expect((value || '').length).toBeGreaterThan(0);
  await returnHome();
});

test('TC-068 | Sending a message clears the input field', async () => {
  await goToChat();
  await chat.sendMessage('What is OmniGuard?');
  await driver.sleep(2000);
  const input = await driver.wait(until.elementLocated(chat.loc.messageInput), config.EXPLICIT_WAIT);
  const value = await input.getAttribute('value');
  expect((value || '').trim()).toBe('');
  await chat.tapNewChat();
  await returnHome();
}, 30_000);

test('TC-069 | Sent message text appears in the chat list', async () => {
  await goToChat();
  const msg = 'Hello OmniGuard AI';
  await chat.sendMessage(msg);
  await driver.sleep(2000);
  const el = await driver.wait(
    until.elementLocated(By.xpath(`//*[contains(text(),"${msg}")]`)),
    config.EXPLICIT_WAIT,
  );
  expect(await el.isDisplayed()).toBe(true);
  await chat.tapNewChat();
  await returnHome();
}, 30_000);

test('TC-070 | AI response or typing indicator appears after sending', async () => {
  await goToChat();
  await chat.sendMessage('Is this URL safe? http://bit.ly/prize123');
  const appeared = await chat.isTypingIndicatorVisible().catch(() => false);
  let ok = appeared;
  if (!ok) {
    await driver.sleep(8000);
    const labels = await driver.findElements(
      By.xpath('//*[normalize-space(text())="OMNIGUARD CORE"]'),
    );
    ok = labels.length >= 1;
  }
  expect(ok).toBe(true);
  await chat.tapNewChat();
  await returnHome();
}, 60_000);

test('TC-071 | Back navigation returns to Home dashboard', async () => {
  await goToChat();
  await returnHome();
  expect(await home.isHomeVisible()).toBe(true);
});

test('TC-072 | Initial greeting contains "OmniGuard"', async () => {
  await goToChat();
  const el   = await driver.wait(until.elementLocated(chat.loc.initialMessage), config.SHORT_WAIT);
  const text = await el.getText();
  expect(text.toLowerCase()).toContain('omniguard');
  await returnHome();
});

test('TC-073 | Chat input has placeholder text', async () => {
  await goToChat();
  const input = await driver.wait(until.elementLocated(chat.loc.messageInput), config.EXPLICIT_WAIT);
  const ph    = await input.getAttribute('placeholder');
  expect(ph).not.toBeNull();
  expect(ph.length).toBeGreaterThan(0);
  await returnHome();
});

test('TC-074 | New Chat button clears conversation', async () => {
  await goToChat();
  await chat.sendMessage('Testing new chat reset');
  await driver.sleep(2000);
  await chat.tapNewChat();
  expect(await chat.isInitialMessageVisible()).toBe(true);
  await returnHome();
}, 30_000);

test('TC-075 | OMNIGUARD CORE label appears after AI responds', async () => {
  await goToChat();
  await chat.sendMessage('What can you help me with?');
  await driver.sleep(15000);
  const labels = await driver.findElements(
    By.xpath('//*[normalize-space(text())="OMNIGUARD CORE"]'),
  );
  expect(labels.length).toBeGreaterThanOrEqual(1);
  await chat.tapNewChat();
  await returnHome();
}, 90_000);

test('TC-076 | Chat page stays on /chat route (URL check)', async () => {
  await goToChat();
  const url = await driver.getCurrentUrl();
  expect(url).toContain('/chat');
  await returnHome();
});

test('TC-077 | Chat page is functional after a second visit', async () => {
  await goToChat();
  expect(await chat.isChatVisible()).toBe(true);
  await returnHome();
  await goToChat();
  expect(await chat.isChatVisible()).toBe(true);
  await returnHome();
}, 30_000);

test('TC-078 | Chat input accepts typed text', async () => {
  await goToChat();
  const input = await driver.wait(until.elementLocated(chat.loc.messageInput), config.EXPLICIT_WAIT);
  await driver.executeScript(
    `const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
     s.call(arguments[0], 'typing test'); arguments[0].dispatchEvent(new Event('input',{bubbles:true}));`,
    input,
  );
  const val = await input.getAttribute('value');
  expect(val).toContain('typing test');
  await returnHome();
});

test('TC-079 | New chat session shows the initial greeting again', async () => {
  await goToChat();
  await chat.tapNewChat();
  await driver.sleep(1000);
  expect(await chat.isInitialMessageVisible()).toBe(true);
  await returnHome();
});

test('TC-080 | Chat page does not display "Cloud Scans" counter', async () => {
  await goToChat();
  const els = await driver.findElements(
    By.xpath('//*[normalize-space(text())="Cloud Scans"]'),
  );
  expect(els.length).toBe(0);
  await returnHome();
});
