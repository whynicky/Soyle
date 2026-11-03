"use client";

import { BookOpen, ChevronRight, Gamepad2 } from "lucide-react";
import { t, useLocale } from "@/lib/i18n";

export function LessonLibraryHero({ section, onOpen }: { section: "games" | "stories"; onOpen: (section: "games" | "stories") => void }) {
  useLocale();
  return <header className={`playroom-hero ${section === "stories" ? "library-heading" : ""}`} aria-labelledby="playroom-title">
    <div className="playroom-hero-copy">
      <h1 id="playroom-title">{t(section === "games" ? "playroom.title" : "storyList.copy019")}</h1>
      <p>{t(section === "games" ? "playroom.subtitle" : "library.storyHint")}</p>
      <nav className="section-navigation playroom-tabs" aria-label={t("nav.lessons")}>
        <button type="button" aria-current={section === "games" ? "page" : undefined} onClick={() => onOpen("games")}><Gamepad2/>{t("playroom.games")}<ChevronRight/></button>
        <button type="button" aria-current={section === "stories" ? "page" : undefined} onClick={() => onOpen("stories")}><BookOpen/>{t("nav.stories")}<ChevronRight/></button>
      </nav>
    </div>
  </header>;
}
