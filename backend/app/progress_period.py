"""Period summaries for recorded practice; no inference about clinical progress."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

ZONE = ZoneInfo("Asia/Almaty")


def summarize_period(rows: list[dict], days: int, now: datetime | None = None) -> dict:
    today = (now or datetime.now(ZONE)).astimezone(ZONE).date()
    start = today - timedelta(days=days - 1) if days else None

    def day(row):
        value = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
        if value.tzinfo is None:
            value = value.replace(tzinfo=ZONE)
        return value.astimezone(ZONE).date()

    current = [r for r in rows if day(r) <= today and (start is None or day(r) >= start)]
    previous = [r for r in rows if start - timedelta(days=days) <= day(r) < start] if start else []

    def metrics(items):
        practice = [r for r in items if r.get("attempt_status") in {"completed", "participated"}]
        measured = [r for r in items if r.get("attempt_status") == "completed"
                    and r.get("support_context") in {"independent", "caregiver_supported"}
                    and (r.get("attempts_count") or 0) > 0 and r.get("correct_answers") is not None]
        attempts = sum(r["attempts_count"] for r in measured)
        correct = sum(r["correct_answers"] for r in measured)
        return {"sessions": len(practice), "minutes": round(sum(r.get("duration_seconds") or 0 for r in practice) / 60),
                "game_accuracy": round(correct / attempts * 100) if attempts else None,
                "attempts": attempts, "correct": correct,
                "participations": sum(r.get("attempt_status") == "participated" for r in items),
                "breaks": sum(r.get("attempt_status") == "break" for r in items),
                "refusals": sum(r.get("attempt_status") == "refused" for r in items)}

    ordered = sorted(current, key=lambda r: (r["created_at"], r["id"]), reverse=True)
    return {"days": days, "start": start.isoformat() if start else None, "end": today.isoformat(),
            "current": metrics(current), "previous": metrics(previous) if start else None,
            "record_count": len(current), "oldest_id": ordered[-1]["id"] if ordered else None, "recent": ordered[:20]}
