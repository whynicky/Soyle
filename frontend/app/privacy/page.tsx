"use client";

import Link from "next/link";
import { t, useLocale } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type PrivacyProfile = { operator_configured: boolean; operator_name: string | null; operator_country: string | null; contact_email: string | null; hosting_location: string | null; history_retention_policy: string | null; backup_retention_policy: string | null; deletion_request_policy: string | null };
const getFields = (): Array<[keyof Omit<PrivacyProfile, "operator_configured">, string]> => [["operator_name", t("legal.privacy.ui1")], ["operator_country", t("legal.privacy.ui2")], ["contact_email", t("legal.privacy.ui3")], ["hosting_location", t("legal.privacy.ui4")], ["history_retention_policy", t("legal.privacy.ui5")], ["backup_retention_policy", t("legal.privacy.ui6")], ["deletion_request_policy", t("legal.privacy.ui7")]];
export default function PrivacyPage() {
  useLocale();
  const fields = getFields();
  const [profile, setProfile] = useState<PrivacyProfile | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; api<PrivacyProfile>("/api/privacy").then(value => { if (active) setProfile(value); }).catch(() => { if (active) setError(t("legal.privacy.ui8")); }); return () => { active = false; }; }, []);
  return <main className="legal-page"><Link href="/">{t("legal.privacy.ui9")}</Link><h1>{t("legal.privacy.ui10")}</h1><p>{t("legal.privacy.ui11")}</p>
    <h2>{t("legal.privacy.ui12")}</h2><p>{t("legal.privacy.ui13")}</p>
    {error && <p role="alert">{error}</p>}{!profile && !error && <p role="status">{t("legal.privacy.ui14")}</p>}{profile && <><p>{profile.operator_configured ? t("legal.privacy.ui15") : t("legal.privacy.ui16")}</p><dl>{fields.map(([key, label]) => <div key={key}><dt><strong>{label}</strong></dt><dd>{profile[key] || t("legal.privacy.ui17")}</dd></div>)}</dl></>}
    <h2>{t("legal.privacy.ui18")}</h2><p>{t("legal.privacy.ui19")}</p>
    <h2>{t("legal.privacy.ui20")}</h2><p>{t("legal.privacy.ui21")}</p>
    <h2>{t("legal.privacy.ui22")}</h2><p>{t("legal.privacy.ui23")}</p>
    <h2>{t("legal.privacy.ui24")}</h2><p>{t("legal.privacy.ui25")}</p><p>{t("legal.privacy.ui26")}</p>
  </main>;
}
