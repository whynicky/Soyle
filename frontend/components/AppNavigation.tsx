"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BarChart3, Gamepad2, Home, ImageIcon, ChevronUp, LogOut, MessageCircle, Settings, UserRound } from "lucide-react";
import { t, useLocale } from "@/lib/i18n";

type Destination = "home" | "games" | "stories" | "guides" | "aac" | "world" | "progress" | "achievements" | "skills" | "goals" | "parent" | "ai";
export function familyNavigation() {
  return [
    { id: "home" as const, label: t("nav.home"), icon: Home, pages: [
      { id: "home" as Destination, label: t("navigation.overview") },
    ] },
    { id: "games" as const, label: t("nav.lessons"), icon: Gamepad2, pages: [
      { id: "games" as Destination, label: t("navigation.exercises") },
      { id: "stories" as Destination, label: t("nav.stories") },
    ] },
    { id: "aac" as const, label: t("navigation.communication"), icon: MessageCircle, pages: [
      { id: "aac" as Destination, label: t("nav.words") }, { id: "world" as Destination, label: t("nav.world") },
    ] },
    { id: "progress" as const, label: t("navigation.progress"), icon: BarChart3, pages: [
      { id: "progress" as Destination, label: t("navigation.progress") },
    ] },
  ];
}
export function navigationPage(screen: string) {
  if (screen === "learn") return "games";
  if (screen === "my-world") return "world";
  if (["success", "achievements", "skills"].includes(screen)) return "progress";
  return screen;
}
export function familySection(screen: string) {
  if (["session", "exercise-complete", "motor", "sensory", "mixed"].includes(screen)) return "games";
  return familyNavigation().find(section => section.pages.some(page => page.id === navigationPage(screen)))?.id;
}
export function SectionNavigation({ screen, onOpen, className = "" }: { screen: string; onOpen: (screen: Destination) => void; className?: string }) {
  useLocale();
  const section = familyNavigation().find(item => item.id === familySection(screen));
  if (!section || section.pages.length < 2 || ["session", "exercise-complete", "motor", "sensory", "mixed"].includes(screen)) return null;
  return <nav className={`section-navigation ${className}`} aria-label={`${section.label}: ${t("navigation.pages")}`}>
    {section.pages.map(page => <button type="button" key={page.id} aria-current={navigationPage(screen) === page.id ? "page" : undefined} onClick={() => onOpen(page.id)}>{className && (page.id === "world" ? <ImageIcon aria-hidden="true"/> : <MessageCircle aria-hidden="true"/>)}{page.label}</button>)}
  </nav>;
}

export function FamilyMobileNavigation({ screen, onOpen, inert }: { screen: string; onOpen: (screen: Destination) => void; inert?: boolean }) {
  useLocale();
  const current = familySection(screen);
  return <nav className="family-bottom-nav" aria-label={t("nav.sections")} inert={inert}>
    {familyNavigation().map(({id,label,icon: Icon}) => <button key={id} type="button" onClick={() => { if (screen !== id) onOpen(id); }} aria-current={current === id ? "page" : undefined}><Icon aria-hidden="true"/><span>{label}</span></button>)}
  </nav>;
}

export function AccountMenu({ name, onOpen, onLogout, onExpand }: { onExpand?: () => void; name: string; onOpen: (screen: "profile" | "settings") => void; onLogout: () => void }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
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
    <button ref={trigger} type="button" className="account-menu-trigger" aria-label={t("navigation.accountMenu")} aria-expanded={open} aria-controls={panelId} onClick={() => { if (!open) onExpand?.(); setOpen(value => !value); }}><Settings className="account-menu-trigger-icon" size={24} strokeWidth={1.8} aria-hidden="true"/><span className="account-menu-name">{name}</span><ChevronUp className="account-menu-chevron" size={18} aria-hidden="true"/></button>
    {open && <div id={panelId} className="account-menu-panel"><strong>{name}</strong>
      <button type="button" onClick={() => navigate("profile")}><UserRound size={19}/>{t("nav.myProfile")}</button>
      <button type="button" onClick={() => navigate("settings")}><Settings size={19}/>{t("nav.settings")}</button>
      <button type="button" onClick={() => { setOpen(false); onLogout(); }}><LogOut size={19}/>{t("common.logout")}</button>
    </div>}
  </div>;
}
