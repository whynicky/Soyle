import { cookies } from "next/headers";
import { landingThemeCookie, parseLandingTheme } from "@/lib/landingTheme";
import { SoyleApp } from "@/components/SoyleApp";

export default async function ApplicationPage({ searchParams }: PageProps<"/app">) {
  const [params, settings] = await Promise.all([searchParams, cookies()]);
  const authMode = params.mode === "register" ? "register" : "login";
  return <SoyleApp authTheme={parseLandingTheme(settings.get(landingThemeCookie)?.value)} authMode={authMode} />;
}
