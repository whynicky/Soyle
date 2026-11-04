import type { MessageKey } from "./locale";

export type WorkspaceRole = "parent" | "admin" | "specialist";
type WorkspaceScreen = "specialist" | "parent" | "progress" | "goals" | "world" | "aac" | "ai" | "guides" | "admin" | "settings" | "profile";
export type WorkspacePage = {
  slug: string; screen: WorkspaceScreen; section?: string; label: MessageKey; group?: MessageKey;
};

export const workspacePages: Record<WorkspaceRole, WorkspacePage[]> = {
  parent: [
    { slug: "overview", screen: "parent", section: "overview", label: "cabinet.overview", group: "workspace.child" },
    { slug: "observations", screen: "parent", section: "practice", label: "familyReview.observations", group: "workspace.child" },
    { slug: "progress", screen: "progress", label: "navigation.progress", group: "workspace.child" },
    { slug: "goals", screen: "goals", label: "navigation.goals", group: "workspace.child" },
    { slug: "specialist", screen: "parent", section: "specialist", label: "cabinet.specialist", group: "workspace.family" },
    { slug: "guides", screen: "guides", label: "nav.guides", group: "workspace.family" },
    { slug: "assistant", screen: "ai", label: "familyReview.assistant", group: "workspace.family" },
    { slug: "photos", screen: "world", label: "workspace.photos", group: "cabinet.materials" },
    { slug: "words", screen: "aac", label: "workspace.words", group: "cabinet.materials" },
    { slug: "access", screen: "parent", section: "access", label: "screen.ParentScreen.ui74", group: "workspace.account" },
    { slug: "profile", screen: "profile", label: "nav.myProfile" },
    { slug: "preferences", screen: "settings", label: "nav.settings" },
  ],
  specialist: [
    { slug: "children", screen: "specialist", section: "children", label: "specialist.copy008", group: "desk.caseload" },
    { slug: "profile", screen: "specialist", section: "profile", label: "desk.profile", group: "workspace.child" },
    { slug: "observations", screen: "specialist", section: "observations", label: "specialist.copy009", group: "workspace.child" },
    { slug: "recommendations", screen: "specialist", section: "recommendations", label: "specialist.copy010", group: "workspace.child" },
    { slug: "history", screen: "specialist", section: "history", label: "specialist.copy011", group: "workspace.child" },
    { slug: "translations", screen: "specialist", section: "translations", label: "desk.translations", group: "cabinet.materials" },
  ],
  admin: [
    { slug: "exercises", screen: "admin", section: "exercises", label: "screen.AdminScreen.ui57", group: "cabinet.materials" },
    { slug: "library", screen: "admin", section: "library", label: "adminQueue.copy013", group: "cabinet.materials" },
    { slug: "users", screen: "admin", section: "users", label: "screen.AdminScreen.ui56", group: "workspace.management" },
    { slug: "audit", screen: "admin", section: "audit", label: "screen.AdminScreen.ui59", group: "workspace.management" },
    { slug: "usage", screen: "admin", section: "usage", label: "screen.AdminScreen.ui58", group: "workspace.management" },
    { slug: "preferences", screen: "settings", label: "nav.settings" },
    { slug: "profile", screen: "profile", label: "nav.myProfile" },
  ],
};

export function readWorkspacePage(role: WorkspaceRole) {
  const pages = workspacePages[role];
  const url = new URL(window.location.href);
  const current = pages.find(page => url.pathname.replace(/\/$/, "") === `/app/${role}/${page.slug}`);
  if (current) return current;
  const legacy = url.searchParams.get("section");
  return (url.searchParams.get("cabinet") === role && pages.find(page => page.section === (legacy === "materials" ? "practice" : legacy))) || pages[0];
}

export function workspaceHref(role: WorkspaceRole, page: WorkspacePage, childId?: number | null) {
  const path = `/app/${role}/${page.slug}`;
  return role !== "admin" && childId ? `${path}?child=${childId}` : path;
}
