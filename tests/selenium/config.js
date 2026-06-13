/**
 * OmniGuard Selenium (Node.js) — Global Configuration
 * =====================================================
 * Values can be overridden via environment variables or a .env file.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  // ── Target URL ──────────────────────────────────────────────
  // Default: live Vercel deployment.
  // Switch to http://localhost:8081 for local expo web dev server.
  WEB_URL: process.env.OMNIGUARD_WEB_URL || 'https://omni-guard-beta.vercel.app',

  // ── Browser ─────────────────────────────────────────────────
  BROWSER:   process.env.SELENIUM_BROWSER  || 'chrome',   // 'chrome' | 'firefox'
  HEADLESS:  process.env.SELENIUM_HEADLESS === 'true',

  WINDOW_WIDTH:  1280,
  WINDOW_HEIGHT: 900,

  // ── Test Credentials (Supabase test account) ─────────────────
  TEST_EMAIL:    process.env.OMNIGUARD_TEST_EMAIL    || 'testuser@omniguard.dev',
  TEST_PASSWORD: process.env.OMNIGUARD_TEST_PASSWORD || 'TestPass123!',

  INVALID_EMAIL:    'bad@notreal.xyz',
  INVALID_PASSWORD: 'wrongpassword',

  // ── Timeouts (milliseconds) ──────────────────────────────────
  IMPLICIT_WAIT:  10_000,
  EXPLICIT_WAIT:  20_000,
  SHORT_WAIT:      5_000,
  LONG_WAIT:      45_000,   // for AI edge-function calls

  // ── Test Data — Threat Scenarios ─────────────────────────────
  SAFE_TEXT: "Hello, how are you doing today? Let's meet at the cafe.",

  SCAM_TEXT: [
    'Dear Customer, your electricity connection will be disconnected tonight.',
    'Call 9876543210 immediately to update your KYC and avoid disconnection.',
  ].join(' '),

  PHISHING_URL_TEXT: [
    'Your account is blocked. Update your KYC now:',
    'http://secure-kyc-update.online/login to avoid suspension.',
  ].join(' '),

  // ── Reports Directory ────────────────────────────────────────
  REPORTS_DIR: require('path').join(__dirname, 'reports'),
};
