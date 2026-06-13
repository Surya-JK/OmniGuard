"""
Scan Page Object — Appium (Android)
Covers: camera view, QR mode, text-input modal, result card
"""
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from appium.webdriver.common.appiumby import AppiumBy
import config


class ScanPage:

    def __init__(self, driver):
        self.driver = driver
        self.wait   = WebDriverWait(driver, config.EXPLICIT_WAIT)

    # ── Camera Locators ───────────────────────────────────────
    TEXT_MODE_TAB   = (AppiumBy.XPATH, '//android.widget.TextView[contains(@text,"Document")]')
    QR_MODE_TAB     = (AppiumBy.XPATH, '//android.widget.TextView[contains(@text,"QR Payload")]')
    CAMERA_CLOSE_X  = (AppiumBy.XPATH, '//android.widget.TextView[@text="✕"]')
    CAPTURE_BTN     = (AppiumBy.XPATH, '//android.view.View[@content-desc="capture"]')
    GALLERY_ICON    = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"🖼️")]')
    SCANNING_TEXT   = (AppiumBy.XPATH, '//android.widget.TextView[@text="Scanning..."]')

    # ── Text Input Modal Locators ─────────────────────────────
    TEXT_MODAL_INPUT   = (AppiumBy.XPATH,
        '//android.widget.EditText[contains(@hint,"Enter") or contains(@hint,"text")]')
    TEXT_MODAL_ANALYZE = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Analyze" or @text="ANALYZE"]')
    TEXT_MODAL_CLOSE   = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Cancel" or @text="CANCEL" or @text="✕"]')

    # ── Result Card Locators ──────────────────────────────────
    RESULT_DANGER  = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="🚨 THREAT INTERCEPTED"]')
    RESULT_SAFE    = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="✅ SYSTEM CLEAR"]')
    ANALYZING_TEXT = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Analyzing Forensics..."]')
    CLEAR_BTN      = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Clear" or @text="CLEAR" or contains(@text,"Reset")]')
    REPORT_CLOUD_BTN = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Report to Cloud" or contains(@text,"Report")]')
    TARGET_ENTITY  = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Target Entity:"]')

    # ── Camera Actions ────────────────────────────────────────
    def is_camera_open(self) -> bool:
        try:
            WebDriverWait(self.driver, config.SHORT_WAIT).until(
                EC.presence_of_element_located(self.TEXT_MODE_TAB)
            )
            return True
        except Exception:
            return False

    def switch_to_qr_mode(self):
        self.wait.until(EC.element_to_be_clickable(self.QR_MODE_TAB)).click()
        return self

    def switch_to_text_mode(self):
        self.wait.until(EC.element_to_be_clickable(self.TEXT_MODE_TAB)).click()
        return self

    def close_camera(self):
        self.wait.until(EC.element_to_be_clickable(self.CAMERA_CLOSE_X)).click()
        return self

    def is_qr_mode_active(self) -> bool:
        try:
            # QR tab has a different background/highlight when active
            self.driver.find_element(
                AppiumBy.XPATH,
                '//android.widget.TextView[contains(@text,"QR Payload") and contains(@style,"selected")]'
            )
            return True
        except Exception:
            # Fallback: check if "Scanning..." text appears (QR auto-scan state)
            try:
                WebDriverWait(self.driver, config.SHORT_WAIT).until(
                    EC.presence_of_element_located(self.SCANNING_TEXT)
                )
                return True
            except Exception:
                return False

    # ── Text Input Modal ──────────────────────────────────────
    def enter_text_for_analysis(self, text: str):
        field = self.wait.until(EC.presence_of_element_located(self.TEXT_MODAL_INPUT))
        field.clear()
        field.send_keys(text)
        return self

    def tap_analyze_text(self):
        self.wait.until(EC.element_to_be_clickable(self.TEXT_MODAL_ANALYZE)).click()
        return self

    def close_text_modal(self):
        try:
            self.driver.find_element(*self.TEXT_MODAL_CLOSE).click()
        except Exception:
            pass
        return self

    # ── Result helpers ────────────────────────────────────────
    def wait_for_result(self, timeout: int = config.LONG_WAIT) -> str:
        """Wait until either DANGER or SAFE result is shown, return the status."""
        wait = WebDriverWait(self.driver, timeout)
        wait.until(
            lambda d: (
                len(d.find_elements(*self.RESULT_DANGER)) > 0 or
                len(d.find_elements(*self.RESULT_SAFE)) > 0
            )
        )
        if self.driver.find_elements(*self.RESULT_DANGER):
            return "DANGER"
        return "SAFE"

    def get_threat_reason(self) -> str | None:
        try:
            el = self.driver.find_element(
                AppiumBy.XPATH,
                '//android.widget.TextView[@text="Threat Signal:"]/following-sibling::android.widget.TextView[1]'
            )
            return el.text
        except Exception:
            return None

    def tap_clear_results(self):
        self.wait.until(EC.element_to_be_clickable(self.CLEAR_BTN)).click()
        return self

    def tap_report_to_cloud(self):
        self.wait.until(EC.element_to_be_clickable(self.REPORT_CLOUD_BTN)).click()
        return self

    def is_result_cleared(self) -> bool:
        """After clear, the preview image & result card should disappear."""
        try:
            WebDriverWait(self.driver, config.SHORT_WAIT).until(
                EC.invisibility_of_element_located(self.RESULT_SAFE)
            )
            return True
        except Exception:
            return False
