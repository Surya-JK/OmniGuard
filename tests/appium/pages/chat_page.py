"""
Chat Page Object — Appium (Android)
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from appium.webdriver.common.appiumby import AppiumBy
import config


class ChatPage:

    def __init__(self, driver):
        self.driver = driver
        self.wait   = WebDriverWait(driver, config.EXPLICIT_WAIT)

    # ── Locators ──────────────────────────────────────────────
    TITLE           = (AppiumBy.XPATH, '//android.widget.TextView[@text="OmniGuard AI"]')
    BACK_BUTTON     = (AppiumBy.XPATH,
        '//android.widget.ImageView[@content-desc="chevron-back"]')
    INITIAL_MESSAGE = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"Hello! I am the OmniGuard")]')
    MESSAGE_INPUT   = (AppiumBy.XPATH,
        '//android.widget.EditText[contains(@hint,"scan target")]')
    SEND_BUTTON     = (AppiumBy.XPATH,
        '//android.widget.ImageView[@content-desc="send"]')
    TYPING_INDICATOR = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="Analyzing threat..."]')
    NEW_CHAT_BTN    = (AppiumBy.XPATH,
        '//android.widget.ImageView[@content-desc="create-outline"]')
    DELETE_CHAT_BTN = (AppiumBy.XPATH,
        '//android.widget.ImageView[@content-desc="trash-outline"]')
    HISTORY_PILL    = (AppiumBy.XPATH,
        '//android.widget.TextView[contains(@text,"New")]/parent::*/following-sibling::*[1]')
    OMNIGUARD_LABEL = (AppiumBy.XPATH,
        '//android.widget.TextView[@text="OMNIGUARD CORE"]')

    # ── Actions ───────────────────────────────────────────────
    def wait_for_chat_screen(self):
        self.wait.until(EC.presence_of_element_located(self.TITLE))
        return self

    def go_back(self):
        self.wait.until(EC.element_to_be_clickable(self.BACK_BUTTON)).click()
        return self

    def send_message(self, text: str):
        field = self.wait.until(EC.presence_of_element_located(self.MESSAGE_INPUT))
        field.click()
        field.send_keys(text)
        self.wait.until(EC.element_to_be_clickable(self.SEND_BUTTON)).click()
        return self

    def wait_for_ai_response(self, timeout: int = config.LONG_WAIT) -> str:
        """Wait for the typing indicator to disappear, then return the last AI message."""
        wait = WebDriverWait(self.driver, timeout)
        # Wait for typing to start
        try:
            wait.until(EC.presence_of_element_located(self.TYPING_INDICATOR))
        except Exception:
            pass
        # Wait for typing to finish
        wait.until(EC.invisibility_of_element_located(self.TYPING_INDICATOR))
        # Get last OMNIGUARD CORE message
        messages = self.driver.find_elements(
            AppiumBy.XPATH,
            '//android.widget.TextView[@text="OMNIGUARD CORE"]/following-sibling::android.widget.TextView[1]'
        )
        return messages[-1].text if messages else ""

    def tap_new_chat(self):
        self.wait.until(EC.element_to_be_clickable(self.NEW_CHAT_BTN)).click()
        return self

    def tap_delete_session(self):
        self.wait.until(EC.element_to_be_clickable(self.DELETE_CHAT_BTN)).click()
        return self

    def confirm_delete_alert(self):
        try:
            delete_btn = WebDriverWait(self.driver, config.SHORT_WAIT).until(
                EC.element_to_be_clickable(
                    (AppiumBy.XPATH, '//android.widget.Button[@text="Delete"]')
                )
            )
            delete_btn.click()
        except Exception:
            pass
        return self

    # ── Assertions ────────────────────────────────────────────
    def is_chat_screen_visible(self) -> bool:
        try:
            self.wait.until(EC.presence_of_element_located(self.TITLE))
            return True
        except Exception:
            return False

    def is_initial_message_visible(self) -> bool:
        try:
            self.wait.until(EC.presence_of_element_located(self.INITIAL_MESSAGE))
            return True
        except Exception:
            return False

    def is_history_bar_visible(self) -> bool:
        try:
            WebDriverWait(self.driver, config.SHORT_WAIT).until(
                EC.presence_of_element_located(
                    (AppiumBy.XPATH, '//android.widget.TextView[@text="New"]')
                )
            )
            return True
        except Exception:
            return False

    def is_delete_button_visible(self) -> bool:
        try:
            self.driver.find_element(*self.DELETE_CHAT_BTN)
            return True
        except Exception:
            return False
