# OmniGuard — Selenium Web E2E Test Suite (Node.js)

End-to-end tests for the **OmniGuard web application** using **Node.js**, **selenium-webdriver**, and **Jest**. Tests cover all major web screens and auto-generate a styled **Excel report** after every run.

---

## 📁 Folder Structure

```
tests/selenium/
├── package.json            # npm dependencies + run scripts
├── jest.config.js          # Jest configuration (sequential, custom reporter)
├── config.js               # Browser, URL, credentials, timeouts
├── globalSetup.js          # Loads .env before all tests
├── customReporter.js       # Jest reporter → triggers Excel generation
├── helpers/
│   └── driverFactory.js    # buildDriver() + loginWithTestAccount()
├── pages/                  # Page Object Model
│   ├── LoginPage.js
│   ├── HomePage.js
│   ├── ChatPage.js
│   └── PremiumPage.js
├── tests/
│   ├── test_01_login.test.js   # TC-001 to TC-007
│   ├── test_02_home.test.js    # TC-008 to TC-013
│   ├── test_03_scan_text.test.js # TC-014 to TC-017
│   ├── test_04_chat.test.js    # TC-018 to TC-020
│   └── test_05_premium.test.js # TC-021 to TC-023
├── utils/
│   └── reportGenerator.js  # Excel (.xlsx) builder using exceljs
└── reports/                # Auto-generated reports (git-ignored)
```

---

## ✅ Test Cases (23 total)

| ID | Module | Test Case |
|---|---|---|
| TC-001 | Login | Page title contains "OmniGuard" |
| TC-002 | Login | Email, password, Auth button visible |
| TC-003 | Login | Empty login shows alert |
| TC-004 | Login | Invalid credentials show error alert |
| TC-005 | Login | Valid login redirects to Home |
| TC-006 | Login | Toggle to Sign-up mode |
| TC-007 | Login | Google login button visible |
| TC-008 | Home | OmniGuard header visible |
| TC-009 | Home | Cloud Scans counter visible |
| TC-010 | Home | Live Threats counter visible |
| TC-011 | Home | Scan Trends banner visible |
| TC-012 | Home | Vault badge visible in header |
| TC-013 | Home | Logout returns to Login |
| TC-014 | Scan | Text scan modal opens |
| TC-015 | Scan | Safe text → SYSTEM CLEAR |
| TC-016 | Scan | Scam message → THREAT INTERCEPTED |
| TC-017 | Scan | Phishing URL → THREAT INTERCEPTED |
| TC-018 | Chat | Chat page accessible |
| TC-019 | Chat | Initial greeting message shown |
| TC-020 | Chat | Send message → typing indicator or response |
| TC-021 | Premium | Premium page accessible |
| TC-022 | Premium | $3.99/mo pricing card visible |
| TC-023 | Premium | Upgrade Now button visible and clickable |

---

## ⚙️ Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18 LTS or later |
| npm | 9+ (bundled with Node.js) |
| Google Chrome | Latest stable |

---

## 🚀 Quick Start

### 1. Install dependencies

```powershell
cd tests\selenium
npm install
```

> `chromedriver` is installed automatically by the `chromedriver` npm package — no manual setup needed.

### 2. Configure credentials

```powershell
# Copy the template
copy ..\\.env.example ..\\.env
```

Edit `../.env` and fill in:
```env
OMNIGUARD_TEST_EMAIL=your-test-email@example.com
OMNIGUARD_TEST_PASSWORD=YourTestPassword
```

### 3. Run all 23 tests

```powershell
npm test
```

---

## 🧪 Running Specific Suites

```powershell
# Login tests only
npm run test:login

# Home dashboard tests
npm run test:home

# Scan analysis tests
npm run test:scan

# AI chat tests
npm run test:chat

# Premium screen tests
npm run test:premium
```

---

## 🕶️ Headless Mode (for CI/CD)

```powershell
npm run test:headless
```
Or set the env var:
```powershell
$env:SELENIUM_HEADLESS = "true"
npm test
```

---

## 🌐 Test Against Local Dev Server

```powershell
# Start Expo web server first
npm run web    # (from OmniGuard root)

# Then run Selenium against localhost
$env:OMNIGUARD_WEB_URL = "http://localhost:8081"
cd tests\selenium
npm test
```

---

## 📊 Excel Report

After every `npm test` run, a report is saved at:

```
tests/selenium/reports/OmniGuard_Selenium_Web_Report_YYYY-MM-DDTHH-MM-SS.xlsx
```

**Sheet 1 — Summary**
| Section | Contents |
|---|---|
| Title | Suite name + timestamp |
| KPI boxes | Total / Passed / Failed / Skipped / Pass-Rate% / Duration |
| Bar chart | Visual pass/fail/skip breakdown |

**Sheet 2 — Test Details**
| Column | Contents |
|---|---|
| # | Row index |
| Test ID | TC-001 … TC-023 |
| Module | Test file name |
| Test Name | Function name |
| Status | 🟢 PASSED / 🔴 FAILED / 🟠 SKIPPED |
| Duration (s) | Execution time |
| Error / Notes | Failure message (truncated to 500 chars) |

---

## 🔧 Configuration Reference (`config.js`)

| Key | Default | Description |
|---|---|---|
| `WEB_URL` | `https://omni-guard-beta.vercel.app` | Target URL |
| `BROWSER` | `chrome` | `chrome` \| `firefox` |
| `HEADLESS` | `false` | Set to `true` for CI |
| `TEST_EMAIL` | `testuser@omniguard.dev` | Supabase test email |
| `TEST_PASSWORD` | `TestPass123!` | Supabase test password |
| `EXPLICIT_WAIT` | `20000` ms | Default element wait |
| `LONG_WAIT` | `45000` ms | AI analysis wait |

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| `ChromeDriver version mismatch` | Update Chrome browser; `npm install chromedriver@latest` |
| `Login test fails` | Set correct `TEST_EMAIL` / `TEST_PASSWORD` in `.env` |
| `Element not found` | Increase `EXPLICIT_WAIT` in `config.js` |
| `Scan analysis timeout` | Supabase AI edge function cold-starting — increase `LONG_WAIT` or retry |
| Tests run in parallel | Ensure `--runInBand` is in the `npm test` script (already set) |
