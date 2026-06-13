"""
OmniGuard — Appium Android Test Configuration
==============================================
Edit these values to match your local setup.
Sensitive values can also be stored in a .env file and read via python-dotenv.
"""

import os
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# Appium Server
# ──────────────────────────────────────────────────────────────
APPIUM_SERVER_URL = os.getenv("APPIUM_SERVER_URL", "http://127.0.0.1:4723")

# ──────────────────────────────────────────────────────────────
# Android Device / Emulator
# ──────────────────────────────────────────────────────────────
PLATFORM_NAME   = "Android"
DEVICE_NAME     = os.getenv("ANDROID_DEVICE_NAME", "emulator-5554")
PLATFORM_VERSION = os.getenv("ANDROID_PLATFORM_VERSION", "14.0")
AUTOMATION_NAME = "UiAutomator2"

# App identifiers (used when app is already installed)
APP_PACKAGE  = "com.surya06.omniguard"
APP_ACTIVITY = ".MainActivity"

# Optional: absolute path to a local .apk file.
# If set, Appium will install the APK before running tests.
# Leave as None to use the already-installed app on device.
APP_PATH = os.getenv("OMNIGUARD_APK_PATH", None)
# APP_PATH = r"C:\path\to\OmniGuard.apk"   # ← uncomment and fill in

# ──────────────────────────────────────────────────────────────
# Desired Capabilities Extras
# ──────────────────────────────────────────────────────────────
NO_RESET      = True   # Don't clear app state between sessions
AUTO_GRANT_PERMISSIONS = True

# ──────────────────────────────────────────────────────────────
# Test Credentials (Supabase test account)
# ──────────────────────────────────────────────────────────────
TEST_EMAIL    = os.getenv("OMNIGUARD_TEST_EMAIL",    "testuser@omniguard.dev")
TEST_PASSWORD = os.getenv("OMNIGUARD_TEST_PASSWORD", "TestPass123!")

INVALID_EMAIL    = "bad@notreal.xyz"
INVALID_PASSWORD = "wrongpassword"

# ──────────────────────────────────────────────────────────────
# Timeouts (seconds)
# ──────────────────────────────────────────────────────────────
IMPLICIT_WAIT   = 10
EXPLICIT_WAIT   = 20
SHORT_WAIT      = 5
LONG_WAIT       = 30

# ──────────────────────────────────────────────────────────────
# Test Data — Threat Scenarios
# ──────────────────────────────────────────────────────────────
SAFE_TEXT = "Hello, how are you doing today? Let's meet at the cafe."

SCAM_TEXT = (
    "Dear Customer, your electricity connection will be disconnected tonight. "
    "Call 9876543210 immediately to update your KYC and avoid disconnection."
)

PHISHING_URL_TEXT = (
    "Your account is blocked. Update your KYC now: "
    "http://secure-kyc-update.online/login to avoid suspension."
)

EMPLOYMENT_SCAM_TEXT = (
    "Congratulations! You have been shortlisted for a work from home part time job. "
    "Earn Rs 500 per hour. Pay a small registration fee to get started."
)

QR_SCAM_PAYLOAD = "upi://pay?pa=support@scammer&pn=FakeMerchant&am=9999&cu=INR"

# ──────────────────────────────────────────────────────────────
# Reports Directory
# ──────────────────────────────────────────────────────────────
REPORTS_DIR = Path(__file__).parent / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
