"""Locale negotiation and version-bound translations. Never fall back across languages."""
import copy
import json
from contextvars import ContextVar
from fastapi import HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from .database import now_iso

LOCALE = ContextVar("soyle_locale", default="ru-RU")
TEXT_FIELDS = frozenset({"alt", "title", "instruction", "objective", "label", "speech", "hint", "text", "prompt", "feedback", "reaction", "narration", "child_instruction", "assisted_reaction"})

def normalize_locale(value):
    for part in (value or "ru-RU").split(","):
        language = part.split(";", 1)[0].strip().lower()
        if language in {"kk", "kk-kz"}: return "kk-KZ"
        if language in {"ru", "ru-ru"}: return "ru-RU"
    return "ru-RU"


def source_payload(version):
    return {"title": version["title"], "instruction": version["instruction"], "objective": version["objective"], "content": json.loads(version["content_json"])}


def translation_text_fields(source):
    from .observation_localization import OBSERVATION_TEXT_FIELDS
    from .exploration_localization import EXPLORATION_TEXT_FIELDS
    content = source.get("content", {}) if isinstance(source, dict) else {}
    if content.get("presentation") == "picture_description": return TEXT_FIELDS | OBSERVATION_TEXT_FIELDS
    if content.get("exploration"): return TEXT_FIELDS | EXPLORATION_TEXT_FIELDS
    if "scenario_key" in content and "labels" in content: return TEXT_FIELDS | {"steps", "criterion", "empty_hint", "incomplete_hint", "success_hint", "action_label"}
    return TEXT_FIELDS


def validate_translation(source, translated, path="", field="", text_fields=None):
    """IDs, media and scoring keys cannot be changed by a translation editor."""
    if text_fields is None: text_fields = translation_text_fields(source)
    if isinstance(source, dict):
        if not isinstance(translated, dict) or source.keys() != translated.keys():
            raise HTTPException(422, f"translation.shape:{path}")
        for key in source: validate_translation(source[key], translated[key], f"{path}/{key}", field if field == "instructions" else key, text_fields)
    elif isinstance(source, list):
        if not isinstance(translated, list) or len(source) != len(translated):
            raise HTTPException(422, f"translation.shape:{path}")
        for index, value in enumerate(source): validate_translation(value, translated[index], f"{path}/{index}", field, text_fields)
    elif isinstance(source, str) and field in text_fields:
        if not isinstance(translated, str) or (source.strip() and not translated.strip()) or len(translated) > 4000:
            raise HTTPException(422, f"translation.text:{path}")
    elif source != translated:
        raise HTTPException(422, f"translation.immutable:{path}")


class TranslationUpdate(BaseModel):
    revision: int = Field(ge=0)
    payload: dict
    status: Literal["draft", "needs_review"] = "draft"


class TranslationReview(BaseModel):
    revision: int = Field(ge=1)
    comment: str = Field(min_length=10, max_length=2000)


def get_translation(db, version_id):
    source = db.execute("SELECT * FROM exercise_versions WHERE id=?", (version_id,)).fetchone()
    if not source: raise HTTPException(404, "translation.source_missing")
    row = db.execute("SELECT * FROM exercise_translations WHERE source_version_id=? AND locale='kk-KZ'", (version_id,)).fetchone()
    return {"source_version_id": version_id, "source": source_payload(source),
            "revision": row["revision"] if row else 0,
            "status": row["status"] if row else "missing",
            "payload": json.loads(row["payload_json"]) if row else None,
            "reviewed_by": row["reviewed_by"] if row else None,
            "review_comment": row["review_comment"] if row else None}


def save_translation(db, version_id, update, user_id):
    # Serializes optimistic revision checks on both SQLite and PostgreSQL.
    db.execute("UPDATE exercise_versions SET version=version WHERE id=?", (version_id,))
    current = get_translation(db, version_id)
    if current["revision"] != update.revision: raise HTTPException(409, "translation.conflict")
    validate_translation(current["source"], update.payload)
    db.execute("""INSERT INTO exercise_translations(source_version_id,locale,revision,payload_json,status,updated_by,updated_at)
        VALUES(?,'kk-KZ',?,?,?, ?,?) ON CONFLICT(source_version_id,locale) DO UPDATE SET
        revision=excluded.revision,payload_json=excluded.payload_json,status=excluded.status,
        updated_by=excluded.updated_by,updated_at=excluded.updated_at,reviewed_by=NULL,reviewed_at=NULL,review_comment=NULL""",
        (version_id, update.revision + 1, json.dumps(update.payload, ensure_ascii=False), update.status, user_id, now_iso()))
    archive_translation(db, version_id)
    return get_translation(db, version_id)


def approve_translation(db, version_id, review, user_id):
    db.execute("UPDATE exercise_versions SET version=version WHERE id=?", (version_id,))
    current = get_translation(db, version_id)
    if current["revision"] != review.revision or current["status"] != "needs_review": raise HTTPException(409, "translation.conflict")
    source = db.execute("SELECT mechanic FROM exercise_versions WHERE id=?", (version_id,)).fetchone()
    from .aac_scenario_localization import can_adapt
    # Labels used as historical semantic keys are immutable; the runner resolves
    # translated shared cards through their stable concept keys.
    if source["mechanic"] not in {"auditory_choice", "action_choice", "category_sort", "action_sequence", "object_match", "tap_instruction", "scene_search"} and not (source["mechanic"] == "guided_aac" and (current["source"]["content"].get("presentation") == "picture_description" or can_adapt(current["source"]["content"]))):
        raise HTTPException(422, "translation.mechanic_needs_adaptation")
    validate_translation(current["source"], current["payload"])
    require_complete_translation(current["source"], current["payload"])
    if current["source"]["content"].get("presentation") == "picture_description":
        from .observation_content import validate_observation
        if validate_observation(current["payload"]["content"]): raise HTTPException(422, "translation.observation_invalid")
    if current["source"]["content"].get("exploration"):
        from .exploration_content import validate_exploration
        if validate_exploration(current["payload"]["content"]): raise HTTPException(422, "translation.exploration_invalid")
    db.execute("""UPDATE exercise_translations SET status='approved',reviewed_by=?,reviewed_at=?,review_comment=?,revision=revision+1
        WHERE source_version_id=? AND locale='kk-KZ'""", (user_id, now_iso(), review.comment, version_id))
    archive_translation(db, version_id)
    return get_translation(db, version_id)


def localize_exercises(db, exercises):
    if LOCALE.get() == "ru-RU": return exercises
    result = []
    for exercise in exercises:
        engine = exercise.get("engine") or {}
        row = db.execute("""SELECT payload_json,revision FROM exercise_translations
            WHERE source_version_id=? AND locale='kk-KZ' AND status='approved' AND reviewed_by IS NOT NULL""", (engine.get("version_id"),)).fetchone()
        if not row: continue
        payload = json.loads(row["payload_json"])
        item = copy.deepcopy(exercise)
        item.update(title=payload["title"], instruction=payload["instruction"])
        item["engine"].update(language="kk", objective=payload["objective"], content=payload["content"], translation_revision=row["revision"])
        result.append(item)
    return result


def approved_speech(db, text, version_id=None):
    """Only reviewed editorial fields may be sent to cloud TTS; never user profiles."""
    def texts(value, field="", text_fields=TEXT_FIELDS):
        if isinstance(value, dict):
            for key, item in value.items(): yield from texts(item, key, text_fields)
        elif isinstance(value, list):
            for item in value: yield from texts(item, field, text_fields)
        elif isinstance(value, str) and field in text_fields:
            yield " ".join(value.split())
    query = """SELECT t.payload_json FROM exercise_translations t JOIN exercise_versions v ON v.id=t.source_version_id
        WHERE t.status='approved' AND t.reviewed_by IS NOT NULL AND t.locale='kk-KZ'
        AND v.review_status='approved' AND v.publication_status='published'"""
    params = ()
    if version_id is not None:
        query += " AND t.source_version_id=?"
        params = (version_id,)
    for row in db.execute(query, params).fetchall():
        payload = json.loads(row["payload_json"])
        if text in set(texts(payload, text_fields=translation_text_fields(payload))): return True
        if payload["content"].get("exploration"):
            from .exploration_localization import scene_speech
            if text in scene_speech(payload["content"]["exploration"]): return True
        if payload["content"].get("presentation") == "picture_description":
            from .observation_localization import scene_speech
            if text in scene_speech(payload["content"]["scenes"], "kk"): return True
    return False


def seed_translation_drafts(db):
    """Idempotent static migration. Unknown text prevents seeding the whole material."""
    from pathlib import Path
    dictionary = json.loads((Path(__file__).parent / "locales" / "kk-KZ-education.json").read_text())
    def adapt(value, field="", text_fields=TEXT_FIELDS):
        if field == "exploration":
            from .exploration_localization import translated_scene
            return translated_scene(value)
        if field == "scenes":
            from .observation_localization import translated_scenes
            return translated_scenes(value)
        if isinstance(value, dict): return {key: adapt(item, key, text_fields) for key, item in value.items()}
        if isinstance(value, list): return [adapt(item, field, text_fields) for item in value]
        if isinstance(value, str) and field in text_fields and value.strip(): return dictionary[value]
        return value
    count = 0
    for row in db.execute("SELECT * FROM exercise_versions WHERE language='ru' AND mechanic IN ('auditory_choice','action_choice','category_sort','action_sequence','object_match','tap_instruction','guided_aac','scene_search','local_face_mirror')").fetchall():
        try:
            source = source_payload(row)
            payload = adapt(source, text_fields=translation_text_fields(source))
        except KeyError: continue
        db.execute("""INSERT INTO exercise_translations(source_version_id,locale,revision,payload_json,status,updated_at)
            VALUES(?,'kk-KZ',1,?,'needs_review',?) ON CONFLICT(source_version_id,locale) DO NOTHING""",
            (row["id"], json.dumps(payload, ensure_ascii=False), now_iso()))
        archive_translation(db, row["id"])
        count += 1
    return count


def archive_translation(db, version_id):
    row = db.execute("SELECT * FROM exercise_translations WHERE source_version_id=? AND locale='kk-KZ'", (version_id,)).fetchone()
    if row:
        db.execute("""INSERT INTO exercise_translation_history(source_version_id,locale,revision,snapshot_json,recorded_at)
            VALUES(?,'kk-KZ',?,?,?) ON CONFLICT(source_version_id,locale,revision) DO NOTHING""",
            (version_id,row["revision"],json.dumps(dict(row),ensure_ascii=False),now_iso()))


def require_complete_translation(source, translated, field="", text_fields=None):
    import re
    if text_fields is None: text_fields = translation_text_fields(source)
    from .exploration_localization import SHARED_LABELS
    if isinstance(source, dict):
        for key in source: require_complete_translation(source[key],translated[key],field if field == "instructions" else key,text_fields)
    elif isinstance(source, list):
        for original, target in zip(source, translated): require_complete_translation(original,target,field,text_fields)
    elif isinstance(source,str) and field in text_fields and re.search("[А-Яа-яЁё]",source):
        if source == translated and source not in {"Банан","Робот","Футболка"} | ({"Спорт", "салат"} if "parts" in text_fields else set()) | (SHARED_LABELS if "instructions" in text_fields or field in {"label", "speech"} else set()):
            raise HTTPException(422,"translation.incomplete")
