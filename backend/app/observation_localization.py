"""Finite authored adaptation of the 24-scene description bank, pending review."""
from copy import deepcopy
import json
from pathlib import Path

_ADAPTATION = json.loads((Path(__file__).parent / 'locales' / 'kk-KZ-observation.json').read_text())
OBSERVATION_TEXT_FIELDS = frozenset({'theme', 'parts', 'options', 'detail_question'})


def translated_scenes(source):
    from .observation_content import SCENES
    if source != SCENES:
        # Retired banks and edited scenes need their own checked adaptation.
        raise KeyError('observation.source_changed')
    return deepcopy(_ADAPTATION['scenes'])


def phrase(parts, language):
    ordered = [parts[0], parts[2], parts[1]] if language == 'kk' and len(parts) == 3 else parts
    return ' '.join(ordered)


def scene_speech(scenes, language):
    result = set()
    messages = ('Кто на картинке?', 'Рассмотри картинку. Кто на ней?', 'Посмотри ещё раз. Можно послушать слова или посмотреть образец.') if language == 'ru' else ('Суретте кім бар?', 'Суретке қара. Онда кім бар?', 'Қайта қара. Сөздерді тыңдауға немесе үлгіні көруге болады.')
    result.update(messages)
    for scene in scenes:
        actor = scene['parts'][0]
        result.add(f'{actor} не істеп жатыр?' if language == 'kk' else f'Что делает {actor.lower()}?')
        result.add(scene['detail_question'] if language == 'kk' else scene['detail_question'].removesuffix('?') + f' {actor.lower()}?')
        for length in (1, 2, 3): result.add(phrase(scene['parts'][:length], language))
        for group in scene['options']: result.update(group)
    return result


def editorial_phrases():
    from .observation_content import SCENES
    return {'ru': scene_speech(SCENES, 'ru'), 'kk': scene_speech(_ADAPTATION['scenes'], 'kk')}
