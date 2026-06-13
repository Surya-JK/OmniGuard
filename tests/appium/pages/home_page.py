"""
Home Page Object — Appium (Android)
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from appium.webdriver.common.appiumby import AppiumBy
import config


class HomePage:

    def __init__(self, driver):
        self.driver = driver
        self.wait   = WebDriverWait(driver, config.EXPLICIT_WAIT)

    # ── Locators ──────────────────────────────────────────────
    OMNIGUARD_TITLE  = (AppiumBy.XPATH, '//android.widget.TextView[@text="OmniGuard"]')
    CLOUD_SCANS_LBL  = (AppiumBy.XPATH, '//android.widget.TextView[@text="Cloud Scans"]')
    LIVE_THREATS_LBL = (AppiumBy.XPATH, '//android.widget.TextView[@text="Live Threats"]')
    SCAN_TRENDS_LBL  = (AppiumBy.XPATH, '//android.widget.TextView[@text="SCAN TRENDS"]')
    VAULT_BADGE      = (AppiumBy.XPATH, '//android.widget.TextView[contains(@text,"Vault")]')
    LOGOUT_BTN       = (AppiumBy.XPATH, '//android.widget.ImageView[@content-desc="log-out-outline"]')
    # Bento action buttons
    CAMERA_SCAN_BTN  = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"Camera") or contains(@text,"camera")]')
    TEXT_SCAN_BTN    = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"Text") or contains(@text,"Paste")]')
    GALLERY_SCAN_BTN = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"Gallery") or contains(@text,"Receipt")]')
    CHAT_BTN         = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"AI") or contains(@text,"Chat")]')
    PREMIUM_BTN      = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"PRO") or contains(@text,"Premium")]')
    # Vault modal
    VAULT_MODAL_CLOSE = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="CLOSE" or @text="Close"]')
    VAULT_EMPTY_TEXT  = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"No scans yet")]')

    # ── Wait helpers ──────────────────────────────────────────
    def wait_for_home(self):
        self.wait.until(EC.presence_of_element_located(self.CLOUD_SCANS_LBL))
        return self

    # ── Reads ─────────────────────────────────────────────────
    def get_cloud_scans_count(self) -> str:
        """Return the number shown below the Cloud Scans label."""
        # The counter is the sibling TextView immediately after the label
        el = self.wait.until(
            EC.presence_of_element_located(
                (AppiumBy.XPATH,
                 '//android.widget.TextView[@text="Cloud Scans"]/following-sibling::android.widget.TextView[1]')
            )
        )
        return el.text

    def get_live_threats_count(self) -> str:
        el = self.wait.until(
            EC.presence_of_element_located(
                (AppiumBy.XPATH,
                 '//android.widget.TextView[@text="Live Threats"]/following-sibling::*//android.widget.TextView[1]')
            )
        )
        return el.text

    def get_trend_banner_text(self) -> str:
        el = self.wait.until(EC.presence_of_element_located(self.SCAN_TRENDS_LBL))
        # Banner text is a sibling element
        banner = self.driver.find_element(
            AppiumBy.XPATH,
            '//android.widget.TextView[@text="SCAN TRENDS"]/following-sibling::android.widget.TextView[1]'
        )
        return banner.text

    # ── Actions ───────────────────────────────────────────────
    def open_vault(self):
        self.wait.until(EC.element_to_be_clickable(self.VAULT_BADGE)).click()
        return self

    def close_vault(self):
        try:
            self.wait.until(EC.element_to_be_clickable(self.VAULT_MODAL_CLOSE)).click()
        except Exception:
            # swipe down to close modal if button not found
            size = self.driver.get_window_size()
            self.driver.swipe(
                start_x=size["width"] // 2,
                start_y=size["height"] * 0.4,
                end_x=size["width"] // 2,
                end_y=size["height"] * 0.9,
                duration=500,
            )
        return self

    def tap_logout(self):
        self.wait.until(EC.element_to_be_clickable(self.LOGOUT_BTN)).click()
        return self

    def pull_to_refresh(self):
        """Swipe down from top of scroll view to trigger refresh."""
        size = self.driver.get_window_size()
        self.driver.swipe(
            start_x=size["width"] // 2,
            start_y=size["height"] * 0.35,
            end_x=size["width"] // 2,
            end_y=size["height"] * 0.75,
            duration=800,
        )
        return self

    def tap_open_camera(self):
        self.wait.until(EC.element_to_be_clickable(self.CAMERA_SCAN_BTN)).click()
        return self

    def tap_open_text_input(self):
        self.wait.until(EC.element_to_be_clickable(self.TEXT_SCAN_BTN)).click()
        return self

    def tap_open_chat(self):
        self.wait.until(EC.element_to_be_clickable(self.CHAT_BTN)).click()
        return self

    def tap_open_premium(self):
        self.wait.until(EC.element_to_be_clickable(self.PREMIUM_BTN)).click()
        return self

    # ── Assertions ────────────────────────────────────────────
    def is_home_visible(self) -> bool:
        try:
            self.wait.until(EC.presence_of_element_located(self.OMNIGUARD_TITLE))
            return True
        except Exception:
            return False

    def is_vault_open(self) -> bool:
        try:
            WebDriverWait(self.driver, config.SHORT_WAIT).until(
                EC.presence_of_element_located(self.VAULT_MODAL_CLOSE)
            )
            return True
        except Exception:
            return False
