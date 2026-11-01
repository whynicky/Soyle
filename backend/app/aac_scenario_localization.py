"""Stable canonical labels for guided AAC, independent of translated card text."""
from .aac_localization import library

SUPPORTED_SCENARIOS = frozenset({'request','choice','refusal','feelings','help','answer','observation','past_event','question','routine'})


def can_adapt(content):
    labels = content.get('labels')
    canonical = {card['source_label'] for card in library()}
    return (content.get('scenario_key') in SUPPORTED_SCENARIOS and isinstance(labels, list)
            and bool(labels) and all(label in canonical for label in labels))
