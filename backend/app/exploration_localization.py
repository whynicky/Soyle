"""Display-only adaptation of scene-search snapshots, bound to reviewed versions."""
from copy import deepcopy
import json
from pathlib import Path
from fastapi import HTTPException
from .localization import LOCALE

_ADAPTATION = json.loads((Path(__file__).parent / 'locales' / 'kk-KZ-exploration.json').read_text())
EXPLORATION_TEXT_FIELDS = frozenset({'instructions', 'part_feedback'})
SHARED_LABELS = frozenset({'Шкаф', 'Динозавр', 'Банан', 'Диван', 'Кресло', 'Аквариум', 'Гитара', 'Велосипед'})
_FEEDBACK = {
    'Не удалось воспроизвести инструкцию. Ответ не оценивается.': 'Нұсқауды ойнату мүмкін болмады. Жауап бағаланбайды.',
    'Посмотри в подсвеченную область.': 'Жарықпен белгіленген аймаққа қара.',
    'Рассмотри картинку. Предмет можно найти без спешки.': 'Суретке қара. Затты асықпай табуға болады.',
    'Давай попробуем ещё раз.': 'Кел, тағы байқап көрейік.',
    'Не загрузилась иллюстрация. Ответ не оценивается.': 'Сурет жүктелмеді. Жауап бағаланбайды.',
}


def translated_scene(source):
    from .exploration_content import LOCATIONS
    original = next((scene for scene in LOCATIONS if scene['key'] == source.get('key')), None)
    if original != source: raise KeyError('exploration.source_changed')
    return deepcopy(next(scene for scene in _ADAPTATION['locations'] if scene['key'] == source['key']))


def scene_speech(scene):
    texts = set(_FEEDBACK.values())
    for item in scene['objects']:
        texts.add(item['label'])
        texts.update(item['instructions'].values())
        texts.add('Иә, бұл ' + item['label'].lower() + '!')
        if item.get('part_feedback'): texts.add(item['part_feedback'])
    return texts


def editorial_phrases():
    return set().union(*(scene_speech(scene) for scene in _ADAPTATION['locations']))


def localize_snapshot(db, result):
    if LOCALE.get() != 'kk-KZ' or result['preview']: return result
    row = db.execute("""SELECT payload_json FROM exercise_translations WHERE source_version_id=?
        AND locale='kk-KZ' AND status='approved' AND reviewed_by IS NOT NULL""", (result['version_id'],)).fetchone()
    if not row: raise HTTPException(409, 'translation.review_required')
    localized = deepcopy(result)
    scene = json.loads(row['payload_json'])['content']['exploration']
    localized['scene'] = scene
    source_objects = {item['id']: item for item in result['scene']['objects']}
    objects = {item['id']: item for item in scene['objects']}
    feedback = result['state']['feedback']
    for key, item in source_objects.items():
        if feedback == 'Да, это ' + item['label'].lower() + '!':
            feedback = 'Иә, бұл ' + objects[key]['label'].lower() + '!'
        elif item.get('part_feedback') and feedback == item['part_feedback']:
            feedback = objects[key].get('part_feedback', '')
    localized['state']['feedback'] = _FEEDBACK.get(feedback, feedback)
    for outcome in localized['state']['outcomes']:
        if outcome.get('target_key') in objects: outcome['label'] = objects[outcome['target_key']]['label']
    return localized
