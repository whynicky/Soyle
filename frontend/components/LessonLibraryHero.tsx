"use client";

import { LibraryScene } from "./LibraryScene";
import { BookOpen, Gamepad2, Users } from "lucide-react";
import { useEffect } from "react";
import { t, useLocale } from "@/lib/i18n";

type LessonSection = "games" | "stories" | "family";
const heading = {
  games: { title: "playroom.title", text: "playroom.subtitle", scene: "games" },
  stories: { title: "storyList.copy019", text: "library.storyHint", scene: "stories" },
  family: { title: "personal.family.title", text: "personal.family.childLead", scene: "world" },
} as const;

export function LessonLibraryHero({ section, onOpen }: { section: LessonSection; onOpen: (section: LessonSection) => void }) {
  useLocale();
  useEffect(() => {
    const nextBackground = new window.Image();
    nextBackground.src = section === "games" ? "/app-illustrations/stories-reading-room-v1.webp" : "/app-illustrations/playroom-room-v1.webp";
  }, [section]);
  const tab = (target: LessonSection, Icon: typeof Gamepad2, label: string) => <button type="button" aria-current={section === target ? "page" : undefined} onClick={() => { if (section !== target) onOpen(target); }}><Icon/>{label}</button>;
  return <header className={`family-library-header playroom-hero ${section !== "games" ? "library-heading" : ""}`} aria-labelledby="playroom-title">
    <div className="playroom-hero-copy">
      <h1 id="playroom-title">{t(heading[section].title)}</h1>
      <p>{t(heading[section].text)}</p>
      <nav className="section-navigation playroom-tabs" aria-label={t("nav.lessons")}>
        {tab("games", Gamepad2, t("playroom.games"))}
        {tab("stories", BookOpen, t("nav.stories"))}
        {tab("family", Users, t("personal.family.title"))}
      </nav>
    </div>
    <LibraryScene scene={heading[section].scene}/>
  </header>;
}
