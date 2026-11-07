from datetime import datetime, timezone, timedelta
try:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = timezone(timedelta(hours=5, minutes=30))

def now_ist() -> datetime:
    """Return the current datetime localized to Indian Standard Time (IST)."""
    return datetime.now(IST)

def iso_now() -> str:
    """Return current IST time in ISO 8601 string format with timezone offset."""
    return now_ist().isoformat()

def today_ist_day_name() -> str:
    """Return current weekday name in IST (e.g. 'Monday', 'Tuesday')."""
    return now_ist().strftime("%A")

def today_ist_day_index() -> int:
    """Return 1 for Monday through 7 for Sunday in IST."""
    return now_ist().isoweekday()

def parse_iso(dt_str: str) -> datetime:
    """Parse an ISO 8601 date string, ensuring it is timezone-aware."""
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=IST)
    return dt

def is_past_date(dt_str: str) -> bool:
    """Check if the given ISO date string is before the current time in IST."""
    try:
        dt = parse_iso(dt_str)
        return dt < now_ist()
    except Exception:
        return False
