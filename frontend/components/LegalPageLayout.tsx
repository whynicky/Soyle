import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { landingThemeCookie, parseLandingTheme } from "@/lib/landingTheme";
import { LanguagePicker } from "./LanguagePicker";
import { SiteThemeChoice, SiteThemeSurface } from "./PublicTheme";

export async function LegalPageLayout({ children }: { children: ReactNode }) {
  const theme = parseLandingTheme((await cookies()).get(landingThemeCookie)?.value);
  return <SiteThemeSurface className="legal-theme" initialTheme={theme}>
    <header className="legal-toolbar">
      <LanguagePicker compact/>
      <SiteThemeChoice/>
    </header>
    {children}
  </SiteThemeSurface>;
}
