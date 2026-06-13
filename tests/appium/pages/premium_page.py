"""
Premium Page Object — Appium (Android)
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from appium.webdriver.common.appiumby import AppiumBy
import config


class PremiumPage:

    def __init__(self, driver):
        self.driver = driver
        self.wait   = WebDriverWait(driver, config.EXPLICIT_WAIT)

    # ── Locators ──────────────────────────────────────────────
    HEADER_TITLE   = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Upgrade to PRO"]')
    BACK_BTN       = (AppiumBy.XPATH,
        '//android.widget.ImageView[@content-desc="arrow-back"]')
    PRICE_DISPLAY  = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="3.99"]')
    PRICE_PERIOD   = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="/mo"]')
    UPGRADE_BTN    = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="UPGRADE NOW"]')
    VERIFY_BTN     = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="VERIFY PAYMENT"]')
    FEATURE_UNLIMTED = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Unlimited AI Threat Scans"]')
    FOOTER_TEXT    = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"Terms of Service")]')
    BILLING_TEXT   = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Billed monthly. Cancel anytime."]')

    # ── Actions ───────────────────────────────────────────────
    def wait_for_premium_screen(self):
        self.wait.until(EC.presence_of_element_located(self.HEADER_TITLE))
        return self

    def go_back(self):
        self.wait.until(EC.element_to_be_clickable(self.BACK_BTN)).click()
        return self

    def tap_upgrade_now(self):
        self.wait.until(EC.element_to_be_clickable(self.UPGRADE_BTN)).click()
        return self

    def tap_verify_payment(self):
        self.wait.until(EC.element_to_be_clickable(self.VERIFY_BTN)).click()
        return self

    # ── Assertions ────────────────────────────────────────────
    def is_premium_screen_visible(self) -> bool:
        try:
            self.wait.until(EC.presence_of_element_located(self.HEADER_TITLE))
            return True
        except Exception:
            return False

    def get_displayed_price(self) -> str:
        el = self.wait.until(EC.presence_of_element_located(self.PRICE_DISPLAY))
        return el.text

    def is_upgrade_button_visible(self) -> bool:
        try:
            self.driver.find_element(*self.UPGRADE_BTN)
            return True
        except Exception:
            return False

    def are_all_features_listed(self) -> bool:
        features = [
            "Unlimited AI Threat Scans",
            "Unlimited Forensic Chat",
            "Priority Cloud Sync",
            "Zero-Day Protection",
        ]
        for feat in features:
            els = self.driver.find_elements(
                AppiumBy.XPATH, f'//android.widget.TextView[@text="{feat}"]'
            )
            if not els:
                return False
        return True
