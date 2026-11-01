"""Presentation of prepared home-practice goals; never rewrite family observations.

Canonical goal snapshots, matching rules and versions remain in the database.
Only fields still equal to their prepared source are adapted for display.
This UI catalogue does not approve any exercise or exercise translation.
"""
from copy import deepcopy
import json
from pathlib import Path

from .localization import LOCALE

_MESSAGES = json.loads((Path(__file__).parent / "locales" / "kk-KZ-practice.json").read_text())


def practice_text(text):
    return _MESSAGES.get(text, text) if LOCALE.get() == "kk-KZ" else text


def localize_goal(goal):
    if LOCALE.get() != "kk-KZ":
        return goal
    from .practice_goals import PRACTICE_GOAL_TEMPLATES
    from .exploration_content import EXPLORATION_GOAL
    from .observation_content import OBSERVATION_GOAL
    from .varied_content import GOAL_TEMPLATES
    core_goal = {
        "key": "recognise-familiar-examples",
        "title": "Узнавать знакомые предметы на разных картинках",
        "observable_behavior": "Выбирает названный предмет среди разных изображений одного понятия.",
        "baseline_prompt": "Какие реальные предметы знакомы и какой способ ответа доступен?",
        "target_outcome": "Узнаёт знакомые предметы на разных картинках с отмеченной помощью; бытовой перенос наблюдается отдельно.",
        "accepted_responses": ["касание изображения", "показ с отмеченной помощью взрослого"],
    }
    source = next((item for item in (*PRACTICE_GOAL_TEMPLATES, EXPLORATION_GOAL, OBSERVATION_GOAL, *GOAL_TEMPLATES, core_goal) if item["key"] == goal.get("template_key")), None)
    if not source:
        return goal
    result = deepcopy(goal)
    for field in ("title", "observable_behavior", "target_outcome", "baseline_prompt"):
        if field in result and result[field] == source.get(field):
            result[field] = practice_text(result[field])
    if result.get("accepted_responses") == source["accepted_responses"]:
        result["accepted_responses"] = [practice_text(text) for text in result["accepted_responses"]]
    # History is a presentation copy. A parent's baseline/target edits and notes
    # are never sent to a translation service or replaced with catalogue text.
    for entry in result.get("history", []):
        if isinstance(entry.get("snapshot"), dict):
            entry["snapshot"] = localize_goal(entry["snapshot"])
    return result


def localize_plan_message(text):
    """Translate known, versioned explanation templates without touching evidence."""
    import re
    if LOCALE.get() != "kk-KZ":
        return text
    if text in _MESSAGES:
        return _MESSAGES[text]
    for source, target in _MESSAGES.items():
        parts = re.split(r"(\{v\d+\})", source)
        if len(parts) == 1:
            continue
        pattern = "".join(f"(?P<{part[1:-1]}>.+?)" if re.fullmatch(r"\{v\d+\}", part) else re.escape(part) for part in parts)
        match = re.fullmatch(pattern, text, flags=re.DOTALL)
        if match:
            values = {key: practice_text(value) for key, value in match.groupdict().items()}
            return target.format(**values)
    return text


def localize_plan(db, plan):
    if LOCALE.get() != "kk-KZ":
        return plan
    result = deepcopy(plan)
    result["summary"] = localize_plan_message(result["summary"])
    for notice in result["notices"]:
        notice["message"] = localize_plan_message(notice["message"])
        if notice.get("goal_title"):
            notice["goal_title"] = practice_text(notice["goal_title"])
    for item in result["items"]:
        item["assignment_reason"]["messages"] = [localize_plan_message(text) for text in item["assignment_reason"].get("messages", [])]
        row = db.execute("""SELECT payload_json FROM exercise_translations
            WHERE source_version_id=? AND locale='kk-KZ' AND status='approved' AND reviewed_by IS NOT NULL""", (item["exercise_version_id"],)).fetchone()
        if row:
            payload = json.loads(row["payload_json"])
            item["exercise_title"] = payload["title"]
            item["instruction"] = payload["instruction"]
            item["translation_available"] = True
        else:
            # A historical Russian plan is still visible, but its pending
            # translation must not become a published Kazakh learning task.
            item["exercise_title"] = "Тапсырманың қазақша аудармасы тексерілуде"
            item["instruction"] = "Аударманы маман тексергеннен кейін тапсырма қолжетімді болады."
            item["translation_available"] = False
    return result
