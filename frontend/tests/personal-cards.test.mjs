import assert from "node:assert/strict";
import test from "node:test";

import { cardSpeech, cardWord, personalChoiceExercise, personalOutcomes, practiceCards, relationWord } from "../lib/personalCards.ts";

const card = (id, fields) => ({ id, kind: "family", name: "", category: "family", custom_category_id: null, custom_category_label: null, relation: "mama", language: "ru", speech: null, image_data: `data:image/jpeg;base64,${id}`, created_at: "", updated_at: null, ...fields });

test("family words follow the card language, not the interface", () => {
  assert.equal(relationWord("baba", "ru"), "Баба");
  assert.equal(relationWord("baba", "kk"), "Әже");
  assert.equal(cardWord(card(1, { relation: "papa", language: "kk" })), "Әке");
  assert.equal(cardSpeech(card(2, { name: "Айгуль" })), "Мама");
  assert.equal(cardSpeech(card(3, { speech: "Айгу́ль" })), "Айгу́ль");
  assert.equal(cardWord(card(4, { kind: "word", category: "animals", relation: null, name: "Барсик" })), "Барсик");
});

test("personal exercise uses one language and tells repeated relations apart by name", () => {
  const cards = [
    card(1, { relation: "tetya", name: "Айгуль" }), card(2, { relation: "tetya", name: "Сауле" }),
    card(3, { relation: "papa" }), card(4, { relation: "baba", language: "kk" }),
  ];
  assert.equal(practiceCards(cards).cards.length, 3);
  const exercise = personalChoiceExercise(cards, "Найди", "family");
  const stimuli = exercise.engine.content.stimuli;
  assert.equal(exercise.engine.language, "ru");
  assert.deepEqual(stimuli.map(item => item.speech), ["Тётя Айгуль", "Тётя Сауле", "Папа"]);
  assert.ok(exercise.engine.content.difficulty_levels.every(level => level.option_count <= 3));
  assert.equal(personalChoiceExercise([card(9, {})], "Найди", "family"), null);
});

test("round log becomes per-card results", () => {
  assert.deepEqual(personalOutcomes({ round_outcomes: [
    { target_key: "card-7", outcome: "independent", attempts: 1 },
    { target_key: "card-8", outcome: "modelled", attempts: 3 },
    { target_key: "cup", outcome: "independent", attempts: 1 },
  ] }), [{ card_id: 7, outcome: "independent", attempts: 1 }, { card_id: 8, outcome: "modelled", attempts: 3 }]);
  assert.deepEqual(personalOutcomes(undefined), []);
});
