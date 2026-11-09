import { cookies } from "next/headers";
import { LandingPage } from "@/components/LandingPage";
import { landingThemeCookie, parseLandingTheme } from "@/lib/landingTheme";

export default async function Home() {
  const theme = parseLandingTheme((await cookies()).get(landingThemeCookie)?.value);
  return <LandingPage initialTheme={theme} />;
}
