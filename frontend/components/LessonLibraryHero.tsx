"use client";

import { LibraryScene } from "./LibraryScene";
import { BookOpen, Gamepad2 } from "lucide-react";
import { useEffect } from "react";
import { t, useLocale } from "@/lib/i18n";

export function LessonLibraryHero({ section, onOpen }: { section: "games" | "stories"; onOpen: (section: "games" | "stories") => void }) {
  useLocale();
  useEffect(() => {
    const nextBackground = new window.Image();
    nextBackground.src = section === "games" ? "/app-illustrations/stories-reading-room-v1.webp" : "/app-illustrations/playroom-room-v1.webp";
  }, [section]);
  return <header className={`family-library-header playroom-hero ${section === "stories" ? "library-heading" : ""}`} aria-labelledby="playroom-title">
    <div className="playroom-hero-copy">
      <h1 id="playroom-title">{t(section === "games" ? "playroom.title" : "storyList.copy019")}</h1>
      <p>{t(section === "games" ? "playroom.subtitle" : "library.storyHint")}</p>
      <nav className="section-navigation playroom-tabs" aria-label={t("nav.lessons")}>
        <button type="button" aria-current={section === "games" ? "page" : undefined} onClick={() => { if (section !== "games") onOpen("games"); }}><Gamepad2/>{t("playroom.games")}</button>
        <button type="button" aria-current={section === "stories" ? "page" : undefined} onClick={() => { if (section !== "stories") onOpen("stories"); }}><BookOpen/>{t("nav.stories")}</button>
      </nav>
    </div>
    <LibraryScene scene={section}/>
  </header>;
}
