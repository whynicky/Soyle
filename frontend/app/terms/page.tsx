"use client";
import Link from "next/link";
import { t, useLocale } from "@/lib/i18n";

export default function TermsPage() {
  useLocale();
  return <main className="legal-page"><Link href="/">{t("legal.terms.ui1")}</Link><h1>{t("legal.terms.ui2")}</h1><p>{t("legal.terms.ui3")}</p><h2>{t("legal.terms.ui4")}</h2><p>{t("legal.terms.ui5")}</p><h2>{t("legal.terms.ui6")}</h2><p>{t("legal.terms.ui7")}</p><h2>{t("legal.terms.ui8")}</h2><p>{t("legal.terms.ui9")}</p><h2>{t("legal.terms.ui10")}</h2><p>{t("legal.terms.ui11")}</p><h2>{t("legal.terms.ui12")}</h2><p>{t("legal.terms.ui13")}</p></main>;
}
