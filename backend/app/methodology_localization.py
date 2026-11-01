"""Read-only editorial preview, separate from source passports and approval."""
import json
import re
from pathlib import Path
from .localization import LOCALE

ROOT = Path(__file__).parent / 'locales'
TEXTS = {}
for name in ('kk-KZ-education.json','kk-KZ-practice.json','kk-KZ-methodology.json'):
    TEXTS.update(json.loads((ROOT/name).read_text()))


def preview(card):
    if LOCALE.get() != 'kk-KZ' or not card:
        return None
    def adapt(value):
        if isinstance(value,dict): return {key:adapt(item) for key,item in value.items()}
        if isinstance(value,list): return [adapt(item) for item in value]
        if isinstance(value,str) and re.search('[А-Яа-яЁё]',value): return TEXTS[value]
        return value
    try:
        return {'language':'kk','status':'needs_review','payload':adapt(card)}
    except KeyError:
        return {'language':'kk','status':'missing','payload':None}
