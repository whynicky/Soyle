"use client";

import { useEffect } from "react";

const landingFragments = new Set(["#main-content", "#about", "#journey", "#communication", "#situations", "#family", "#start"]);

export function LandingScrollReset() {
  useEffect(() => {
    if (location.pathname !== "/" || performance.getEntriesByType("navigation")[0]?.type !== "reload") return;
    if (location.hash && !landingFragments.has(location.hash)) return;

    const restoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      history.scrollRestoration = restoration;
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
