"use client";

import { t, useLocale } from "@/lib/i18n";

import { BookOpen, Check, Ear, MessageCircle, Star, Trophy } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { api, type Dashboard, type Story } from "@/lib/api";

export function AchievementsExperience({ childId, dashboard, onStories, onGames }: { childId?: number; dashboard: Dashboard | null; onStories: () => void; onGames: () => void }) {
  const locale = useLocale();
  const [completedStories, setCompletedStories] = useState<number | null>(null);
  useEffect(() => {
    if (!childId) return;
    let active = true;
    api<Story[]>(`/api/stories/${childId}`).then((stories) => {
      if (active) setCompletedStories(stories.filter((story) => story.completed_at).length);
    }).catch(() => { if (active) setCompletedStories(null); });
    return () => { active = false; };
  }, [childId, locale]);

  const badges = [
    { title: t("achievements.ui1"), detail: t("achievements.ui2"), earned: (dashboard?.total_sessions || 0) > 0, icon: Star, image: "/app-illustrations/badge-first-step.webp" },
    { title: t("achievements.ui3"), detail: t("achievements.ui4"), earned: Boolean(dashboard?.achievements.first_five), icon: Trophy, image: "/app-illustrations/badge-five-attempts.webp" },
    { title: t("achievements.ui5"), detail: t("achievements.ui6"), earned: Boolean(dashboard?.achievements.good_listener), icon: Ear, image: "/app-illustrations/badge-listener.webp" },
    { title: t("achievements.ui7"), detail: t("achievements.ui8"), earned: Boolean(dashboard?.achievements.phrase_master), icon: MessageCircle, image: "/app-illustrations/badge-phrase.webp" },
    { title: t("achievements.ui9"), detail: t("achievements.ui10"), earned: (completedStories || 0) > 0, icon: BookOpen, image: "/app-illustrations/badge-story.webp" },
  ];

  return <div className="v2-screen v2-achievements child-journey page-enter">
    <header className="v2-page-heading"><h1>{t("navigation.progress")}</h1><p>{t("journey.childHint")}</p></header>
    <section className="child-journey-summary">
      <Image src="/app-illustrations/journey-progress.png" alt="" width={240} height={240} priority/>
      <div><span className="kicker">{t("journey.smallSteps")}</span><h2>{t("journey.childTitle")}</h2><p>{t("journey.childEncouragement")}</p><dl><div><dt>{t("achievements.ui15")}</dt><dd>{dashboard?.stars || 0}</dd></div><div><dt>{t("achievements.ui16")}</dt><dd>{completedStories ?? "-"}</dd></div><div><dt>{t("journey.practiceCount")}</dt><dd>{dashboard?.total_sessions || 0}</dd></div></dl><button className="primary-button" onClick={onGames}>{t("ux.chooseExercise")}</button></div>
    </section>
    <section className="child-journey-skills" aria-labelledby="journey-skills-title"><div className="section-heading"><h2 id="journey-skills-title">{t("journey.tryNext")}</h2></div><p>{t("journey.skillsHint")}</p><div>{(dashboard?.skill_progress || []).map(skill => <article key={skill.skill}><h3>{skill.label}</h3><p>{skill.participations ? t("journey.skillPractice", {count:skill.participations}) : t("journey.skillNew")}</p><button type="button" className="small-button" onClick={onGames}>{t("journey.try")}</button></article>)}</div></section>
    <h2>{t("nav.achievements")}</h2>
    <div className="v2-achievement-grid">{badges.map((badge) => { const Icon = badge.icon; return <article key={badge.title} className={badge.earned ? "earned" : ""}><span className="v2-badge-art"><Image src={badge.image} alt="" fill unoptimized sizes="(max-width: 430px) 110px, (max-width: 760px) 45vw, 23vw"/><span className="v2-badge-icon"><Icon/></span></span><div><h2>{badge.title}</h2><p>{badge.detail}</p><small>{badge.earned ? <><Check/>  {t("achievements.ui17")}</> : t("achievements.ui18")}</small></div></article>; })}</div>
    <div className="v2-achievement-links"><button onClick={onStories}><BookOpen/>  {t("achievements.ui19")}</button><button onClick={onGames}><Star/>  {t("achievements.ui20")}</button></div>
  </div>;
}
