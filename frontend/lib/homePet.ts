/** HomeCompanion.homeState. The existing Companion.mood (0–5) is unchanged. */
export const homePetStates = {
  sit: { value: 10, animation: 'Home • Sit idle' },
  read: { value: 11, animation: 'Home • Read book' },
  stand: { value: 12, animation: 'Home • Stand idle' },
  sleepy: { value: 13, animation: 'Home • Sleepy' },
  wake: { value: 14, animation: 'Home • Wake stretch' },
  look: { value: 15, animation: 'Home • Look around' },
  happy: { value: 16, animation: 'Home • Small happy' },
} as const;
export type HomePetState = keyof typeof homePetStates;
const transitions: Record<HomePetState, readonly (readonly [HomePetState, number])[]> = {
  sit: [['read', 4], ['look', 4], ['stand', 2], ['happy', 1]],
  read: [['sit', 8], ['look', 2]],
  look: [['sit', 8], ['read', 2]],
  stand: [['sit', 7], ['sleepy', 3]],
  sleepy: [['wake', 1]],
  wake: [['stand', 1]],
  happy: [['sit', 1]],
};
export function nextHomePetState(current: HomePetState, previous: HomePetState | null, reduced: boolean, random = Math.random): HomePetState {
  if (current === 'stand' && previous === 'wake') return 'sit';
  const candidates = transitions[current].filter(([state]) => !reduced || state !== 'sleepy');
  // Do not keep alternating between the same two activities at the sitting hub.
  const fresh = current === 'sit' ? candidates.filter(([state]) => state !== previous) : candidates;
  const choices = fresh.length ? fresh : candidates;
  let pick = random() * choices.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [state, weight] of choices) { pick -= weight; if (pick < 0) return state; }
  return choices[choices.length - 1]?.[0] || 'sit';
}
export function homePetDelay(state: HomePetState, random = Math.random): number {
  // Brief transitional gestures finish once; quiet activities last 10–25 seconds.
  if (state === 'wake') return 3600;
  if (state === 'happy') return 3200;
  return 10000 + Math.floor(Math.min(.999999, Math.max(0, random())) * 15001);
}
