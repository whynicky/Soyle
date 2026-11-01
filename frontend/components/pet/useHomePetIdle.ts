"use client";
import { useEffect, useState } from 'react';
import { homePetDelay, nextHomePetState, type HomePetState } from '@/lib/homePet';

/** No speech, bubbles, or exercise events: only the home Rive pose is scheduled. */
export function useHomePetIdle(active: boolean, reduced: boolean) {
  const [state, setState] = useState<HomePetState>('sit');
  useEffect(() => {
    if (!active) return;
    let current: HomePetState = 'sit';
    let previous: HomePetState | null = null;
    let timer: ReturnType<typeof setTimeout>;
    const reset = setTimeout(() => setState('sit'), 0);
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const next = nextHomePetState(current, previous, reduced);
        previous = current; current = next;
        setState(next); schedule();
      }, homePetDelay(current));
    }
    // Restart the inactivity interval after interaction; never advance on a click
    // or while a tab is hidden. The caller pauses us for explicit reactions/drag.
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach(event => document.addEventListener(event, schedule, { passive: true }));
    schedule();
    return () => {
      clearTimeout(timer); clearTimeout(reset);
      events.forEach(event => document.removeEventListener(event, schedule));
    };
  }, [active, reduced]);
  return state;
}
