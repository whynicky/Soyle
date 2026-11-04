"use client";

import { BarChart3, BookOpen, ClipboardList, FileClock, FileText, FolderOpen, House, Images, KeyRound, MessageCircle, MessageSquareText, ShieldCheck, Target, UserRound, Users } from "lucide-react";
import { t } from "@/lib/i18n";
import { workspaceHref, workspacePages, type WorkspacePage, type WorkspaceRole } from "@/lib/workspacePages";

const icons = { overview: House, observations: ClipboardList, progress: BarChart3, goals: Target, specialist: UserRound, guides: BookOpen, assistant: MessageCircle, photos: Images, words: MessageSquareText, access: KeyRound, exercises: ClipboardList, library: FolderOpen, users: Users, audit: ShieldCheck, usage: FileClock };

export function WorkspaceNavigation({ role, current, childId, onOpen }: {
  role: WorkspaceRole; current?: WorkspacePage; childId?: number; onOpen: (page: WorkspacePage) => void;
}) {
  const pages = workspacePages[role];
  const groups = [...new Set(pages.map(page => page.group))];
  return <nav className="workspace-nav" aria-label={t("screen.AuthenticatedApp.ui54")}>
    {groups.map(group => group && <div className="workspace-nav-group" key={group}>
      <p>{t(group)}</p>
      {pages.filter(page => page.group === group).map(page => {
        const Icon = icons[page.slug as keyof typeof icons] || FileText;
        return <a key={page.slug} href={workspaceHref(role, page, childId)} aria-current={current === page ? "page" : undefined}
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); onOpen(page);
          }}>
          <Icon size={18} strokeWidth={1.7} aria-hidden="true"/><span>{t(page.label)}</span>
        </a>;
      })}
    </div>)}
  </nav>;
}
