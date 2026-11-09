import { t } from "@/lib/i18n";

export function WorkspaceSkeleton() {
  return <div className="workspace-skeleton" role="status">
    <span className="sr-only">{t("common.wait")}</span>
    <i aria-hidden="true"/><i aria-hidden="true"/><i aria-hidden="true"/>
  </div>;
}
