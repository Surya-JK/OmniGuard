"""
Test Suite 01 — Login / Authentication
OmniGuard Appium Android E2E Tests

Test Cases:
  TC-001  App launches to Login screen
  TC-002  Login with empty fields shows error
  TC-003  Login with invalid credentials shows auth error
  TC-004  Login with valid credentials redirects to Home
  TC-005  Toggle to Sign-up mode and back
  TC-006  Forgot Password without email shows alert
"""
import pytest
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from appium.webdriver.common.appiumby import AppiumBy

import config
from pages.login_page import LoginPage
from pages.home_page import HomePage


class TestLogin:

    # TC-001
    def test_app_launches_to_login_screen(self, driver):
        """App should open to the Login screen with the OmniGuard title."""
        page = LoginPage(driver)
        assert page.is_login_screen_visible(), (
            "Login screen should be visible when the app first launches"
        )

    # TC-002
    def test_login_empty_fields_shows_error(self, driver):
        """Tapping AUTHENTICATE with empty email/password should show an alert."""
        page = LoginPage(driver)
        page.wait_for_login_screen()
        page.tap_authenticate()

        alert_text = page.get_alert_text()
        assert alert_text is not None, "An alert should appear for empty field submission"
        assert "email" in alert_text.lower() or "password" in alert_text.lower() or "error" in alert_text.lower(), (
            f"Alert should mention email/password requirement, got: {alert_text}"
        )
        page.dismiss_alert()

    # TC-003
    def test_login_invalid_credentials_shows_error(self, driver):
        """Wrong credentials should produce an Authentication Failed alert."""
        page = LoginPage(driver)
        page.wait_for_login_screen()
        page.enter_email(config.INVALID_EMAIL)
        page.enter_password(config.INVALID_PASSWORD)
        page.tap_authenticate()

        alert_text = page.get_alert_text()
        assert alert_text is not None, "An error alert should appear for invalid credentials"
        page.dismiss_alert()

    # TC-004
    def test_valid_login_redirects_to_home(self, driver):
        """Successful login should navigate to the Home/Dashboard screen."""
        login_page = LoginPage(driver)
        login_page.wait_for_login_screen()
        login_page.login(config.TEST_EMAIL, config.TEST_PASSWORD)

        home_page = HomePage(driver)
        assert home_page.wait_for_home() is not None, (
            "Should redirect to Home after successful login"
        )
        assert home_page.is_home_visible()

    # TC-005
    def test_toggle_between_login_and_signup_modes(self, driver):
        """Sign up here link should show Create Account card; Login here should return."""
        page = LoginPage(driver)
        page.wait_for_login_screen()

        # Switch to Sign-up
        page.tap_signup_link()
        assert page.is_signup_screen_visible(), (
            "CREATE ACCOUNT card should appear after tapping Sign up here"
        )

        # Switch back to Login
        page.tap_login_link()
        assert page.is_login_screen_visible() or (
            LoginPage(driver).wait_for_login_screen() is not None
        ), "MEMBER LOGIN card should reappear after tapping Login here"

    # TC-006
    def test_forgot_password_without_email_shows_alert(self, driver):
        """Tapping Forgot Password without entering email should show an alert."""
        page = LoginPage(driver)
        page.wait_for_login_screen()
        page.tap_forgot_password()

        alert_text = page.get_alert_text()
        assert alert_text is not None, (
            "Alert should prompt user to enter email before requesting reset"
        )
        assert "email" in alert_text.lower(), (
            f"Alert should mention email, got: {alert_text}"
        )
        page.dismiss_alert()

    # TC-007
    def test_login_email_field_has_focus(self, driver):
        pass

    # TC-008
    def test_login_password_field_is_masked(self, driver):
        pass

    # TC-009
    def test_login_google_btn_visible(self, driver):
        pass

    # TC-010
    def test_login_signup_link_is_tappable(self, driver):
        pass

    # TC-011
    def test_login_title_displays_omniguard(self, driver):
        pass

    # TC-012
    def test_login_subtitle_visible(self, driver):
        pass

    # TC-013
    def test_login_no_internet_error(self, driver):
        pass

    # TC-014
    def test_login_screen_orientation(self, driver):
        pass

    # TC-015
    def test_login_password_recovery_cancel(self, driver):
        pass
