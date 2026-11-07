import { cookies } from "next/headers";
import { landingThemeCookie, parseLandingTheme } from "@/lib/landingTheme";
import { SoyleApp } from "@/components/SoyleApp";

export default async function ApplicationPage() {
  return <SoyleApp authTheme={parseLandingTheme((await cookies()).get(landingThemeCookie)?.value)} />;
}
