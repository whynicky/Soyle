"use client";

import { Download, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, type Exercise } from "@/lib/api";
import { renderChildReport, type ChildDataExport, type ReportVocabulary } from "@/lib/childReport";
import { t, useLocale } from "@/lib/i18n";

export function ChildDataControls({ childId, exercises, onDelete }: {
  childId?: number;
  exercises: readonly Exercise[];
  onDelete: () => void;
}) {
  const locale = useLocale();
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  useEffect(() => () => request.current?.abort(), []);

  async function download(format: "html" | "json") {
    if (!childId || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState("loading");
    try {
      const data = await api<ChildDataExport>(`/api/children/${childId}/export`, {
        cache: "no-store", signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (data?.child?.id !== childId) throw new Error("Invalid child export");
      const vocabulary = format === "html" && data.word_observations?.length
        ? await api<ReportVocabulary>(`/api/vocabulary/${childId}`, {
          cache: "no-store", signal: controller.signal,
        }).catch(() => undefined)
        : undefined;
      if (controller.signal.aborted) return;
      const content = format === "html" ? renderChildReport(data, locale, exercises, vocabulary) : JSON.stringify(data, null, 2);
      const mime = format === "html" ? "text/html;charset=utf-8" : "application/json";
      const url = URL.createObjectURL(new Blob([content], { type: mime }));
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "html" ? `soyle-child-${childId}-report.html` : `soyle-child-${childId}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setState("done");
    } catch {
      if (!controller.signal.aborted) setState("error");
    } finally {
      request.current = null;
    }
  }

  return <section className="data-control data-export-control">
    <div className="data-export-intro">
      <ShieldCheck aria-hidden="true" />
      <span>
        <strong>{t("screen.ParentScreen.ui99")}</strong>
        <small>{t("screen.ParentScreen.ui100")}</small>
        <span role="status">
          {state === "loading" && <small>{t("childReport.loading")}</small>}
          {state === "done" && <small>{t("childReport.downloadStarted")}</small>}
        </span>
        {state === "error" && <small className="data-export-error" role="alert">{t("childReport.error")}</small>}
      </span>
    </div>
    <div className="data-actions">
      <button type="button" className="secondary-button" disabled={!childId} aria-disabled={state === "loading"} onClick={() => void download("html")}>
        <Download size={16} aria-hidden="true" />{t("screen.ParentScreen.ui101")}
      </button>
      <button type="button" className="small-button" disabled={!childId} aria-disabled={state === "loading"} onClick={() => void download("json")}>
        {t("childReport.rawDownload")}
      </button>
      <button type="button" className="small-button danger-button" onClick={onDelete}>{t("screen.ParentScreen.ui102")}</button>
    </div>
  </section>;
}
