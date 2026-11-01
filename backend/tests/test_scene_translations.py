import copy
import json
import pytest
from fastapi import HTTPException
from app.database import connect
from app.localization import LOCALE, get_translation, validate_translation, require_complete_translation, seed_translation_drafts, approve_translation, save_translation, TranslationReview, TranslationUpdate
from app.observation_localization import translated_scenes, phrase, editorial_phrases
from app.exploration_localization import translated_scene, localize_snapshot
from app.observation_content import SCENES, validate_observation
from app.exploration_content import LOCATIONS, validate_exploration
from app import azure_tts


def test_description_bank_preserves_keys_media_and_semantic_response_groups():
    source = copy.deepcopy(SCENES)
    target = translated_scenes(source)
    assert len(target) == 24
    for original, adapted in zip(source, target):
        assert original['key'] == adapted['key']
        assert original['media_ref'] == adapted['media_ref']
        assert [len(group) for group in original['options']] == [len(group) for group in adapted['options']]
        for part, options in zip(adapted['parts'], adapted['options']): assert part in options
    dad = next(scene for scene in target if scene['key'] == 'dad-flies')
    assert phrase(dad['parts'], 'kk') == 'Әке батпырауық ұшырып жатыр'
    assert 'Әке не істеп жатыр?' in editorial_phrases()['kk']
    assert SCENES == source
    source[0]['media_ref'] = '/edited.webp'
    with pytest.raises(KeyError): translated_scenes(source)


def test_search_bank_keeps_all_target_geometry_and_related_surfaces():
    for original in LOCATIONS:
        adapted = translated_scene(original)
        assert len(adapted['objects']) == 12
        assert adapted['image'] == original['image']
        assert validate_exploration({'exploration': adapted, 'round_choices': [4, 8, 12], 'default_rounds': 4}) == []
        for a, b in zip(original['objects'], adapted['objects']):
            for field in a.keys() - {'label','instructions','part_feedback'}: assert a[field] == b[field]
            assert a['instructions']['2'] != b['instructions']['2']
            assert a['instructions']['3'] != b['instructions']['3']
        changed = copy.deepcopy(original)
        changed['objects'][0]['hit_point'][0] += .01
        with pytest.raises(KeyError): translated_scene(changed)


def test_scene_drafts_seed_pending_and_translation_validation_protects_scoring(client):
    with connect() as db:
        before = db.execute('SELECT count(*) n FROM exercise_translations').fetchone()['n']
        seed_translation_drafts(db)
        assert db.execute('SELECT count(*) n FROM exercise_translations').fetchone()['n'] == before
        rows = db.execute("SELECT v.id,v.mechanic FROM exercise_versions v JOIN exercise_translations t ON t.source_version_id=v.id WHERE v.mechanic='scene_search' OR (v.mechanic='guided_aac' AND v.content_json LIKE '%picture_description%')").fetchall()
        assert len(rows) >= 5
        for row in rows:
            item = get_translation(db, row['id'])
            assert item['status'] == 'needs_review' and item['reviewed_by'] is None
            validate_translation(item['source'], item['payload'])
            require_complete_translation(item['source'], item['payload'])
            content = item['payload']['content']
            if row['mechanic'] == 'guided_aac':
                assert validate_observation(content) == []
                broken = copy.deepcopy(item['payload']); broken['content']['scenes'][0]['key'] = 'changed'
            else:
                assert validate_exploration(content) == []
                broken = copy.deepcopy(item['payload']); broken['content']['exploration']['objects'][0]['hit_point'][0] += .01
            with pytest.raises(HTTPException): validate_translation(item['source'], broken)


def test_snapshot_overlay_never_changes_authoritative_game_state(client, parent_headers):
    from app.exploration import start_run, snapshot
    from app.exercise_engine import get_version
    child = client.get('/api/children', headers=parent_headers).json()[0]['id']
    with connect() as db:
        version_id = db.execute("SELECT t.source_version_id id FROM exercise_translations t JOIN exercise_versions v ON v.id=t.source_version_id WHERE v.mechanic='scene_search' LIMIT 1").fetchone()['id']
        version = get_version(db, version_id)
        source = start_run(db, version, child_id=child)
        raw_before = dict(db.execute('SELECT * FROM exploration_runs WHERE id=?', (source['id'],)).fetchone())
        token = LOCALE.set('kk-KZ')
        try:
            with pytest.raises(HTTPException): snapshot(db, raw_before)
        finally: LOCALE.reset(token)
        original = get_translation(db, version_id)
        reviewer = db.execute("SELECT id FROM users WHERE role='admin' LIMIT 1").fetchone()['id']
        approve_translation(db, version_id, TranslationReview(revision=original['revision'],comment='Synthetic scene translation review only'), reviewer)
        token = LOCALE.set('kk-KZ')
        try:
            adapted = snapshot(db, raw_before)
            assert adapted['scene']['title'] != source['scene']['title']
            assert adapted['state'] == source['state']
            assert adapted['measurement'] == source['measurement']
            assert adapted['details'] == source['details']
            assert adapted['version_id'] == source['version_id']
            assert dict(db.execute('SELECT * FROM exploration_runs WHERE id=?',(source['id'],)).fetchone()) == raw_before
        finally: LOCALE.reset(token)
        approved = get_translation(db, version_id)
        save_translation(db,version_id,TranslationUpdate(revision=approved['revision'],payload=approved['payload'],status='needs_review'),reviewer)


def test_azure_catalogue_contains_only_finite_scene_prompts_and_natural_description():
    catalogue = azure_tts.catalogue()
    for text in ('Әке батпырауық ұшырып жатыр', 'Әке не істеп жатыр?', 'Төсекті тап', 'Оятқыштың сол жағындағы жанып тұрған түнгі шамды тап'):
        assert catalogue[('kk',text)] == text
    assert ('kk','Private child text not in any catalogue') not in catalogue


def test_every_existing_russian_choice_version_has_a_complete_pending_translation(client):
    with connect() as db:
        rows = db.execute("SELECT id FROM exercise_versions WHERE mechanic IN ('auditory_choice','action_choice') AND language='ru'").fetchall()
        assert len(rows) >= 50
        for row in rows:
            item = get_translation(db,row['id'])
            assert item['payload'] and item['status'] in {'needs_review', 'draft'}
            assert item['reviewed_by'] is None
            validate_translation(item['source'],item['payload'])
            require_complete_translation(item['source'],item['payload'])


def test_local_kazakh_assistant_routes_refusal_aac_and_concern_without_external_calls(client, parent_headers):
    child = client.get('/api/children',headers=parent_headers).json()[0]['id']
    headers = {**parent_headers,'Accept-Language':'kk-KZ'}
    for question,expected,professional in [('Бала бас тартса не істеу керек?','Бас тарту',False),('AAC карточкаларын қалай қолдануға болады?','карточкаларды',False),('Бала ауырсынуды көрсетіп, тыныс алуы қиындады.','маманның жеке бағалауы',True)]:
        response = client.post(f'/api/ai/ask/{child}',headers=headers,json={'question':question})
        assert response.status_code == 200,response.text
        reply = response.json()
        assert expected in reply['answer']
        assert reply['needs_professional_help'] is professional
        assert reply['generated_by'] == 'local_rules' and reply['model'] is None
        assert 'диагноз қоймайды' in reply['disclaimer']
        assert 'ауырсыну' in reply['safety_note'].lower()
