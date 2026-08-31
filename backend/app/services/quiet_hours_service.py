import os
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.system_setting import SystemSetting
from app.services.telegram_bot_listener import is_alerts_muted

class QuietHoursService:
    @staticmethod
    def is_in_quiet_hours(db: Optional[Session] = None) -> bool:
        """
        Checks if current time in WIB (UTC+7) falls in configured Quiet Hours (e.g. 23:00 - 06:00).
        """
        # 1. Check global bot mute command
        if is_alerts_muted():
            return True

        wib_now = datetime.now(timezone(timedelta(hours=7)))
        current_hour = wib_now.hour

        # Check DB setting if configured
        quiet_enabled = True
        quiet_start = 23
        quiet_end = 6

        if db:
            setting_enabled = db.query(SystemSetting).filter(SystemSetting.key == "QUIET_HOURS_ENABLED").first()
            if setting_enabled and setting_enabled.value and setting_enabled.value.lower() == "false":
                quiet_enabled = False

            setting_start = db.query(SystemSetting).filter(SystemSetting.key == "QUIET_HOURS_START").first()
            if setting_start and setting_start.value and setting_start.value.isdigit():
                quiet_start = int(setting_start.value)

            setting_end = db.query(SystemSetting).filter(SystemSetting.key == "QUIET_HOURS_END").first()
            if setting_end and setting_end.value and setting_end.value.isdigit():
                quiet_end = int(setting_end.value)

        if not quiet_enabled:
            return False

        if quiet_start > quiet_end:
            # Over midnight (e.g. 23 to 6)
            return current_hour >= quiet_start or current_hour < quiet_end
        else:
            return quiet_start <= current_hour < quiet_end

    @staticmethod
    def should_suppress_alert(is_critical: bool = False, db: Optional[Session] = None) -> bool:
        """
        Returns True if alert should be suppressed because of quiet hours or global mute.
        Critical alerts (server disconnect, copyright claim) are NEVER suppressed.
        """
        if is_critical:
            return False
        return QuietHoursService.is_in_quiet_hours(db)
