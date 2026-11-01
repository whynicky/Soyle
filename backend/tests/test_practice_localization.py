import copy
import json
from app.database import connect
from app.localization import LOCALE
from app.practice_localization import localize_goal, localize_plan_message
from app.practice_goals import PRACTICE_GOAL_TEMPLATES


def test_catalogue_and_saved_goals_are_presented_without_rewriting_history(client, parent_headers):
    ru = client.get('/api/practice-goal-templates', headers=parent_headers).json()
    kk_headers = {**parent_headers, 'Accept-Language': 'kk-KZ'}
    kk = client.get('/api/practice-goal-templates', headers=kk_headers).json()
    assert len(ru) == len(kk) >= 8
    for source, translated in zip(ru, kk):
        assert source['id'] == translated['id']
        assert source['template_key'] == translated['template_key']
        assert source['title'] != translated['title']
        assert source['observable_behavior'] != translated['observable_behavior']
        assert source['target_outcome'] != translated['target_outcome']
        assert source['accepted_responses'] != translated['accepted_responses']
        assert source['matching_targets'] == translated['matching_targets']
        assert source['matching_mechanics'] == translated['matching_mechanics']
        assert translated['available_exercise_count'] == 0  # no auto-approved KK material
    child = client.get('/api/children', headers=parent_headers).json()[0]['id']
    before = client.get(f'/api/practice-goals/{child}', headers=parent_headers).json()
    translated = client.get(f'/api/practice-goals/{child}', headers=kk_headers).json()
    for original, adapted in zip(before, translated):
        assert original['id'] == adapted['id']
        assert original['version'] == adapted['version']
        assert original['baseline'] == adapted['baseline']
        assert original['observations'] == adapted['observations']
        assert original['progress'] == adapted['progress']
        assert original['title'] != adapted['title']
    assert client.get(f'/api/practice-goals/{child}', headers=parent_headers).json() == before


def test_custom_parent_text_is_not_replaced():
    template = PRACTICE_GOAL_TEMPLATES[0]
    goal = {**copy.deepcopy(template), 'template_key': template['key'], 'baseline': 'Мой личный текст',
            'target_outcome': 'Моя собственная формулировка', 'accepted_responses': ['мой жест']}
    before = copy.deepcopy(goal)
    token = LOCALE.set('kk-KZ')
    try:
        adapted = localize_goal(goal)
        assert adapted['baseline'] == goal['baseline']
        assert adapted['target_outcome'] == goal['target_outcome']
        assert adapted['accepted_responses'] == goal['accepted_responses']
        assert adapted['title'] != goal['title']
        assert goal == before
        assert localize_plan_message('Сохраняем уровень 2: для повышения нужны 6 устойчивых результата именно этого уровня; сейчас 3.') == '2-деңгейді сақтаймыз: арттыру үшін дәл осы деңгейде 6 тұрақты нәтиже қажет; қазір 3 нәтиже бар.'
        assert localize_plan_message('Родитель включил рекомендацию специалиста Айгүл в практику по этой цели.') == 'Ата-ана Айгүл маманының ұсынысын осы мақсат бойынша тәжірибеге қосты.'
    finally:
        LOCALE.reset(token)


def test_historical_plan_keeps_pinned_versions_and_pending_translation(client, parent_headers):
    child = client.get('/api/children', headers=parent_headers).json()[0]['id']
    response = client.post(f'/api/adaptive-plans/{child}', headers=parent_headers, json={'target_minutes': 3})
    assert response.status_code == 201, response.text
    source = response.json()
    assert source['items']
    with connect() as db:
        before = dict(db.execute('SELECT * FROM adaptive_practice_plans WHERE id=?', (source['id'],)).fetchone())
        translations = [dict(row) for row in db.execute('SELECT * FROM exercise_translations').fetchall()]
    kk = client.get(f"/api/adaptive-plans/{child}/{source['id']}", headers={**parent_headers, 'Accept-Language': 'kk-KZ'}).json()
    assert kk['summary'] != source['summary']
    for original, adapted in zip(source['items'], kk['items']):
        assert adapted['exercise_version_id'] == original['exercise_version_id']
        assert adapted['difficulty_params'] == original['difficulty_params']
        assert adapted['assignment_reason']['evidence'] == original['assignment_reason']['evidence']
        assert adapted['assignment_reason']['codes'] == original['assignment_reason']['codes']
        assert adapted['assignment_reason']['messages'] != original['assignment_reason']['messages']
        assert adapted['translation_available'] is False
        assert adapted['exercise_title'] != original['exercise_title']
    with connect() as db:
        assert dict(db.execute('SELECT * FROM adaptive_practice_plans WHERE id=?', (source['id'],)).fetchone()) == before
        assert [dict(row) for row in db.execute('SELECT * FROM exercise_translations').fetchall()] == translations
    assert client.get(f"/api/adaptive-plans/{child}/{source['id']}", headers=parent_headers).json() == source


def test_all_home_previews_are_translated_without_publication(client, admin_headers):
    ru = client.get('/api/admin/home-activity-drafts',headers=admin_headers).json()
    kk_headers = {**admin_headers,'Accept-Language':'kk-KZ'}
    kk = client.get('/api/admin/home-activity-drafts',headers=kk_headers).json()
    assert len(ru) == len(kk) == 12
    for original, translated in zip(ru,kk):
        assert translated['translation_status'] == 'needs_review'
        assert original['id'] == translated['id']
        assert original['review_status'] == translated['review_status']
        for field in ('title','objective','materials','adult_instructions','accepted_responses','prompts','stop_conditions'):
            assert original[field] != translated[field]
        assert original['method_card']['methodology_review_status'] == translated['method_card']['methodology_review_status'] == 'pending'
    denied = client.post(f"/api/admin/home-activity-drafts/{kk[0]['id']}/publish",headers=kk_headers)
    assert denied.status_code == 409
    assert client.get('/api/admin/home-activity-drafts',headers=admin_headers).json() == ru


def test_current_methodology_previews_preserve_source_and_review_flags(client):
    import json
    from app.database import connect
    from app.localization import LOCALE
    from app.methodology_localization import preview
    token = LOCALE.set('kk-KZ')
    try:
        with connect() as db:
            for row in db.execute("SELECT method_card_json FROM exercise_versions WHERE publication_status!='archived'").fetchall():
                source = json.loads(row['method_card_json'])
                if not source: continue
                original = json.dumps(source,ensure_ascii=False,sort_keys=True)
                result = preview(source)
                assert result['status'] == 'needs_review' and result['payload'], source
                assert source.keys() == result['payload'].keys()
                for key,value in source.items():
                    if key.endswith('_status'): assert result['payload'][key] == value
                assert json.dumps(source,ensure_ascii=False,sort_keys=True) == original
            assert preview({'objective':'Новая авторская формулировка'})['status'] == 'missing'
    finally:
        LOCALE.reset(token)


def test_usage_and_system_notifications_translate_without_rewriting_saved_text(client, admin_headers, parent_headers):
    import json, uuid
    from app.database import connect, now_iso
    kk_admin = {**admin_headers,'Accept-Language':'kk-KZ'}
    usage = client.get('/api/admin/usage',headers=kk_admin)
    assert usage.status_code == 200 and 'Сыртқы модель' in usage.json()['note']
    parent = client.get('/api/auth/me',headers=parent_headers).json()
    child = client.get('/api/children',headers=parent_headers).json()[0]
    key = f'module_complete:test:{uuid.uuid4().hex}'
    title = 'Тема 1: есть попытки по всем заданиям'
    message = 'Тема 1: по всем доступным заданиям этой подборки есть сохранённые попытки. Это охват практики, а не оценка развития речи.'
    with connect() as db:
        db.execute('INSERT INTO notifications(user_id,child_id,event_key,title,message,metadata,created_at) VALUES(?,?,?,?,?,?,?)',
                   (parent['id'],child['id'],key,title,message,json.dumps({'unit_label':'Тема 1'}),now_iso()))
    try:
        result = client.get('/api/notifications',headers={**parent_headers,'Accept-Language':'kk-KZ'}).json()
        item = next(item for item in result['items'] if item['event_key'] == key)
        assert item['title'] == '1-тақырып: барлық тапсырма бойынша талпыныстар бар'
        assert item['message'].startswith('Тема 1:') and 'жаттығу қамтуы' in item['message']
        with connect() as db:
            row = db.execute('SELECT title,message FROM notifications WHERE event_key=?',(key,)).fetchone()
            assert row['title'] == title and row['message'] == message
    finally:
        with connect() as db: db.execute('DELETE FROM notifications WHERE event_key=?',(key,))
