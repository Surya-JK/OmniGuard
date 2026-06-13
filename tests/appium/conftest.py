"""
OmniGuard — Appium conftest.py
==============================
Shared pytest fixtures:
  - driver : Appium WebDriver session
  - logged_in_driver : driver that has already authenticated
"""

import pytest
from appium import webdriver
from appium.options import AppiumOptions
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

import config


# ──────────────────────────────────────────────────────────────
# Build Appium Desired Capabilities
# ──────────────────────────────────────────────────────────────
def _build_options() -> AppiumOptions:
    opts = AppiumOptions()
    opts.platform_name   = config.PLATFORM_NAME
    opts.device_name     = config.DEVICE_NAME
    opts.platform_version = config.PLATFORM_VERSION
    opts.automation_name = config.AUTOMATION_NAME

    if config.APP_PATH:
        opts.app = config.APP_PATH
    else:
        opts.app_package  = config.APP_PACKAGE
        opts.app_activity = config.APP_ACTIVITY

    opts.no_reset               = config.NO_RESET
    opts.auto_grant_permissions = config.AUTO_GRANT_PERMISSIONS
    return opts


# ──────────────────────────────────────────────────────────────
# Raw driver (app starts fresh / from current state)
# ──────────────────────────────────────────────────────────────
@pytest.fixture(scope="function")
def driver():
    """Launch Appium driver for a single test function."""
    drv = webdriver.Remote(
        command_executor=config.APPIUM_SERVER_URL,
        options=_build_options(),
    )
    drv.implicitly_wait(config.IMPLICIT_WAIT)
    yield drv
    drv.quit()


# ──────────────────────────────────────────────────────────────
# Pre-authenticated driver
# ──────────────────────────────────────────────────────────────
@pytest.fixture(scope="function")
def logged_in_driver(driver):
    """
    Performs login before handing the driver to the test.
    Assumes the app opens on the Login screen.
    """
    wait = WebDriverWait(driver, config.EXPLICIT_WAIT)

    # Wait for the Email field and enter credentials
    email_field = wait.until(
        EC.presence_of_element_located(
            (AppiumBy.XPATH, '//android.widget.EditText[@hint="Email Address"]')
        )
    )
    email_field.click()
    email_field.send_keys(config.TEST_EMAIL)

    password_field = driver.find_element(
        AppiumBy.XPATH, '//android.widget.EditText[@hint="Password"]'
    )
    password_field.click()
    password_field.send_keys(config.TEST_PASSWORD)

    # Tap AUTHENTICATE button
    auth_btn = wait.until(
        EC.element_to_be_clickable(
            (AppiumBy.XPATH, '//android.widget.TextView[@text="AUTHENTICATE"]')
        )
    )
    auth_btn.click()

    # Wait until home screen appears (Cloud Scans label)
    wait.until(
        EC.presence_of_element_located(
            (AppiumBy.XPATH, '//android.widget.TextView[@text="Cloud Scans"]')
        )
    )

    yield driver


# ──────────────────────────────────────────────────────────────
# pytest hooks — collect results for Excel report
# ──────────────────────────────────────────────────────────────
_test_results: list[dict] = []


def pytest_runtest_logreport(report):
    """Capture outcome of each test phase (setup/call/teardown)."""
    if report.when == "call":
        _test_results.append(
            {
                "nodeid":   report.nodeid,
                "outcome":  report.outcome.upper(),
                "duration": round(report.duration, 3),
                "longrepr": str(report.longrepr) if report.failed else "",
            }
        )


def pytest_sessionfinish(session, exitstatus):
    """After all tests, generate the JSON report."""
    import json
    import os
    from pathlib import Path
    
    out_dir = Path(__file__).parent / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "appium_results.json"
    
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(_test_results, f, indent=2)
        
    print(f"\n✅ Appium results saved → {out_path}")
