"""Personal cards: «Моя семья», «Мои слова», own categories, practice results and family isolation."""

import base64
import os

from tests.conftest import login


def photo(seed: int = 0) -> str:
    raw = b"\x89PNG\r\n\x1a\n" + os.urandom(180) + seed.to_bytes(4, "big")
    return "data:image/png;base64," + base64.b64encode(raw).decode("ascii")


def first_child(client, parent_headers) -> int:
    return client.get("/api/children", headers=parent_headers).json()[0]["id"]


def other_parent(client) -> dict:
    """A second family, created directly so the shared registration rate limit stays untouched."""
    from app.database import connect, now_iso
    from app.security import hash_password
    with connect() as db:
        if not db.execute("SELECT 1 FROM users WHERE username='cards_other'").fetchone():
            db.execute(
                "INSERT INTO users(email,username,password_hash,full_name,role,created_at) VALUES(?,?,?,?,?,?)",
                ("cards_other@example.test", "cards_other", hash_password("OtherParent123!"), "Другая семья", "parent", now_iso()),
            )
    return login(client, "cards_other", "OtherParent123!")


def test_family_cards_lifecycle(client, parent_headers, student_headers):
    child = first_child(client, parent_headers)
    url = f"/api/world/{child}"
    missing_relation = client.post(url, headers=parent_headers, json={"kind": "family", "image_data": photo(1)})
    assert missing_relation.status_code == 422
    mama = client.post(url, headers=parent_headers, json={
        "kind": "family", "relation": "mama", "name": "Айгуль", "language": "ru", "speech": "Мама Айгу́ль", "image_data": photo(2),
    })
    assert mama.status_code == 201, mama.text
    card = mama.json()
    assert card["kind"] == "family" and card["category"] == "family" and card["relation"] == "mama"
    assert card["name"] == "Айгуль" and card["speech"] == "Мама Айгу́ль"
    # A family card may have no own name: the child hears the relation word.
    papa = client.post(url, headers=parent_headers, json={"kind": "family", "relation": "papa", "language": "kk", "image_data": photo(3)})
    assert papa.status_code == 201, papa.text
    assert papa.json()["name"] == "" and papa.json()["language"] == "kk"

    assert client.post(url, headers=student_headers, json={"kind": "family", "relation": "baba", "image_data": photo(4)}).status_code == 403
    family = client.get(url, params={"kind": "family"}, headers=student_headers)
    assert family.status_code == 200
    assert family.headers["cache-control"] == "private, no-store"
    assert {item["id"] for item in family.json()} >= {card["id"], papa.json()["id"]}
    assert all(item["kind"] == "family" for item in family.json())
    assert "practice" not in family.json()[0]

    edited = client.patch(f"{url}/{card['id']}", headers=parent_headers, json={"relation": "tetya", "name": "", "speech": "", "image_data": photo(5)})
    assert edited.status_code == 200, edited.text
    assert edited.json()["relation"] == "tetya" and edited.json()["name"] == "" and edited.json()["speech"] is None
    assert edited.json()["image_data"] != card["image_data"]
    assert client.patch(f"{url}/{card['id']}", headers=parent_headers, json={"relation": "cousin"}).status_code == 422
    assert client.delete(f"{url}/{card['id']}", headers=student_headers).status_code == 403
    assert client.delete(f"{url}/{card['id']}", headers=parent_headers).status_code == 204
    assert client.delete(f"{url}/{card['id']}", headers=parent_headers).status_code == 404


def test_word_cards_custom_categories_and_validation(client, parent_headers, student_headers):
    child = first_child(client, parent_headers)
    url = f"/api/world/{child}"
    assert client.post(url, headers=parent_headers, json={"kind": "word", "category": "animals", "name": "  ", "image_data": photo(10)}).status_code == 422
    assert client.post(url, headers=parent_headers, json={"name": "Кот", "category": "animals", "image_data": "data:image/gif;base64,R0lGODlhAQABAAAAACw="}).status_code == 422
    fake_png = "data:image/png;base64," + base64.b64encode(b"<svg>" + b"x" * 200).decode()
    assert client.post(url, headers=parent_headers, json={"name": "Кот", "category": "animals", "image_data": fake_png}).status_code == 422
    cat = client.post(url, headers=parent_headers, json={"name": "Барсик", "category": "animals", "language": "ru", "image_data": photo(11)})
    assert cat.status_code == 201, cat.text
    assert cat.json()["kind"] == "word" and cat.json()["category"] == "animals"

    assert client.post(f"{url}/categories", headers=student_headers, json={"label": "Дача"}).status_code == 403
    category = client.post(f"{url}/categories", headers=parent_headers, json={"label": "Дача"})
    assert category.status_code == 201, category.text
    same = client.post(f"{url}/categories", headers=parent_headers, json={"label": "дача"})
    assert same.json()["id"] == category.json()["id"]
    assert client.post(url, headers=parent_headers, json={"name": "Качели", "category": "custom", "image_data": photo(12)}).status_code == 422
    swing = client.post(url, headers=parent_headers, json={"name": "Качели", "category": "custom", "custom_category_id": category.json()["id"], "image_data": photo(13)})
    assert swing.status_code == 201, swing.text
    assert swing.json()["custom_category_label"] == "Дача"
    listed = client.get(f"{url}/categories", headers=student_headers).json()
    assert any(item["label"] == "Дача" and item["cards"] == 1 for item in listed)

    words = client.get(url, params={"kind": "word"}, headers=parent_headers).json()
    assert all(item["kind"] == "word" for item in words)
    assert all(item["practice"]["rounds"] == 0 for item in words if item["id"] in {cat.json()["id"], swing.json()["id"]})

    moved = client.patch(f"{url}/{cat.json()['id']}", headers=parent_headers, json={"category": "home", "name": "Мишка", "language": "kk"})
    assert moved.status_code == 200 and moved.json()["category"] == "home" and moved.json()["language"] == "kk"
    assert client.patch(f"{url}/{cat.json()['id']}", headers=parent_headers, json={"category": "family"}).status_code == 422

    assert client.delete(f"{url}/categories/{category.json()['id']}", headers=parent_headers).status_code == 204
    kept = next(item for item in client.get(url, headers=parent_headers).json() if item["id"] == swing.json()["id"])
    assert kept["category"] == "people" and kept["custom_category_id"] is None


def test_personal_practice_results_and_family_isolation(client, parent_headers, student_headers):
    child = first_child(client, parent_headers)
    url = f"/api/world/{child}"
    baba = client.post(url, headers=parent_headers, json={"kind": "family", "relation": "baba", "name": "Сауле", "image_data": photo(20)}).json()
    deda = client.post(url, headers=parent_headers, json={"kind": "family", "relation": "deda", "image_data": photo(21)}).json()
    saved = client.post(f"{url}/results", headers=student_headers, json={"outcomes": [
        {"card_id": baba["id"], "outcome": "independent", "attempts": 1},
        {"card_id": deda["id"], "outcome": "prompted", "attempts": 2},
        {"card_id": baba["id"], "outcome": "independent", "attempts": 1},
    ]})
    assert saved.status_code == 201, saved.text
    stats = {item["id"]: item["practice"] for item in client.get(url, params={"kind": "family"}, headers=parent_headers).json()}
    assert stats[baba["id"]]["rounds"] == 2 and stats[baba["id"]]["independent"] == 2
    assert stats[deda["id"]]["rounds"] == 1 and stats[deda["id"]]["independent"] == 0

    stranger = other_parent(client)
    assert client.get(url, headers=stranger).status_code == 403
    assert client.get(f"{url}/categories", headers=stranger).status_code == 403
    assert client.patch(f"{url}/{baba['id']}", headers=stranger, json={"name": "Чужое"}).status_code == 403
    assert client.delete(f"{url}/{baba['id']}", headers=stranger).status_code == 403
    assert client.post(f"{url}/results", headers=stranger, json={"outcomes": [{"card_id": baba["id"], "outcome": "independent", "attempts": 1}]}).status_code == 403
    # A card id of one child cannot be used through another child's profile.
    own_child = client.post("/api/children", headers=stranger, json={"name": "Тимур", "birth_date": "2021-03-01"})
    assert own_child.status_code in {200, 201}, own_child.text
    other_id = own_child.json()["id"]
    client.put(f"/api/children/{other_id}/consent", headers=stranger, json={"privacy_accepted": True, "camera_processing": False, "ai_processing": False, "analytics_processing": True})
    assert client.patch(f"/api/world/{other_id}/{baba['id']}", headers=stranger, json={"name": "Чужое"}).status_code == 404
    assert client.post(f"/api/world/{other_id}/results", headers=stranger, json={"outcomes": [{"card_id": baba["id"], "outcome": "independent", "attempts": 1}]}).status_code == 404

    exported = client.get(f"/api/children/{child}/export", headers=parent_headers).json()
    assert any(item["card_id"] == baba["id"] for item in exported["personal_card_results"])
    assert client.delete(f"{url}/{baba['id']}", headers=parent_headers).status_code == 204
    exported = client.get(f"/api/children/{child}/export", headers=parent_headers).json()
    assert all(item["card_id"] != baba["id"] for item in exported["personal_card_results"])


def test_family_card_words_use_the_azure_voice(client, parent_headers, student_headers, monkeypatch):
    import app.azure_tts as azure
    calls = []
    def fake(text, language, mode, phrase_type=None, profile="exercise", personal=False):
        calls.append((text, language, personal))
        if not personal:
            raise azure.TTSUnavailable()
        return b"ID3-mp3"
    monkeypatch.setattr(azure, "synthesize", fake)
    monkeypatch.setattr(azure, "limit_user", lambda _: None)
    child = first_child(client, parent_headers)
    url = f"/api/world/{child}"
    client.post(url, headers=parent_headers, json={"kind": "family", "relation": "dyadya", "name": "Нурлан", "language": "kk", "image_data": photo(40)})
    client.post(url, headers=parent_headers, json={"name": "Барсик", "category": "animals", "speech": "Ба́рсик", "image_data": photo(41)})

    def say(headers, text, language="ru", **extra):
        return client.post("/api/tts", headers=headers, json={"text": text, "language": language, **extra})

    assert say(student_headers, "Аға", "kk").headers.get("x-soyle-tts") == "azure"
    assert say(student_headers, "Ба́рсик").headers.get("x-soyle-tts") == "azure"
    assert say(student_headers, "Это Ба́рсик.").headers.get("x-soyle-tts") == "azure"
    # Arbitrary text is not sent to the cloud voice for a child…
    assert say(student_headers, "Случайный текст").status_code == 503
    # …but a parent may preview an unsaved card for their own child, and nobody else's.
    assert say(parent_headers, "Айгу́ль", child_id=child).headers.get("x-soyle-tts") == "azure"
    stranger = other_parent(client)
    assert say(stranger, "Айгу́ль", child_id=child).status_code == 503
    assert say(stranger, "Ба́рсик").status_code == 503
    assert ("Случайный текст", "ru", False) in calls
