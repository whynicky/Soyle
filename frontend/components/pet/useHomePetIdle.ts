"use client";
import { useEffect, useRef, useState } from 'react';
import { homePetDelay, nextHomePetState, type HomePetState } from '@/lib/homePet';

/** Pauses retain the pose: dragging/visibility never teleport the anatomy. */
export function useHomePetIdle(active: boolean, reduced: boolean) {
  const [state, setState] = useState<HomePetState>('stand');
  const current = useRef<HomePetState>('stand');
  const previous = useRef<HomePetState | null>(null);
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const next = nextHomePetState(current.current, previous.current, reduced);
        previous.current = current.current; current.current = next;
        setState(next); schedule();
      }, homePetDelay(current.current));
    }
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach(event => document.addEventListener(event, schedule, { passive: true }));
    schedule();
    return () => {
      clearTimeout(timer);
      events.forEach(event => document.removeEventListener(event, schedule));
    };
  }, [active, reduced]);
  return state;
}
