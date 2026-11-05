"""Two matched picture series for each familiar word and action."""

from .expanded_content import assets, build_expanded_payload
from .practice_content import ACTIONS, WORDS


def _paired_version(source, title, objective, cover):
    version = build_expanded_payload(source)
    content = version['content']
    bank = content['bank_key']
    is_actions = bank == 'actions'
    version.update(title=title, objective=objective)
    content.update(
        revision='paired-practice-v1',
        exemplar_policy='matched_set',
        cover_media_ref=f'/app-illustrations/exercise-covers/{cover}.webp',
        round_choices=[6, 12, 24],
        default_rounds=6,
    )
    version['completion_rule']['rounds'] = 6
    for level in content['difficulty_levels']:
        level['rounds'] = 6
    media = [content['cover_media_ref']]
    for item in content['stimuli']:
        item['exemplars'] = [f"/learning-paired/{bank}/{item['key']}-b.webp"]
        media.extend([item['media_ref'], *item['exemplars']])
    content['asset_registry'] = assets(media)

    version['method_card'].update(
        target_skill=objective,
        prerequisites=[
            'Знаком с действиями в повседневной жизни' if is_actions else 'Знаком с названиями предметов в повседневной жизни',
            'Может выбрать одну картинку после прослушивания',
        ],
        stimuli_and_responses=(
            '12 знакомых действий, каждое показано двумя детьми. Ответ — нажатие на сцену после вопроса.'
            if is_actions else '12 знакомых предметов, каждый показан в двух вариантах. Ответ — нажатие на картинку после слова.'
        ) + ' Все варианты в раунде из одной серии. При повторе цели появляется другой пример.',
        difficulty_levels=[
            'На выбор 2, 3 или 4 картинки',
            '6 раундов для короткой практики, 12 для всего набора или 24 для двух примеров каждого понятия',
        ],
        ambiguities=[
            'Сопоставляйте ходьбу с бегом и положение сидя со стоянием по позе, рукам и ногам. Реквизит и фон также могут помогать узнать действие.'
            if is_actions else 'Разные цвет и форма помогают проверить узнавание на картинках. Знакомство с реальным предметом наблюдайте отдельно.',
        ],
        real_life_transfer=[
            'Попросите показать знакомое действие у другого человека или персонажа в книге.'
            if is_actions else 'Попросите найти знакомый предмет среди двух реальных вещей, например чашку на столе.',
            'Примите взгляд, показ или жест и отметьте отдельно, понадобилась ли помощь.',
        ],
        evidence_note='Две серии дают возможность заметить узнавание на разных картинках. Бытовое применение наблюдают отдельно.',
    )
    return version


PAIRED_PRACTICE_DRAFTS = (
    _paired_version(WORDS, 'Знакомые предметы: два примера',
                    'Узнать знакомый предмет на двух разных изображениях', 'familiar-objects-pairs'),
    _paired_version(ACTIONS, 'Знакомые действия: разные дети',
                    'Узнать знакомое действие у двух разных детей', 'familiar-actions-pairs'),
)
