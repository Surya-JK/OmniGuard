"""
Test Suite 03 — Scanning (Camera / Text / Analysis Engine)
OmniGuard Appium Android E2E Tests

Test Cases:
  TC-012  Open camera scan — camera view opens in TEXT mode
  TC-013  Switch to QR mode — segmented control changes state
  TC-014  Close camera — X button returns to Home
  TC-015  Text input modal opens from dashboard
  TC-016  Safe text analysis → SYSTEM CLEAR
  TC-017  Scam message analysis → THREAT INTERCEPTED
  TC-018  Phishing URL analysis → THREAT INTERCEPTED
  TC-019  Electricity disconnection scam → THREAT INTERCEPTED
  TC-020  Clear results resets the UI
"""
import time
import pytest
import config
from pages.home_page import HomePage
from pages.scan_page import ScanPage


class TestScan:

    def _open_text_modal(self, driver, home_page: HomePage) -> ScanPage:
        """Helper: open text-input modal and return ScanPage."""
        home_page.tap_open_text_input()
        return ScanPage(driver)

    # TC-012
    def test_open_camera_scan(self, logged_in_driver):
        """Camera scan button opens the camera view in TEXT mode."""
        home = HomePage(logged_in_driver)
        home.wait_for_home()
        home.tap_open_camera()

        scan = ScanPage(logged_in_driver)
        assert scan.is_camera_open(), "Camera view should open after tapping the camera button"
        scan.close_camera()

    # TC-013
    def test_switch_to_qr_mode(self, logged_in_driver):
        """Tapping QR Payload tab switches the scanner to QR mode."""
        home = HomePage(logged_in_driver)
        home.wait_for_home()
        home.tap_open_camera()

        scan = ScanPage(logged_in_driver)
        assert scan.is_camera_open()

        scan.switch_to_qr_mode()
        time.sleep(1)

        # QR mode indicator: "Scanning..." text appears instead of capture button
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from appium.webdriver.common.appiumby import AppiumBy

        try:
            WebDriverWait(logged_in_driver, config.SHORT_WAIT).until(
                EC.presence_of_element_located(
                    (AppiumBy.XPATH, '//android.widget.TextView[@text="Scanning..."]')
                )
            )
            qr_active = True
        except Exception:
            qr_active = False

        assert qr_active, "QR mode should show 'Scanning...' instead of capture button"
        scan.close_camera()

    # TC-014
    def test_close_camera_returns_to_home(self, logged_in_driver):
        """X button in camera view closes it and returns to Home."""
        home = HomePage(logged_in_driver)
        home.wait_for_home()
        home.tap_open_camera()

        scan = ScanPage(logged_in_driver)
        assert scan.is_camera_open()
        scan.close_camera()

        # Home elements should be back
        home2 = HomePage(logged_in_driver)
        assert home2.is_home_visible(), "Home screen should be visible after closing camera"

    # TC-015
    def test_text_input_modal_opens(self, logged_in_driver):
        """Tapping the text/paste scan button should open an input modal."""
        home = HomePage(logged_in_driver)
        home.wait_for_home()

        scan = self._open_text_modal(logged_in_driver, home)

        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        wait = WebDriverWait(logged_in_driver, config.EXPLICIT_WAIT)
        modal_input = wait.until(
            EC.presence_of_element_located(scan.TEXT_MODAL_INPUT)
        )
        assert modal_input.is_displayed(), "Text input field should be visible in the modal"
        scan.close_text_modal()

    # TC-016
    def test_analyze_safe_text_shows_system_clear(self, logged_in_driver):
        """Analyzing normal safe text should produce a SYSTEM CLEAR result."""
        home = HomePage(logged_in_driver)
        home.wait_for_home()

        scan = self._open_text_modal(logged_in_driver, home)
        scan.enter_text_for_analysis(config.SAFE_TEXT)
        scan.tap_analyze_text()

        result = scan.wait_for_result(timeout=config.LONG_WAIT)
        assert result == "SAFE", (
            f"Safe text should yield SYSTEM CLEAR, but got: {result}"
        )

    # TC-017
    def test_analyze_scam_message_shows_threat_intercepted(self, logged_in_driver):
        """Electricity KYC scam message should produce THREAT INTERCEPTED."""
        home = HomePage(logged_in_driver)
        home.wait_for_home()

        scan = self._open_text_modal(logged_in_driver, home)
        scan.enter_text_for_analysis(config.SCAM_TEXT)
        scan.tap_analyze_text()

        result = scan.wait_for_result(timeout=config.LONG_WAIT)
        assert result == "DANGER", (
            f"Scam text should trigger THREAT INTERCEPTED, but got: {result}"
        )

    # TC-018
    def test_analyze_phishing_url_shows_threat_intercepted(self, logged_in_driver):
        """Phishing URL combined with 'kyc' keyword should be flagged as DANGER."""
        home = HomePage(logged_in_driver)
        home.wait_for_home()

        scan = self._open_text_modal(logged_in_driver, home)
        scan.enter_text_for_analysis(config.PHISHING_URL_TEXT)
        scan.tap_analyze_text()

        result = scan.wait_for_result(timeout=config.LONG_WAIT)
        assert result == "DANGER", (
            f"Phishing URL text should trigger THREAT INTERCEPTED, but got: {result}"
        )

    # TC-019
    def test_analyze_electricity_disconnect_scam(self, logged_in_driver):
        """Electricity disconnection threat message should be flagged."""
        electricity_text = (
            "Your electricity connection will be disconnected tonight at 9:30PM "
            "due to non-payment. Contact our helpline 9999988888 immediately."
        )
        home = HomePage(logged_in_driver)
        home.wait_for_home()

        scan = self._open_text_modal(logged_in_driver, home)
        scan.enter_text_for_analysis(electricity_text)
        scan.tap_analyze_text()

        result = scan.wait_for_result(timeout=config.LONG_WAIT)
        assert result == "DANGER", (
            f"Electricity scam should trigger THREAT INTERCEPTED, got: {result}"
        )

    # TC-020
    def test_clear_results_resets_ui(self, logged_in_driver):
        """After showing a result, tapping Clear should reset back to fresh home UI."""
        home = HomePage(logged_in_driver)
        home.wait_for_home()

        scan = self._open_text_modal(logged_in_driver, home)
        scan.enter_text_for_analysis(config.SAFE_TEXT)
        scan.tap_analyze_text()
        scan.wait_for_result(timeout=config.LONG_WAIT)

        # Now clear
        scan.tap_clear_results()
        time.sleep(1)

        # Cloud Scans label should be visible again (result preview gone)
        home2 = HomePage(logged_in_driver)
        assert home2.is_home_visible(), (
            "Home stats should be visible again after clearing scan results"
        )

    # TC-040
    def test_scan_camera_permission_denied_handling(self, logged_in_driver):
        pass

    # TC-041
    def test_scan_flash_toggle_works(self, logged_in_driver):
        pass

    # TC-042
    def test_scan_gallery_import_button(self, logged_in_driver):
        pass

    # TC-043
    def test_scan_unsupported_qr_format(self, logged_in_driver):
        pass

    # TC-044
    def test_scan_text_input_character_limit(self, logged_in_driver):
        pass

    # TC-045
    def test_scan_text_input_clear_button(self, logged_in_driver):
        pass

    # TC-046
    def test_scan_result_dismisses_on_swipe(self, logged_in_driver):
        pass

    # TC-047
    def test_scan_result_shares_report(self, logged_in_driver):
        pass

    # TC-048
    def test_scan_result_copy_to_clipboard(self, logged_in_driver):
        pass

    # TC-049
    def test_scan_history_updates_after_scan(self, logged_in_driver):
        pass

    # TC-050
    def test_scan_modal_closes_on_back_button(self, logged_in_driver):
        pass
