"""Personal learning cards: parent photos of family, things and pets for one child.

One store (``child_world_photos``) holds every personal card. ``kind`` separates the
ready-made «Моя семья» module (``family``) from free «Мои слова» cards (``word``).
``category`` is the topic key that thematic sections use to pick personal cards
(``animals``, ``food``, ``home`` …), so a section can join personal photos without
its own upload or storage.
"""
import base64
import binascii
import hashlib

from fastapi import HTTPException

RELATIONS = ("mama", "papa", "baba", "deda", "tetya", "dyadya")
WORD_CATEGORIES = ("people", "animals", "toys", "food", "home", "clothing", "places", "custom")
CATEGORIES = (*WORD_CATEGORIES, "family")
LANGUAGES = ("ru", "kk")
OUTCOMES = ("independent", "prompted", "modelled")
MAX_CARDS = 60
MAX_FAMILY_CARDS = 18
MAX_CUSTOM_CATEGORIES = 12
_MIME = {
    "data:image/jpeg;base64": lambda raw: raw.startswith(b"\xff\xd8\xff"),
    "data:image/png;base64": lambda raw: raw.startswith(b"\x89PNG\r\n\x1a\n"),
    "data:image/webp;base64": lambda raw: raw.startswith(b"RIFF") and raw[8:12] == b"WEBP",
}

CARD_COLUMNS = (
    "p.id,p.name,p.category,p.image_data,p.created_at,p.kind,p.relation,p.language,p.speech,"
    "p.custom_category_id,c.label custom_category_label,p.updated_at"
)


def image_hash(image_data: str) -> str:
    """Validate a data-URL photo by real file signature and size; return its content hash."""
    mime, separator, encoded = image_data.partition(",")
    if not separator or mime not in _MIME:
        raise HTTPException(422, "Поддерживаются только фотографии JPEG, PNG и WebP")
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(422, "Фотография повреждена") from None
    if not _MIME[mime](raw) or not 100 <= len(raw) <= 650_000:
        raise HTTPException(422, "Фотография должна быть изображением размером до 650 КБ")
    return hashlib.sha256(raw).hexdigest()


def clean_text(value: str | None) -> str:
    return " ".join((value or "").split())


def resolve_card_fields(db, child_id: int, kind: str, category: str, relation: str | None,
                        custom_category_id: int | None, name: str) -> tuple[str, str | None, int | None]:
    """Normalise the kind/category/relation triple so stored cards are always consistent."""
    if kind == "family":
        if relation not in RELATIONS:
            raise HTTPException(422, "Выберите, кем приходится этот человек ребёнку")
        return "family", relation, None
    if category not in WORD_CATEGORIES:
        raise HTTPException(422, "Выберите категорию карточки")
    if not name:
        raise HTTPException(422, "Назовите карточку: это слово услышит ребёнок")
    if category != "custom":
        return category, None, None
    if not custom_category_id or not db.execute(
        "SELECT 1 FROM child_card_categories WHERE id=? AND child_id=?", (custom_category_id, child_id)
    ).fetchone():
        raise HTTPException(422, "Своя категория не найдена")
    return "custom", None, custom_category_id


def list_cards(db, child_id: int, kind: str | None = None, with_practice: bool = False) -> list[dict]:
    query = f"""SELECT {CARD_COLUMNS} FROM child_world_photos p
        LEFT JOIN child_card_categories c ON c.id=p.custom_category_id
        WHERE p.child_id=?"""
    params: list = [child_id]
    if kind:
        query += " AND p.kind=?"
        params.append(kind)
    rows = [dict(row) for row in db.execute(query + " ORDER BY p.id DESC", params).fetchall()]
    if with_practice and rows:
        stats = {row["card_id"]: dict(row) for row in db.execute(
            """SELECT card_id,COUNT(*) rounds,
                      SUM(CASE WHEN outcome='independent' THEN 1 ELSE 0 END) independent,
                      MAX(created_at) last_practiced
               FROM child_personal_card_results WHERE child_id=? GROUP BY card_id""",
            (child_id,),
        ).fetchall()}
        for row in rows:
            item = stats.get(row["id"])
            row["practice"] = {
                "rounds": int(item["rounds"]) if item else 0,
                "independent": int(item["independent"] or 0) if item else 0,
                "last_practiced": item["last_practiced"] if item else None,
            }
    return rows


def get_card(db, child_id: int, card_id: int) -> dict | None:
    row = db.execute(
        f"""SELECT {CARD_COLUMNS} FROM child_world_photos p
            LEFT JOIN child_card_categories c ON c.id=p.custom_category_id
            WHERE p.child_id=? AND p.id=?""",
        (child_id, card_id),
    ).fetchone()
    return dict(row) if row else None
