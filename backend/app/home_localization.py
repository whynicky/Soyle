"""Static Kazakh editorial previews; never publish or approve a home activity."""
from copy import deepcopy
from .localization import LOCALE
from .p1_content import HOME_ACTIVITY_DRAFTS
from .p15_content import EXTRA_HOME_ACTIVITY_DRAFTS, EXISTING_HOME_METHOD_CARDS
from .practice_localization import practice_text

FIELDS = ('title','objective','materials','adult_instructions','accepted_responses','prompts','stop_conditions','method_card')


def preview(activity):
    if LOCALE.get() != 'kk-KZ':
        return activity
    source = next((item for item in (*HOME_ACTIVITY_DRAFTS,*EXTRA_HOME_ACTIVITY_DRAFTS)
                   if item['key'] == activity.get('activity_key')), None)
    if not source:
        return {**activity, 'translation_status':'missing', 'source_language':'ru'}
    expected = {**source, 'method_card':source.get('method_card', EXISTING_HOME_METHOD_CARDS.get(source['key'],{}))}
    # Edited/custom content requires a new translation; never reuse stale text.
    if any(activity.get(field) != expected[field] for field in FIELDS):
        return {**activity, 'translation_status':'missing', 'source_language':'ru'}
    def adapt(value):
        if isinstance(value,dict): return {key:adapt(item) for key,item in value.items()}
        if isinstance(value,list): return [adapt(item) for item in value]
        return practice_text(value) if isinstance(value,str) else value
    result = deepcopy(activity)
    for field in FIELDS: result[field] = adapt(activity[field])
    result.update(translation_status='needs_review', source_language='ru', language='kk')
    return result
