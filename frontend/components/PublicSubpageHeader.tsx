"use client";

import Link from "next/link";
import { t, useLocale } from "@/lib/i18n";
import { BrandLogo } from "./BrandLogo";
import { LanguagePicker } from "./LanguagePicker";
import { SiteThemeToggle } from "./PublicTheme";

export function PublicSubpageHeader() {
  useLocale();

  return <header className="public-subpage-header">
    <div className="public-subpage-island">
      <Link className="public-subpage-brand" href="/" aria-label="Söyle">
        <BrandLogo size={26} decorative/>
      </Link>
      <div className="public-subpage-actions">
        <LanguagePicker compact/>
        <SiteThemeToggle/>
        <Link className="public-subpage-login" href="/app">{t("landing.copy044")}</Link>
      </div>
    </div>
  </header>;
}
