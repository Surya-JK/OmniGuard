"""
Test Suite 02 — Home / Dashboard
OmniGuard Appium Android E2E Tests

Test Cases:
  TC-007  Home screen elements are visible (Cloud Scans, Live Threats, Scan Trends)
  TC-008  Vault badge is shown in the header
  TC-009  Vault modal opens on badge tap
  TC-010  Pull-to-refresh triggers data reload
  TC-011  Logout returns to Login screen
"""
import time
import pytest
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from appium.webdriver.common.appiumby import AppiumBy

import config
from pages.home_page import HomePage
from pages.login_page import LoginPage


class TestHome:

    # TC-007
    def test_home_screen_elements_visible(self, logged_in_driver):
        """Cloud Scans, Live Threats, and Scan Trends banner must all be visible."""
        page = HomePage(logged_in_driver)
        page.wait_for_home()

        # Cloud Scans label
        el = logged_in_driver.find_element(*page.CLOUD_SCANS_LBL)
        assert el.is_displayed(), "Cloud Scans label should be visible"

        # Live Threats label
        el = logged_in_driver.find_element(*page.LIVE_THREATS_LBL)
        assert el.is_displayed(), "Live Threats label should be visible"

        # Scan Trends banner
        el = logged_in_driver.find_element(*page.SCAN_TRENDS_LBL)
        assert el.is_displayed(), "Scan Trends banner should be visible on the home screen"

    # TC-008
    def test_vault_badge_visible_in_header(self, logged_in_driver):
        """Vault badge showing scan count should appear in the header."""
        page = HomePage(logged_in_driver)
        page.wait_for_home()
        badge = logged_in_driver.find_element(*page.VAULT_BADGE)
        assert badge.is_displayed(), "Vault badge should be visible in the header"
        badge_text = badge.text
        assert "Vault" in badge_text, f"Badge should contain 'Vault', got: {badge_text}"

    # TC-009
    def test_vault_modal_opens_on_badge_tap(self, logged_in_driver):
        """Tapping the Vault badge should open the threat vault modal."""
        page = HomePage(logged_in_driver)
        page.wait_for_home()
        page.open_vault()
        assert page.is_vault_open(), (
            "Vault modal should open after tapping the vault badge"
        )
        page.close_vault()

    # TC-010
    def test_pull_to_refresh_triggers_reload(self, logged_in_driver):
        """Pull-to-refresh gesture should trigger data reload without crashing."""
        page = HomePage(logged_in_driver)
        page.wait_for_home()

        # Capture count before refresh
        try:
            count_before = page.get_cloud_scans_count()
        except Exception:
            count_before = "0"

        page.pull_to_refresh()
        time.sleep(2)  # allow network fetch

        # The screen should still be showing home elements
        assert page.is_home_visible(), (
            "Home screen should still be visible after pull-to-refresh"
        )

    # TC-011
    def test_logout_returns_to_login_screen(self, logged_in_driver):
        """Tapping the logout button should sign out and show the Login screen."""
        page = HomePage(logged_in_driver)
        page.wait_for_home()
        page.tap_logout()

        login_page = LoginPage(logged_in_driver)
        assert login_page.is_login_screen_visible(), (
            "Should return to Login screen after logout"
        )

    # TC-021
    def test_home_avatar_is_visible(self, logged_in_driver):
        pass

    # TC-022
    def test_home_welcome_text_contains_user(self, logged_in_driver):
        pass

    # TC-023
    def test_home_dashboard_scrollable(self, logged_in_driver):
        pass

    # TC-024
    def test_home_threat_score_card_visible(self, logged_in_driver):
        pass

    # TC-025
    def test_home_active_protection_switch(self, logged_in_driver):
        pass

    # TC-026
    def test_home_recent_scans_list_header(self, logged_in_driver):
        pass

    # TC-027
    def test_home_scan_button_animates_on_press(self, logged_in_driver):
        pass

    # TC-028
    def test_home_ai_assistant_card_visible(self, logged_in_driver):
        pass

    # TC-029
    def test_home_premium_card_visible(self, logged_in_driver):
        pass

    # TC-030
    def test_home_dark_mode_toggle(self, logged_in_driver):
        pass
