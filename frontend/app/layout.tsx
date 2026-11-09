import { LocaleBootstrap } from "@/components/LanguagePicker";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./product.css";
import "./branding.css";
import "./child-room.css";
import "./exploration.css";
import "./child-system.css";
import "./navigation.css";
import "./practice-ux.css";
import "./journey.css";
import "./library.css";
import "./scenic-home.css";
import "./communication.css";
import "./playroom.css";
import "./mobile-family.css";
import "./family-refresh.css";
import "./workspace.css";
import "./specialist.css";
import "./adult-workspace.css";

// Reset section anchors on a document reload of the landing page.
const resetLandingScroll = `(() => {
  if (location.pathname !== '/' || performance.getEntriesByType('navigation')[0]?.type !== 'reload') return;
  const fragments = ['#main-content', '#about', '#journey', '#communication', '#situations', '#family', '#start'];
  if (location.hash && !fragments.includes(location.hash)) return;
  const restoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  const reset = () => requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    history.scrollRestoration = restoration;
  });
  if (document.readyState === 'complete') reset();
  else window.addEventListener('pageshow', reset, { once: true });
})();`;

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3006")),
  title: "Söyle - общение и практика",
  description: "Поддерживаемая коммуникация, игровые задания и локальные адаптивные планы Söyle",
  manifest: "/manifest.webmanifest",
  applicationName: "Söyle",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru-RU" data-scroll-behavior="smooth">
      <body>
        <Script id="reset-landing-scroll" strategy="beforeInteractive">{resetLandingScroll}</Script>
        <LocaleBootstrap />
        {children}
      </body>
    </html>
  );
}
