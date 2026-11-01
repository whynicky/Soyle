"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Gamepad2, Home, ChevronUp, LogOut, MessageCircle, Settings, UserRound } from "lucide-react";
import { t, useLocale } from "@/lib/i18n";

type Destination = "home" | "games" | "stories" | "guides" | "aac" | "world" | "progress" | "achievements" | "skills" | "goals" | "parent" | "ai";
export function familyNavigation(role: string) {
  const student = role === "student";
  return [
    { id: "home" as const, label: t("nav.home"), icon: Home, pages: [
      { id: "home" as Destination, label: t("navigation.overview") },
      ...(!student ? [{ id: "parent" as Destination, label: t("nav.parent") }, { id: "ai" as Destination, label: t("navigation.advice") }] : []),
    ] },
    { id: "games" as const, label: t("nav.lessons"), icon: Gamepad2, pages: [
      { id: "games" as Destination, label: t("navigation.exercises") },
      student ? { id: "stories" as Destination, label: t("nav.stories") } : { id: "guides" as Destination, label: t("nav.guides") },
    ] },
    { id: "aac" as const, label: t("navigation.communication"), icon: MessageCircle, pages: [
      { id: "aac" as Destination, label: t("nav.words") }, { id: "world" as Destination, label: t("nav.world") },
    ] },
    { id: "progress" as const, label: t("navigation.progress"), icon: BarChart3, pages: student ? [
      { id: "progress" as Destination, label: t("navigation.progress") },
    ] : [{ id: "progress" as Destination, label: t("navigation.results") }, { id: "goals" as Destination, label: t("navigation.goals") }] },
  ];
}
export function navigationPage(screen: string) {
  if (screen === "learn") return "games";
  if (screen === "my-world") return "world";
  if (["success", "achievements", "skills"].includes(screen)) return "progress";
  return screen;
}
export function familySection(screen: string, role: string) {
  if (["session", "exercise-complete", "motor", "sensory", "mixed"].includes(screen)) return "games";
  return familyNavigation(role).find(section => section.pages.some(page => page.id === navigationPage(screen)))?.id;
}
export function SectionNavigation({ screen, role, onOpen }: { screen: string; role: string; onOpen: (screen: Destination) => void }) {
  useLocale();
  const section = familyNavigation(role).find(item => item.id === familySection(screen, role));
  if (!section || section.pages.length < 2 || ["session", "exercise-complete", "motor", "sensory", "mixed"].includes(screen)) return null;
  return <nav className="section-navigation" aria-label={`${section.label}: ${t("navigation.pages")}`}>
    {section.pages.map(page => <button type="button" key={page.id} aria-current={navigationPage(screen) === page.id ? "page" : undefined} onClick={() => onOpen(page.id)}>{page.label}</button>)}
  </nav>;
}

export function AccountMenu({ name, onOpen, onLogout, onExpand }: { onExpand?: () => void; name: string; onOpen: (screen: "profile" | "settings") => void; onLogout: () => void }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);
  function navigate(screen: "profile" | "settings") { setOpen(false); onOpen(screen); trigger.current?.focus(); }
  return <div className="account-menu" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <button ref={trigger} type="button" className="account-menu-trigger" aria-label={t("navigation.accountMenu")} aria-expanded={open} aria-controls="account-menu-panel" onClick={() => { if (!open) onExpand?.(); setOpen(value => !value); }}><span className="avatar small" aria-hidden="true">{name[0]}</span><span className="account-menu-name">{name}</span><ChevronUp className="account-menu-chevron" size={18} aria-hidden="true"/></button>
    {open && <div id="account-menu-panel" className="account-menu-panel"><strong>{name}</strong>
      <button type="button" onClick={() => navigate("profile")}><UserRound size={19}/>{t("nav.myProfile")}</button>
      <button type="button" onClick={() => navigate("settings")}><Settings size={19}/>{t("nav.settings")}</button>
      <button type="button" onClick={() => { setOpen(false); onLogout(); }}><LogOut size={19}/>{t("common.logout")}</button>
    </div>}
  </div>;
}
