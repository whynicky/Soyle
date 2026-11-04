"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { t } from "@/lib/i18n";

export function RecordHistory<T extends { id: number }>({ initial, hasMore, endpoint, children, wrap, onAccessLost }: {
  initial: T[]; hasMore: boolean; endpoint: string; children: (record: T) => ReactNode; wrap?: (rows: ReactNode, count: number) => ReactNode; onAccessLost?: () => void;
}) {
  const [older, setOlder] = useState<T[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const rows = [...initial, ...older];
  async function more() {
    if (request.current || !rows.length) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const page = await api<{ items: T[]; has_more: boolean }>(
        endpoint + (endpoint.includes("?") ? "&before=" : "?before=") + rows[rows.length - 1].id, { signal: controller.signal }
      );
      if (!controller.signal.aborted) {
        setOlder(previous => [...previous, ...page.items]);
        setFinished(!page.has_more);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : t("errors.request"));
        if (cause instanceof ApiError && [401, 403].includes(cause.status)) onAccessLost?.();
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  const entries = rows.map(row => <Fragment key={row.id}>{children(row)}</Fragment>);
  return <>
    {wrap ? wrap(entries, rows.length) : entries}
    {error && <p role="alert">{error}</p>}
    {hasMore && !finished && <button type="button" className="small-button" disabled={loading} onClick={more}>
      {loading ? t("common.wait") : t("records.more")}
    </button>}
  </>;
}
