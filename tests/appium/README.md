# OmniGuard — Appium Android E2E Test Suite

End-to-end tests for the **OmniGuard Android mobile application** using Python + Appium v2 + UiAutomator2. Tests cover all 6 major screens and generate a styled **Excel report** after every run.

---

## 📁 Folder Structure

```
tests/appium/
├── config.py               # Device caps, credentials, test data
├── conftest.py             # Driver fixtures, Excel report hook
├── pytest.ini              # pytest configuration
├── requirements.txt        # Python dependencies
├── pages/                  # Page Object Model
│   ├── login_page.py       # Login / Sign-up screen
│   ├── home_page.py        # Home / Dashboard screen
│   ├── scan_page.py        # Camera, QR, text-input, result card
│   ├── chat_page.py        # AI Chat screen
│   └── premium_page.py     # Premium Upgrade screen
├── tests/
│   ├── test_01_login.py    # TC-001 to TC-006  (Login / Auth)
│   ├── test_02_home.py     # TC-007 to TC-011  (Dashboard)
│   ├── test_03_scan.py     # TC-012 to TC-020  (Scanning)
│   ├── test_04_vault.py    # TC-021 to TC-022  (Vault / History)
│   ├── test_05_chat.py     # TC-023 to TC-028  (AI Chat)
│   └── test_06_premium.py  # TC-029 to TC-031  (Premium)
├── utils/
│   └── report_generator.py # Excel (.xlsx) report builder
└── reports/                # Auto-generated reports (git-ignored)
```

---

## ✅ Test Cases (31 total)

| ID | Module | Test Case |
|---|---|---|
| TC-001 | Login | App launches to Login screen |
| TC-002 | Login | Empty fields show error alert |
| TC-003 | Login | Invalid credentials show auth error |
| TC-004 | Login | Valid login redirects to Home |
| TC-005 | Login | Toggle between Login ↔ Sign-up |
| TC-006 | Login | Forgot Password requires email |
| TC-007 | Home | Cloud Scans, Live Threats, Scan Trends visible |
| TC-008 | Home | Vault badge visible in header |
| TC-009 | Home | Vault modal opens on tap |
| TC-010 | Home | Pull-to-refresh triggers reload |
| TC-011 | Home | Logout returns to Login |
| TC-012 | Scan | Camera opens in TEXT mode |
| TC-013 | Scan | Switch to QR mode changes UI |
| TC-014 | Scan | X button closes camera, returns to Home |
| TC-015 | Scan | Text input modal opens |
| TC-016 | Scan | Safe text → SYSTEM CLEAR |
| TC-017 | Scan | Scam message → THREAT INTERCEPTED |
| TC-018 | Scan | Phishing URL → THREAT INTERCEPTED |
| TC-019 | Scan | Electricity disconnect scam → THREAT INTERCEPTED |
| TC-020 | Scan | Clear results resets UI |
| TC-021 | Vault | Vault history entries load |
| TC-022 | Vault | Tapping entry shows threat details |
| TC-023 | Chat | Chat screen navigation works |
| TC-024 | Chat | Initial greeting message visible |
| TC-025 | Chat | Send message → AI responds |
| TC-026 | Chat | New Chat resets to greeting |
| TC-027 | Chat | Session history bar appears after chat |
| TC-028 | Chat | Session can be deleted |
| TC-029 | Premium | Premium screen navigation works |
| TC-030 | Premium | $3.99/mo pricing displayed |
| TC-031 | Premium | Upgrade Now opens Razorpay |

---

## ⚙️ Prerequisites

### 1. Install Appium Server v2

```powershell
npm install -g appium
appium driver install uiautomator2
appium --version
```

### 2. Set up Android Emulator or Real Device

- **Emulator**: Create via Android Studio → Device Manager → Pixel 6 API 34
- **Real Device**: Enable Developer Options → USB Debugging, then `adb devices`

### 3. Build & Install OmniGuard APK

```powershell
# Using EAS (cloud build)
npx eas-cli build --platform android --profile preview

# Or run on emulator directly
npx expo start --android
```

### 4. Install Python dependencies

```powershell
cd tests\appium
pip install -r requirements.txt
```

---

## 🚀 Running Tests

### Full Suite (all 31 tests)
```powershell
cd tests\appium
pytest
```

### Single module
```powershell
pytest tests/test_03_scan.py -v
```

### Specific test case
```powershell
pytest tests/test_03_scan.py::TestScan::test_analyze_scam_message_shows_threat_intercepted -v
```

### By marker (e.g., only scan tests)
```powershell
pytest -m scan -v
```

### Smoke tests only
```powershell
pytest -m smoke -v
```

---

## 📊 Excel Report

After every run, an Excel report is auto-generated at:

```
tests/appium/reports/OmniGuard_Appium_Android_Report_YYYYMMDD_HHMMSS.xlsx
```

**Sheet 1 — Summary**
- Total / Passed / Failed / Skipped counts
- Pass rate percentage
- Total execution time
- Colour-coded bar chart

**Sheet 2 — Test Details**
- Test ID, Module, Test Name
- Status (🟢 PASS / 🔴 FAIL / 🟠 SKIP)
- Duration in seconds
- Error messages for failed tests

---

## 🔧 Configuration

Edit `config.py` or create a `.env` file (copy `../.env.example`) to override:

| Variable | Default | Description |
|---|---|---|
| `APPIUM_SERVER_URL` | `http://127.0.0.1:4723` | Appium server URL |
| `ANDROID_DEVICE_NAME` | `emulator-5554` | Device serial |
| `ANDROID_PLATFORM_VERSION` | `14.0` | Android version |
| `OMNIGUARD_APK_PATH` | `None` (use installed app) | Path to .apk file |
| `OMNIGUARD_TEST_EMAIL` | `testuser@omniguard.dev` | Supabase test email |
| `OMNIGUARD_TEST_PASSWORD` | `TestPass123!` | Supabase test password |

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| `Connection refused` on Appium | Start Appium: `appium` in a separate terminal |
| `App not found` | Set `OMNIGUARD_APK_PATH` or install app manually |
| `Element not found` | Increase `EXPLICIT_WAIT` in `config.py` |
| `Authentication failed` | Update `TEST_EMAIL` / `TEST_PASSWORD` in `.env` |
| `uiautomator2 not found` | Run `appium driver install uiautomator2` |
