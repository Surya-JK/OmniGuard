# OmniGuard — E2E Test Suites

This directory contains two independent, fully automated test suites:

| Suite | Target | Tests | Language | Framework |
|---|---|---|---|---|
| [`appium/`](appium/README.md) | Android Mobile App | **31 test cases** | **Python** | Appium v2 + pytest |
| [`selenium/`](selenium/README.md) | Web App (Vercel / Local) | **23 test cases** | **Node.js** | selenium-webdriver + Jest |

Both suites generate a styled **Excel `.xlsx` report** with pass/fail analysis and charts.

---

## Quick Start

### 1. Copy environment template

```powershell
copy tests\.env.example tests\appium\.env
copy tests\.env.example tests\selenium\.env
```

Fill in your Supabase test credentials in each `.env` file.

### 2. Appium (Android)

```powershell
# Install dependencies
cd tests\appium
pip install -r requirements.txt

# Start Appium server (new terminal)
appium

# Run all 31 tests
pytest
```

> **Report**: `tests/appium/reports/OmniGuard_Appium_Android_Report_*.xlsx`

### 3. Selenium (Web)

```powershell
cd tests\selenium
pip install -r requirements.txt

# Run all 23 tests
pytest
```

> **Report**: `tests/selenium/reports/OmniGuard_Selenium_Web_Report_*.xlsx`

---

## Report Format

Both suites produce identical two-sheet Excel workbooks:

- **Sheet 1 — Summary**: KPI boxes (Total / Passed / Failed / Skipped / Pass-Rate% / Duration) + bar chart
- **Sheet 2 — Test Details**: per-test table with Test ID, Module, Name, Status (colour-coded), Duration, Error notes

---

## Architecture

```
tests/
├── .env.example            # Environment variable template
├── appium/                 # Android Mobile E2E Suite
│   ├── config.py
│   ├── conftest.py
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── README.md
│   ├── pages/              # Page Object Model
│   ├── tests/              # Test modules (test_01 – test_06)
│   ├── utils/              # Excel report generator
│   └── reports/            # Generated .xlsx files
└── selenium/               # Web E2E Suite
    ├── config.py
    ├── conftest.py
    ├── pytest.ini
    ├── requirements.txt
    ├── README.md
    ├── pages/              # Page Object Model
    ├── tests/              # Test modules (test_01 – test_05)
    ├── utils/              # Excel report generator
    └── reports/            # Generated .xlsx files
```
