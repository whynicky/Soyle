import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { landingThemeCookie, parseLandingTheme } from "@/lib/landingTheme";
import { SiteThemeSurface } from "./PublicTheme";
import { PublicSubpageHeader } from "./PublicSubpageHeader";

export async function LegalPageLayout({ children }: { children: ReactNode }) {
  const theme = parseLandingTheme((await cookies()).get(landingThemeCookie)?.value);
  return <SiteThemeSurface className="legal-theme" initialTheme={theme}>
    <PublicSubpageHeader/>
    {children}
  </SiteThemeSurface>;
}
