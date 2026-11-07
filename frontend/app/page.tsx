import { cookies } from "next/headers";
import { LandingPage } from "@/components/LandingPage";
import { landingThemeCookie, parseLandingTheme } from "@/lib/landingTheme";

// Run before the anchor targets are parsed so a reload starts at the hero.
const resetLandingScroll = `(() => {
  if (performance.getEntriesByType('navigation')[0]?.type !== 'reload') return;
  const fragments = ['#main-content', '#about', '#journey', '#communication', '#family', '#access', '#questions'];
  if (location.hash && !fragments.includes(location.hash)) return;
  const restoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  window.addEventListener('pageshow', () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      history.scrollRestoration = restoration;
    });
  }, { once: true });
})();`;

export default async function Home() {
  const theme = parseLandingTheme((await cookies()).get(landingThemeCookie)?.value);
  return <>
    <script dangerouslySetInnerHTML={{ __html: resetLandingScroll }} />
    <LandingPage initialTheme={theme} />
  </>;
}
