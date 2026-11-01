"use client";

import { t, useLocale } from "@/lib/i18n";

import { useState } from "react";
import { api, type User } from "@/lib/api";

export function SpecialistInvitation({ token, user, onClose }: { token: string; user: User | null; onClose: () => void }) {
  useLocale();
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [sent, setSent] = useState(false);
  const accept = async () => {
    setBusy(true); setError("");
    try { await api("/api/specialist-invitations/claim", { method: "POST", body: JSON.stringify({ token }) }); setSent(true); window.history.replaceState(null, "", window.location.pathname + window.location.search); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("specialistInvitation.ui1")); }
    finally { setBusy(false); }
  };
  return <section className="invitation-banner" aria-labelledby="invite-title"><div><span className="kicker">{t("specialistInvitation.ui2")}</span><h2 id="invite-title">{sent ? t("specialistInvitation.ui3") : t("specialistInvitation.ui4")}</h2><p>{sent ? t("specialistInvitation.ui5") : !user ? t("specialistInvitation.ui6") : user.role !== "specialist" ? t("specialistInvitation.ui7") : t("specialistInvitation.sender", { name: user.full_name, username: user.username })}</p>{error && <p role="alert">{error}</p>}</div><div className="cabinet-actions">{user?.role === "specialist" && !sent && <button className="primary-button" disabled={busy} onClick={accept}>{busy ? t("specialistInvitation.ui8") : t("specialistInvitation.ui9")}</button>}<button className="secondary-button" onClick={onClose}>{sent ? t("specialistInvitation.ui10") : t("specialistInvitation.ui11")}</button></div></section>;
}
