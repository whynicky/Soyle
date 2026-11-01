/** HomeCompanion.homeState; legacy Companion.mood (0–5) stays unchanged. */
export const homePetStates = {
  sit: { value: 10, animation: 'Home • Sit idle' },
  read: { value: 11, animation: 'Home • Read book' },
  stand: { value: 12, animation: 'Home • Stand idle' },
  sleepy: { value: 13, animation: 'Home • Sleepy' },
  wake: { value: 14, animation: 'Home • Wake stretch' },
  look: { value: 15, animation: 'Home • Look around' },
  happy: { value: 16, animation: 'Home • Small happy' },
  lie: { value: 17, animation: 'Home • Lie down' },
} as const;
export type HomePetState = keyof typeof homePetStates;
const transitions: Record<HomePetState, readonly (readonly [HomePetState, number])[]> = {
  stand: [['sit', 1]],
  sit: [['read', 4], ['look', 4], ['lie', 2], ['stand', 1], ['happy', 1]],
  read: [['sit', 1]],
  look: [['sit', 1]],
  lie: [['wake', 7], ['sleepy', 3]],
  sleepy: [['wake', 1]],
  wake: [['sit', 1]],
  happy: [['sit', 1]],
};
export function nextHomePetState(current: HomePetState, previous: HomePetState | null, reduced: boolean, random = Math.random): HomePetState {
  const candidates = transitions[current].filter(([state]) => !reduced || !['lie', 'sleepy'].includes(state));
  const fresh = current === 'sit' ? candidates.filter(([state]) => state !== previous) : candidates;
  const choices = fresh.length ? fresh : candidates;
  let pick = random() * choices.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [state, weight] of choices) { pick -= weight; if (pick < 0) return state; }
  return choices[choices.length - 1]?.[0] || 'sit';
}
export function homePetDelay(state: HomePetState, random = Math.random): number {
  if (state === 'wake') return 4400;
  if (state === 'happy') return 3600;
  return 10000 + Math.floor(Math.min(.999999, Math.max(0, random())) * 15001);
}
