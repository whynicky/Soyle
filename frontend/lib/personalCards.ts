import type { Exercise, FamilyRelation, PersonalCard, PersonalWordCategory } from "./api.ts";
import { translate, type MessageKey } from "./locale.ts";

/** Fixed order of the «Моя семья» module: the closest people first. */
export const familyRelations: readonly FamilyRelation[] = ["mama", "papa", "baba", "deda", "tetya", "dyadya"];
/** Topic keys shared with thematic sections, so a section can pick personal cards by key. */
export const personalWordCategories: readonly PersonalWordCategory[] = ["people", "animals", "toys", "food", "home", "clothing", "places"];

export const relationKey = (relation: FamilyRelation) => `personal.relation.${relation}` as MessageKey;
export const categoryKey = (category: PersonalWordCategory) => `personal.category.${category}` as MessageKey;

/** The relation word in the card's own language, independent of the interface language. */
export function relationWord(relation: FamilyRelation, language: "ru" | "kk") {
  return translate(language === "kk" ? "kk-KZ" : "ru-RU", relationKey(relation));
}

/** The word printed on a card for the child. */
export function cardWord(card: PersonalCard) {
  return card.kind === "family" && card.relation ? relationWord(card.relation, card.language) : card.name;
}

/** What the voice says: the parent's pronunciation hint wins, then the relation word or the name. */
export function cardSpeech(card: PersonalCard) {
  return (card.speech || cardWord(card)).trim();
}

export function cardCategoryLabel(card: PersonalCard, t: (key: MessageKey) => string) {
  if (card.kind === "family") return t("personal.family.title");
  if (card.category === "custom") return card.custom_category_label || t("personal.category.custom");
  return t(categoryKey(card.category as PersonalWordCategory));
}

export const minimumPracticeCards = 2;

/** Cards of one language form one exercise: one voice must say every target. */
export function practiceCards(cards: readonly PersonalCard[]) {
  const counts = new Map<"ru" | "kk", number>();
  for (const card of cards) counts.set(card.language, (counts.get(card.language) || 0) + 1);
  const language = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "ru";
  return { language, cards: cards.filter(card => card.language === language) };
}

const cardKey = (card: PersonalCard) => `card-${card.id}`;
export const cardIdFromKey = (key: unknown) => typeof key === "string" && key.startsWith("card-") ? Number(key.slice(5)) || null : null;

/**
 * Builds an «Послушай и выбери» exercise from personal cards for the existing
 * auditory-choice runner. Any thematic section can pass its own cards (by topic key).
 */
export function personalChoiceExercise(cards: readonly PersonalCard[], title: string, bank: string): Exercise | null {
  const { language, cards: selected } = practiceCards(cards);
  if (selected.length < minimumPracticeCards) return null;
  const words = selected.map(cardSpeech);
  const stimuli = selected.map((card, index) => {
    // Two aunts must not sound the same: add the name when a relation word repeats.
    const duplicate = words.filter(word => word.toLocaleLowerCase() === words[index].toLocaleLowerCase()).length > 1;
    const word = cardWord(card);
    const label = duplicate && card.name ? `${word} ${card.name}` : word;
    return { key: cardKey(card), label, speech: duplicate && card.name && !card.speech ? label : cardSpeech(card), media_ref: card.image_data };
  });
  const levels = ([1, 2, 3] as const).map(level => ({ level, option_count: Math.min(level + 1, selected.length, 4) as 2 | 3 | 4, rounds: 6, max_attempts: 3 }));
  return {
    id: 0, module: "sensory", title, instruction: title, difficulty: selected.length > 2 ? 2 : 1, target: bank, icon: "", skill: null, is_active: true,
    engine: {
      version_id: 0, version: 1, mechanic: "auditory_choice", language, objective: title, response_mode: "single_tap",
      prompt_policy: {}, completion_rule: {},
      // Family-authored material: it never enters the platform publication workflow.
      review_status: "approved", publication_status: "published",
      review_gate: { approved: true, demo_only: false, technical_status: "family_material", methodology_status: "family_material", accessibility_status: "family_material", release_status: "family_material" },
      content: { stimuli, bank_key: `personal-${bank}`, default_rounds: Math.min(8, Math.max(4, selected.length * 2)), round_choices: [4, 6, 8], max_rounds: 12, difficulty_levels: levels },
    },
  };
}

export type PersonalOutcome = { card_id: number; outcome: "independent" | "prompted" | "modelled"; attempts: number };
/** Converts the runner's round log into per-card results for the parent. */
export function personalOutcomes(details: Record<string, unknown> | undefined): PersonalOutcome[] {
  const rounds = Array.isArray(details?.round_outcomes) ? details.round_outcomes as Array<Record<string, unknown>> : [];
  return rounds.flatMap(round => {
    const cardId = cardIdFromKey(round.target_key);
    const outcome = round.outcome;
    if (!cardId || (outcome !== "independent" && outcome !== "prompted" && outcome !== "modelled")) return [];
    return [{ card_id: cardId, outcome, attempts: Math.min(10, Math.max(1, Number(round.attempts) || 1)) }];
  });
}
