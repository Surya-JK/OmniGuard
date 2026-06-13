"""
Login Page Object — Appium (Android)
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from appium.webdriver.common.appiumby import AppiumBy
import config


class LoginPage:

    def __init__(self, driver):
        self.driver = driver
        self.wait   = WebDriverWait(driver, config.EXPLICIT_WAIT)

    # ── Locators ──────────────────────────────────────────────
    EMAIL_FIELD     = (AppiumBy.XPATH, '//android.widget.EditText[@hint="Email Address"]')
    PASSWORD_FIELD  = (AppiumBy.XPATH, '//android.widget.EditText[@hint="Password"]')
    AUTH_BUTTON     = (AppiumBy.XPATH, '//android.widget.TextView[@text="AUTHENTICATE"]')
    REGISTER_BUTTON = (AppiumBy.XPATH, '//android.widget.TextView[@text="REGISTER"]')
    GOOGLE_BUTTON   = (AppiumBy.XPATH, '//android.widget.TextView[contains(@text,"Continue with Google")]')
    SIGNUP_LINK     = (AppiumBy.XPATH, '//android.widget.TextView[contains(@text,"Sign up here")]')
    LOGIN_LINK      = (AppiumBy.XPATH, '//android.widget.TextView[contains(@text,"Login here")]')
    CARD_HEADER     = (AppiumBy.XPATH, '//android.widget.TextView[@text="MEMBER LOGIN"]')
    CREATE_HEADER   = (AppiumBy.XPATH, '//android.widget.TextView[@text="CREATE ACCOUNT"]')
    RESET_HEADER    = (AppiumBy.XPATH, '//android.widget.TextView[@text="RESET PASSWORD"]')
    FORGOT_PASSWORD = (AppiumBy.XPATH, '//android.widget.TextView[@text="Forgot Password?"]')
    OMNIGUARD_TITLE = (AppiumBy.XPATH, '//android.widget.TextView[@text="OmniGuard"]')

    # ── Actions ───────────────────────────────────────────────
    def wait_for_login_screen(self):
        self.wait.until(EC.presence_of_element_located(self.CARD_HEADER))
        return self

    def enter_email(self, email: str):
        field = self.wait.until(EC.presence_of_element_located(self.EMAIL_FIELD))
        field.clear()
        field.send_keys(email)
        return self

    def enter_password(self, password: str):
        field = self.driver.find_element(*self.PASSWORD_FIELD)
        field.clear()
        field.send_keys(password)
        return self

    def tap_authenticate(self):
        self.wait.until(EC.element_to_be_clickable(self.AUTH_BUTTON)).click()
        return self

    def tap_register(self):
        self.wait.until(EC.element_to_be_clickable(self.REGISTER_BUTTON)).click()
        return self

    def tap_google_login(self):
        self.wait.until(EC.element_to_be_clickable(self.GOOGLE_BUTTON)).click()
        return self

    def tap_signup_link(self):
        self.wait.until(EC.element_to_be_clickable(self.SIGNUP_LINK)).click()
        return self

    def tap_login_link(self):
        self.wait.until(EC.element_to_be_clickable(self.LOGIN_LINK)).click()
        return self

    def tap_forgot_password(self):
        self.wait.until(EC.element_to_be_clickable(self.FORGOT_PASSWORD)).click()
        return self

    def login(self, email: str, password: str):
        self.enter_email(email)
        self.enter_password(password)
        self.tap_authenticate()
        return self

    # ── Assertions ────────────────────────────────────────────
    def is_login_screen_visible(self) -> bool:
        try:
            self.wait.until(EC.presence_of_element_located(self.OMNIGUARD_TITLE))
            return True
        except Exception:
            return False

    def is_signup_screen_visible(self) -> bool:
        try:
            self.wait.until(EC.presence_of_element_located(self.CREATE_HEADER))
            return True
        except Exception:
            return False

    def get_alert_text(self) -> str | None:
        """Capture Android native alert text if present."""
        try:
            alert = WebDriverWait(self.driver, config.SHORT_WAIT).until(
                EC.presence_of_element_located(
                    (AppiumBy.XPATH, '//android.widget.TextView[@resource-id="android:id/message"]')
                )
            )
            return alert.text
        except Exception:
            return None

    def dismiss_alert(self):
        try:
            ok_btn = self.driver.find_element(
                AppiumBy.XPATH,
                '//android.widget.Button[@resource-id="android:id/button1"]'
            )
            ok_btn.click()
        except Exception:
            pass
