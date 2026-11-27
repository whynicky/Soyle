"""Local rule-based helper for parent-facing practice guidance.

The module deliberately has no network client, model SDK or API key support.
It provides predictable suggestions from a reviewed set of rules while the
adaptive planner handles exercise selection from recorded results.
"""

from __future__ import annotations

import re

from .parent_support_knowledge import (
    AMBIGUOUS_ACTIONS,
    AMBIGUOUS_ANSWER,
    FALLBACK_ACTIONS,
    FALLBACK_ANSWER,
    TOPICS,
)


DISCLAIMER = "Локальный помощник не ставит диагноз и не заменяет врача или логопеда."
SAFETY_NOTE = (
    "Помощник не оценивает ребёнка и не ставит диагноз. При внезапной потере "
    "навыков, проблемах с дыханием или глотанием нужна срочная медицинская оценка; "
    "по вопросам развития и речи обсудите ситуацию с педиатром и логопедом-дефектологом."
)


def _has_any(question: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in question for phrase in phrases)


def _topic_score(question: str, terms: tuple[tuple[str, int], ...]) -> int:
    """Score distinct phrases and word stems, so inflected forms can match."""
    words = set(re.findall(r"[a-zа-яәіңғүұқөһ0-9]+", question))
    score = 0
    for term, weight in terms:
        if " " in term:
            matched = term in question
        else:
            matched = any(word.startswith(term) for word in words)
        if matched:
            score += weight
    return score


def _generate_plan(context: dict) -> dict:
    """Select a stable, duplicate-free subset from an approved list.

    The adaptive planner is preferred for normal lessons. This helper is kept
    for backwards compatibility with the older ``/api/ai/plan`` URL.
    """
    count = int(context.get("target_count", 0))
    selected: list[int] = []
    for exercise in context.get("allowed_exercises", []):
        exercise_id = exercise.get("id")
        if isinstance(exercise_id, int) and exercise_id not in selected:
            selected.append(exercise_id)
        if len(selected) >= count:
            break
    return {
        "title": "Спокойная практика на сегодня",
        "reason": "Задания выбраны локальными правилами из проверенной библиотеки.",
        "parent_tip": "Дайте время ответить и спокойно завершите занятие после отказа.",
        "exercise_ids": selected,
    }


def _answer_parent(context: dict) -> dict:
    """Choose a response card with safety rules and weighted topic matching."""
    question = str(context.get("parent_question", "")).casefold().replace("ё", "е")

    def result(answer: str, actions: list[str], professional: bool = False) -> dict:
        return {
            "answer": answer,
            "suggested_actions": actions,
            "needs_professional_help": professional,
            "safety_note": SAFETY_NOTE,
        }

    # Safety rules always take priority over ordinary topic matching.
    urgent = (
        "задыха", "не дыш", "не может дыш", "трудно дыш", "не может глот", "не глотает",
        "подавил", "поперх", "судорог", "обморок", "внезапно перестал", "внезапно пропал",
        "потерял слова", "потеряла слова", "перестал говорить", "перестала говорить",
        "утратил навы", "утратила навы", "резко ухудш", "кенеттен жоғалт", "сөйлеу қабілетінен айырылды",
        "дем ала алмай", "жұтына алмай", "құрысу",
    )
    if _has_any(question, urgent):
        return result(
            "Внезапная потеря уже освоенных навыков или трудности с дыханием и глотанием требуют медицинской оценки; по переписке нельзя определить причину. Если ребёнку сейчас трудно дышать, он задыхается или теряет сознание, вызывайте местную экстренную помощь.",
            ["Приостановите занятие и обеспечьте безопасность ребёнка", "Запишите, что изменилось и когда это началось", "Свяжитесь с врачом; при остром состоянии — с экстренной службой"],
            True,
        )
    if _has_any(question, ("болит", "больно", "боль", "ауырады", "ауырсын")):
        return result(
            "Не продолжайте упражнение через боль или выраженный дискомфорт. Причину должен оценить медицинский специалист, особенно если боль повторяется или сопровождается другими симптомами.",
            ["Остановите упражнение и успокойте обстановку", "Отметьте, где и когда ребёнок испытывает боль", "Обсудите повторяющиеся симптомы с педиатром"],
            True,
        )

    scored = sorted(
        ((_topic_score(question, topic["terms"]), topic) for topic in TOPICS),
        key=lambda item: item[0],
        reverse=True,
    )
    best_score, best_topic = scored[0]
    second_score, second_topic = scored[1]
    if best_score < 2:
        return result(FALLBACK_ANSWER, FALLBACK_ACTIONS)
    if second_score >= 3 and best_score - second_score <= 1 and best_topic["id"] != second_topic["id"]:
        return result(AMBIGUOUS_ANSWER, AMBIGUOUS_ACTIONS, best_topic["professional"] or second_topic["professional"])
    return result(best_topic["answer"], best_topic["actions"], best_topic["professional"])


def _localize_reply(result):
    from .practice_localization import practice_text
    return {key: [practice_text(text) for text in value] if key == 'suggested_actions' else practice_text(value) if isinstance(value, str) else value for key, value in result.items()}


def generate_plan(context: dict) -> dict:
    return _localize_reply(_generate_plan(context))


def answer_parent(context: dict) -> dict:
    return _localize_reply(_answer_parent(context))
