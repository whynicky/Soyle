import assert from "node:assert/strict";
import test from "node:test";

import { setLocale } from "../lib/locale.ts";
import { exerciseCountLabel, SESSION_EXERCISE_COUNTS } from "../lib/homePractice.ts";

test("duration choices create visibly different plan sizes", () => {
  assert.deepEqual(SESSION_EXERCISE_COUNTS, { 3: 2, 5: 3, 10: 5 });
  assert.equal(exerciseCountLabel(1), "1 задание");
  assert.equal(exerciseCountLabel(3), "3 задания");
  assert.equal(exerciseCountLabel(5), "5 заданий");
});

test("Kazakh plan counts follow a live locale switch", () => {
  setLocale("kk-KZ");
  try { assert.equal(exerciseCountLabel(3), "3 тапсырма"); }
  finally { setLocale("ru-RU"); }
  assert.equal(exerciseCountLabel(3), "3 задания");
});
